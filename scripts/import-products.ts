// scripts/import-products.ts
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import ws from 'ws';
globalThis.WebSocket = ws as any;
// Supabase client (same as in src/services/supabaseClient.ts)
const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_SERVICE_ROLE_KEY) || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;


const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// supabase client initialized above with service role key

// Paths
const productsCsvPath = path.resolve(process.cwd(), 'amazon_products.csv');
const categoriesCsvPath = path.resolve(process.cwd(), 'amazon_categories.csv');

// Helpers
function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
function isValidPrice(p: string): boolean {
  return !!p && !isNaN(parseFloat(p)) && parseFloat(p) > 0;
}
function extractBrand(title: string): string {
  // Take first token before a space or punctuation
  const token = title.split(/\s+/)[0];
  return token.replace(/[^a-zA-Z0-9]/g, '');
}

async function main() {
  // Load categories
  const categoriesCsv = fs.readFileSync(categoriesCsvPath, 'utf-8');
  const categories = parse(categoriesCsv, { columns: true, skip_empty_lines: true });
  const categoryMap = new Map<string, string>();
  for (const row of categories) {
    // Expect columns: category_id, category_name (adjust if different)
    const id = row['category_id'] ?? row['id'] ?? row['category_id'];
    const name = row['category_name'] ?? row['name'] ?? '';
    if (id) categoryMap.set(id, name);
  }

  // Load products
  const productsCsv = fs.readFileSync(productsCsvPath, 'utf-8');
  const rawRows = parse(productsCsv, { columns: true, skip_empty_lines: true });

  const seenAsin = new Set<string>();
  const filtered: any[] = [];
  let skippedMissing = 0;

  for (const row of rawRows) {
    const asin = row['asin'];
    const title = row['title'];
    const imgUrl = row['imgUrl'] ?? row['image_url'] ?? row['imageUrl'];
    const price = row['price'];
    const listPrice = row['listPrice'];
    const categoryId = row['category_id'];
    const rating = row['stars'];
    const reviews = row['reviews'];
    const isBestSeller = row['isBestSeller'] ?? row['is_best_seller'];
    const boughtInLastMonth = row['boughtInLastMonth'] ?? row['bought_last_month'];

    // Validate price and imgUrl
    if (!isValidPrice(price) || !isValidUrl(imgUrl)) {
      skippedMissing++;
      continue;
    }
    // Deduplicate by asin
    if (asin && !seenAsin.has(asin)) {
      seenAsin.add(asin);
      const brand = extractBrand(title || '');
      const categoryName = categoryMap.get(categoryId) || '';
      filtered.push({
        asin,
        title,
        img_url: imgUrl,
        price: parseFloat(price),
        list_price: listPrice ? parseFloat(listPrice) : null,
        rating: rating ? parseFloat(rating) : null,
        reviews_count: reviews ? parseInt(reviews, 10) : null,
        is_best_seller: isBestSeller === 'true' || isBestSeller === true,
        bought_last_month: boughtInLastMonth ? parseInt(boughtInLastMonth, 10) : null,
        brand,
        category_id: categoryId,
        category_name: categoryName,
      });
    }
  }

  // Proportional sampling up to 10,000 rows
  const targetTotal = 10000;
  const totalAvailable = filtered.length;
  const perCategoryCount = new Map<string, number>();
  for (const row of filtered) {
    const cid = row.category_id || 'unknown';
    perCategoryCount.set(cid, (perCategoryCount.get(cid) || 0) + 1);
  }
  const sampled: any[] = [];
  const categoryTargets = new Map<string, number>();
  // Initial allocation proportional
  perCategoryCount.forEach((cnt, cid) => {
    const target = Math.floor((cnt / totalAvailable) * targetTotal);
    categoryTargets.set(cid, target);
  });
  // Adjust for rounding diff
  let allocated = Array.from(categoryTargets.values()).reduce((a, b) => a + b, 0);
  const diff = targetTotal - allocated;
  if (diff > 0) {
    // Assign remaining slots to categories with highest remaining count
    const sorted = Array.from(perCategoryCount.entries()).sort((a, b) => b[1] - a[1]);
    for (let i = 0; i < diff; i++) {
      const cid = sorted[i % sorted.length][0];
      categoryTargets.set(cid, (categoryTargets.get(cid) || 0) + 1);
    }
  }
  // Shuffle filtered rows
  const shuffled = filtered.sort(() => Math.random() - 0.5);
  const takenPerCategory = new Map<string, number>();
  for (const row of shuffled) {
    const cid = row.category_id || 'unknown';
    const target = categoryTargets.get(cid) || 0;
    const taken = takenPerCategory.get(cid) || 0;
    if (taken < target && sampled.length < targetTotal) {
      sampled.push(row);
      takenPerCategory.set(cid, taken + 1);
    }
    if (sampled.length >= targetTotal) break;
  }

  console.log('=== Import Summary ===');
  console.log('Total rows read       :', rawRows.length);
  console.log('Rows after filtering  :', filtered.length);
  console.log('Rows skipped (invalid price/img) :', skippedMissing);
  console.log('Rows selected for import (target 10k) :', sampled.length);

  // Insert into products_new (upsert to avoid duplicates)
  const { data, error } = await supabase.from('products_new').upsert(sampled, { onConflict: ['asin'] });
  if (error) {
    console.error('Error inserting into products_new:', error);
    process.exit(1);
  }
  console.log('Rows inserted/updated :', data?.length ?? 0);

  // Category distribution
  const { data: distData, error: distErr } = await supabase
    .from('products_new')
    .select('category_name, count')
    .group('category_name');
  if (distErr) {
    console.error('Error fetching distribution:', distErr);
  } else {
    console.log('=== Category Distribution ===');
    console.table(distData);
  }

  // Spot‑check random rows
  const { data: sampleRows, error: sampleErr } = await supabase
    .from('products_new')
    .select('*')
    .order('random()', { ascending: true })
    .limit(20);
  if (sampleErr) {
    console.error('Error fetching sample rows:', sampleErr);
  } else {
    console.log('=== Spot‑check (20 rows) ===');
    sampleRows?.forEach((r: any) => {
      console.log({ asin: r.asin, img_url: r.img_url, price: r.price, brand: r.brand });
    });
  }
}

main().catch((e) => {
  console.error('Unexpected error:', e);
  process.exit(1);
});
