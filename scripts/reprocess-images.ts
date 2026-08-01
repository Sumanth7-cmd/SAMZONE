import * as fs from "fs";
import * as path from "path";
import WebSocket from "ws";

// @supabase/supabase-js requires a native WebSocket global; Node 18 doesn't have
// one, so createClient() throws immediately without this polyfill in place.
(globalThis as any).WebSocket = WebSocket;

import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Check your .env file."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const IMAGES_DIR = "/home/rishi/Downloads/files (2)/archive (4)/images";
const STORAGE_BUCKET = "product-images";
const CONCURRENCY = 15;
const TARGET_WIDTH = 400;
const TARGET_HEIGHT = 500;
const JPEG_QUALITY = 85;
const FAILED_LOG_PATH = path.join(__dirname, "..", "reprocess-failed.log");
const PROGRESS_LOG_PATH = path.join(__dirname, "..", "reprocess-progress.log");

// Appended to (not overwritten) as each id succeeds, so a crash/reboot mid-run
// doesn't lose granularity - restarting only needs to redo ids missing from this file.
function loadCompletedIds(): Set<string> {
  if (!fs.existsSync(PROGRESS_LOG_PATH)) {
    return new Set();
  }
  const contents = fs.readFileSync(PROGRESS_LOG_PATH, "utf-8");
  return new Set(contents.split("\n").filter((line) => line.length > 0));
}

// Same pagination pattern as import-products.ts's fetchExistingExternalIds:
// PostgREST caps every response at 1000 rows regardless of the requested
// range, so PAGE_SIZE must match that cap for the "less than a full page"
// end-of-table check to ever actually trigger.
async function fetchAllExternalIds(): Promise<string[]> {
  const ids: string[] = [];
  const PAGE_SIZE = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select("external_id")
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Failed to fetch external_ids: ${error.message}`);
    }
    if (!data || data.length === 0) {
      break;
    }

    for (const row of data) {
      ids.push((row as { external_id: string }).external_id);
    }

    if (data.length < PAGE_SIZE) {
      break;
    }
    from += PAGE_SIZE;
  }

  return ids;
}

interface ReprocessResult {
  id: string;
  success: boolean;
  byteSize?: number;
  error?: string;
}

async function reprocessOne(id: string): Promise<ReprocessResult> {
  const sourcePath = path.join(IMAGES_DIR, `${id}.jpg`);

  if (!fs.existsSync(sourcePath)) {
    return { id, success: false, error: "source image missing" };
  }

  try {
    const sourceBuffer = fs.readFileSync(sourcePath);
    const processedBuffer = await sharp(sourceBuffer)
      .resize(TARGET_WIDTH, TARGET_HEIGHT, {
        fit: "cover",
        kernel: "lanczos3",
      })
      .sharpen()
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();

    const storagePath = `${id}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, processedBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      return { id, success: false, error: uploadError.message };
    }

    return { id, success: true, byteSize: processedBuffer.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { id, success: false, error: message };
  }
}

async function main(): Promise<void> {
  console.log("Fetching external_ids currently in the products table...");
  const allIds = await fetchAllExternalIds();
  const completed = loadCompletedIds();
  const ids = allIds.filter((id) => !completed.has(id));
  const total = allIds.length;
  console.log(`Found ${total} rows total, ${completed.size} already reprocessed, ${ids.length} remaining.`);

  const progressFd = fs.openSync(PROGRESS_LOG_PATH, "a");

  let processed = completed.size;
  let succeeded = completed.size;
  let failed = 0;
  let totalBytes = 0;
  let lastLoggedAt = processed;
  const failedLines: string[] = [];

  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const chunk = ids.slice(i, i + CONCURRENCY);
    const results = await Promise.all(chunk.map(reprocessOne));

    let chunkProgressLines = "";
    for (const result of results) {
      processed++;
      if (result.success) {
        succeeded++;
        totalBytes += result.byteSize ?? 0;
        chunkProgressLines += `${result.id}\n`;
      } else {
        failed++;
        failedLines.push(`${result.id}: ${result.error}`);
        console.error(`Failed ${result.id}: ${result.error}`);
      }
    }
    if (chunkProgressLines.length > 0) {
      fs.writeSync(progressFd, chunkProgressLines);
    }

    // >= rather than === : processed advances in steps of CONCURRENCY (15),
    // which never lands exactly on a multiple of 2000, so an exact-modulo
    // check would almost never fire (it happened to trigger once at 6000,
    // the LCM of 15 and 2000, and would otherwise stay silent for the rest
    // of the run).
    if (processed - lastLoggedAt >= 2000 || processed === total) {
      console.log(`Processed ${processed}/${total}...`);
      lastLoggedAt = processed;
    }
  }

  fs.closeSync(progressFd);

  if (failedLines.length > 0) {
    fs.writeFileSync(FAILED_LOG_PATH, failedLines.join("\n") + "\n");
  }

  const avgBytes = succeeded > 0 ? Math.round(totalBytes / succeeded) : 0;

  console.log("\n--- Reprocess summary ---");
  console.log(`Total rows: ${total}`);
  console.log(`Succeeded: ${succeeded}`);
  console.log(`Failed: ${failed}`);
  console.log(`Average reprocessed image size: ${avgBytes} bytes (~${(avgBytes / 1024).toFixed(1)} KB)`);
  console.log(`Total reprocessed bytes uploaded: ${totalBytes} (~${(totalBytes / (1024 * 1024)).toFixed(1)} MB)`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
