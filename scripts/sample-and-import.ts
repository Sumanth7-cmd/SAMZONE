import * as fs from "fs";
import WebSocket from "ws";
(globalThis as any).WebSocket = WebSocket;

import { parse } from "csv-parse";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Check your .env file.");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const PRODUCTS_CSV = "/home/rishi/Desktop/archive (7)/amazon_products.csv";
const CATEGORIES_CSV = "/home/rishi/Desktop/archive (7)/amazon_categories.csv";
const TARGET_SAMPLE_SIZE = 8000;
const BATCH_SIZE = 500;

interface ProductRow {
  asin: string;
  title: string;
  product_url: string;
  image_url: string;
  rating: number | null;
  reviews_count: number | null;
  price: number | null;
  list_price: number | null;
  category_id: number;
  category_name: string;
  is_best_seller: boolean;
  bought_last_month: number | null;
}

function toNumberOrNull(v: string): number | null {
  if (v === undefined || v === null || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function loadCategories(): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  const parser = fs.createReadStream(CATEGORIES_CSV).pipe(parse({ columns: true, skip_empty_lines: true }));
  for await (const record of parser) {
    map.set(Number(record.id), record.category_name);
  }
  return map;
}

// Pass 1: count rows per category so sample allocation is proportional to the
// real distribution, and track any malformed rows (missing asin/title, or a
// category_id that doesn't resolve) so they're excluded and reported.
async function countByCategory(): Promise<{ counts: Map<number, number>; malformed: number; total: number }> {
  const counts = new Map<number, number>();
  let malformed = 0;
  let total = 0;

  const parser = fs.createReadStream(PRODUCTS_CSV).pipe(
    parse({ columns: true, skip_empty_lines: true, relax_column_count: true, relax_quotes: true })
  );

  for await (const record of parser) {
    total++;
    const asin = (record.asin ?? "").trim();
    const title = (record.title ?? "").trim();
    const cid = Number(record.category_id);
    if (!asin || !title || !Number.isFinite(cid)) {
      malformed++;
      continue;
    }
    counts.set(cid, (counts.get(cid) ?? 0) + 1);
  }

  return { counts, malformed, total };
}

// Largest-remainder method: allocate TARGET_SAMPLE_SIZE across categories
// proportional to their share of valid rows, rounding so the total is exact.
function allocateSampleTargets(counts: Map<number, number>, targetTotal: number): Map<number, number> {
  const totalValid = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  const targets = new Map<number, number>();
  const remainders: { cid: number; remainder: number }[] = [];
  let allocated = 0;

  for (const [cid, count] of counts) {
    const exact = (count / totalValid) * targetTotal;
    const floor = Math.floor(exact);
    targets.set(cid, floor);
    allocated += floor;
    remainders.push({ cid, remainder: exact - floor });
  }

  remainders.sort((a, b) => b.remainder - a.remainder);
  let remaining = targetTotal - allocated;
  for (let i = 0; i < remainders.length && remaining > 0; i++, remaining--) {
    targets.set(remainders[i].cid, (targets.get(remainders[i].cid) ?? 0) + 1);
  }

  return targets;
}

// Pass 2: reservoir-sample (Algorithm R) independently within each category,
// using the per-category target size computed above, in a single streaming
// pass over the 1.4M-row file.
async function reservoirSample(
  targets: Map<number, number>,
  categoryNames: Map<number, string>
): Promise<{ sample: ProductRow[]; malformed: number }> {
  const reservoirs = new Map<number, ProductRow[]>();
  const seenCount = new Map<number, number>();
  let malformed = 0;

  const parser = fs.createReadStream(PRODUCTS_CSV).pipe(
    parse({ columns: true, skip_empty_lines: true, relax_column_count: true, relax_quotes: true })
  );

  for await (const record of parser) {
    const asin = (record.asin ?? "").trim();
    const title = (record.title ?? "").trim();
    const cid = Number(record.category_id);
    if (!asin || !title || !Number.isFinite(cid)) {
      malformed++;
      continue;
    }

    const target = targets.get(cid) ?? 0;
    if (target === 0) continue;

    const n = (seenCount.get(cid) ?? 0) + 1;
    seenCount.set(cid, n);

    const row: ProductRow = {
      asin,
      title,
      product_url: (record.productURL ?? "").trim(),
      image_url: (record.imgUrl ?? "").trim(),
      rating: toNumberOrNull(record.stars),
      reviews_count: toNumberOrNull(record.reviews),
      price: toNumberOrNull(record.price),
      list_price: toNumberOrNull(record.listPrice),
      category_id: cid,
      category_name: categoryNames.get(cid) ?? "Unknown",
      is_best_seller: String(record.isBestSeller).trim().toLowerCase() === "true",
      bought_last_month: toNumberOrNull(record.boughtInLastMonth),
    };

    let reservoir = reservoirs.get(cid);
    if (!reservoir) {
      reservoir = [];
      reservoirs.set(cid, reservoir);
    }

    if (reservoir.length < target) {
      reservoir.push(row);
    } else {
      const j = Math.floor(Math.random() * n);
      if (j < target) reservoir[j] = row;
    }
  }

  const sample: ProductRow[] = [];
  for (const reservoir of reservoirs.values()) sample.push(...reservoir);
  return { sample, malformed };
}

async function importBatches(rows: ProductRow[]): Promise<{ inserted: number; failed: number }> {
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("products_new").upsert(batch, { onConflict: "asin" });
    if (error) {
      console.error(`Batch ${i}-${i + batch.length} failed: ${error.message}`);
      failed += batch.length;
    } else {
      inserted += batch.length;
    }
    if ((i / BATCH_SIZE) % 4 === 0) {
      console.log(`Imported ${inserted + failed}/${rows.length}...`);
    }
  }

  return { inserted, failed };
}

async function main() {
  console.log("Loading categories...");
  const categoryNames = await loadCategories();
  console.log(`Loaded ${categoryNames.size} categories.`);

  console.log("Pass 1/2: counting rows per category...");
  const { counts, malformed: malformedPass1, total } = await countByCategory();
  console.log(`Total rows read: ${total}`);
  console.log(`Malformed rows (missing asin/title/category): ${malformedPass1}`);
  console.log(`Categories with at least one valid row: ${counts.size}`);

  const targets = allocateSampleTargets(counts, TARGET_SAMPLE_SIZE);

  console.log("Pass 2/2: reservoir-sampling proportionally per category...");
  const { sample, malformed: malformedPass2 } = await reservoirSample(targets, categoryNames);
  console.log(`Sample built: ${sample.length} rows across ${new Set(sample.map((r) => r.category_id)).size} categories.`);

  // Dedup by asin defensively (source file already had zero duplicate asins,
  // but this guarantees the invariant regardless).
  const seenAsins = new Set<string>();
  const deduped: ProductRow[] = [];
  let duplicatesSkipped = 0;
  for (const row of sample) {
    if (seenAsins.has(row.asin)) {
      duplicatesSkipped++;
      continue;
    }
    seenAsins.add(row.asin);
    deduped.push(row);
  }

  console.log(`Duplicates skipped: ${duplicatesSkipped}`);
  console.log(`Final rows to import: ${deduped.length}`);

  console.log("Importing into products_new...");
  const { inserted, failed } = await importBatches(deduped);

  console.log("\n--- Import summary ---");
  console.log(`Total rows read from CSV: ${total}`);
  console.log(`Malformed rows skipped: ${malformedPass1 + malformedPass2}`);
  console.log(`Categories represented in sample: ${new Set(deduped.map((r) => r.category_id)).size} / ${categoryNames.size}`);
  console.log(`Duplicates skipped: ${duplicatesSkipped}`);
  console.log(`Successfully imported: ${inserted}`);
  console.log(`Failed: ${failed}`);

  fs.writeFileSync(
    __dirname + "/sample-summary.json",
    JSON.stringify(
      {
        totalRead: total,
        malformedSkipped: malformedPass1 + malformedPass2,
        categoriesRepresented: new Set(deduped.map((r) => r.category_id)).size,
        totalCategories: categoryNames.size,
        duplicatesSkipped,
        imported: inserted,
        failed,
        categoryBreakdown: Array.from(targets.entries()).map(([cid, target]) => ({
          category_id: cid,
          category_name: categoryNames.get(cid),
          sourceCount: counts.get(cid),
          sampledTarget: target,
        })),
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
