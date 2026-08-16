// scripts/import-dresses.ts
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import crypto from 'crypto';
import ws from 'ws';

globalThis.WebSocket = ws as any;

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials in environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const DRESS_CSV_PATH = '/home/rishi/Desktop/v1/archive (11)/dress.csv';
const TARGET_CATEGORY_PATH = "Clothing >> Women's Clothing >> Western Wear >> Dresses & Skirts >> Dresses";
const BRANDS_LIST = ["Dressberry", "Harpa", "Tokyo Talkies", "Vishudh", "Biba", "Libas", "W"];

const IMAGE_POOLS: Record<string, string[]> = {
  floral: [
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80"
  ],
  plain: [
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=600&auto=format&fit=crop&q=80"
  ],
  'polka dot': [
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1622122441006-00b8e612d921?w=600&auto=format&fit=crop&q=80"
  ],
  stripes: [
    "https://images.unsplash.com/photo-1509319117193-57bab727e09d?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=600&auto=format&fit=crop&q=80"
  ],
  animal: [
    "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=600&auto=format&fit=crop&q=80"
  ],
  geometry: [
    "https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&auto=format&fit=crop&q=80"
  ],
  squares: [
    "https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&auto=format&fit=crop&q=80"
  ],
  chevron: [
    "https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&auto=format&fit=crop&q=80"
  ],
  ikat: [
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&auto=format&fit=crop&q=80"
  ],
  tribal: [
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&auto=format&fit=crop&q=80"
  ],
  scales: [
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&auto=format&fit=crop&q=80"
  ],
  OTHER: [
    "https://images.unsplash.com/photo-1566207274740-0f8cf6b7d5a5?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=600&auto=format&fit=crop&q=80"
  ]
};

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function getOrCreateBrands(brandsList: string[]): Promise<Map<string, number>> {
  const brandMap = new Map<string, number>();
  
  for (const brandName of brandsList) {
    const key = brandName.toLowerCase();
    
    // Check if brand exists
    const { data: existing, error: checkError } = await supabase
      .from('brands')
      .select('brand_id')
      .eq('name', brandName)
      .maybeSingle();
      
    if (checkError) {
      throw new Error(`Failed to check brand "${brandName}": ${checkError.message}`);
    }
    
    if (existing) {
      brandMap.set(key, existing.brand_id);
    } else {
      console.log(`Brand "${brandName}" not found. Creating in Supabase...`);
      const { data: newBrand, error: insertError } = await supabase
        .from('brands')
        .insert({ name: brandName })
        .select('brand_id')
        .single();
        
      if (insertError) {
        // If race condition happens and it was created in the meantime, query again
        if (insertError.code === '23505') {
          const { data: retryData } = await supabase
            .from('brands')
            .select('brand_id')
            .eq('name', brandName)
            .single();
          if (retryData) {
            brandMap.set(key, retryData.brand_id);
            continue;
          }
        }
        throw new Error(`Failed to create brand "${brandName}": ${insertError.message}`);
      }
      brandMap.set(key, newBrand.brand_id);
    }
  }
  return brandMap;
}

async function getOrCreateCategory(pathStr: string): Promise<number> {
  const { data, error } = await supabase
    .from('categories')
    .select('category_id')
    .eq('path', pathStr)
    .maybeSingle();
  if (error) throw new Error(`Failed to check category: ${error.message}`);
  if (data) return data.category_id;
  console.log(`Category "${pathStr}" not found. Creating in Supabase...`);
  const { data: newCat, error: insertError } = await supabase
    .from('categories')
    .insert({ path: pathStr })
    .select('category_id')
    .single();
  if (insertError) throw new Error(`Failed to create category "${pathStr}": ${insertError.message}`);
  return newCat.category_id;
}

function getDeterministicItem<T>(seed: string, pool: T[]): T {
  const hash = crypto.createHash('md5').update(seed).digest('hex');
  const index = parseInt(hash.substring(0, 8), 16) % pool.length;
  return pool[index];
}

async function main() {
  console.log('Starting dress dataset import to Supabase...');
  
  if (!fs.existsSync(DRESS_CSV_PATH)) {
    console.error(`Dress CSV not found at: ${DRESS_CSV_PATH}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(DRESS_CSV_PATH, 'utf-8');
  const lines = csvContent.split('\n').filter(Boolean);
  
  console.log(`Total rows in dress.csv: ${lines.length - 1}`);
  
  const brandMap = await getOrCreateBrands(BRANDS_LIST);
  const targetCategoryId = await getOrCreateCategory(TARGET_CATEGORY_PATH);
  
  const stagingRows: any[] = [];
  const productionRows: any[] = [];
  const seenImageUrls = new Set<string>();
  
  for (let i = 1; i < lines.length; i++) {
    const columns = parseCsvLine(lines[i]);
    if (columns.length < 4) continue;
    
    const unitId = columns[0].replace(/"/g, '').trim();
    const pattern = columns[1].replace(/"/g, '').trim();
    const confidence = parseFloat(columns[2].replace(/"/g, '').trim());
    const originalImageUrl = columns[3].replace(/"/g, '').trim();
    
    if (isNaN(confidence) || confidence < 0.7) {
      continue;
    }
    
    if (seenImageUrls.has(originalImageUrl)) {
      continue;
    }
    seenImageUrls.add(originalImageUrl);
    
    const brand = getDeterministicItem(unitId, BRANDS_LIST);
    const brandId = brandMap.get(brand.toLowerCase())!;
    
    // Generate beautiful display title and specs
    const patternFormatted = pattern === 'OTHER' ? 'Classic' : pattern.charAt(0).toUpperCase() + pattern.slice(1);
    const productName = `${brand} Women's ${patternFormatted} Pattern A-Line Dress`;
    const uniqId = crypto.createHash('md5').update(unitId).digest('hex');
    const pid = `DRS${crypto.createHash('md5').update(unitId + 'pid').digest('hex').substring(0, 13).toUpperCase()}`;
    
    // Deterministic prices
    const hashVal = parseInt(crypto.createHash('md5').update(unitId + 'price').digest('hex').substring(0, 4), 16);
    const retailPrice = 999 + (hashVal % 20) * 100; // 999 to 2899
    const discountedPrice = Math.floor(retailPrice * (0.6 + (hashVal % 4) * 0.1)); // 10% to 40% discount
    const rating = parseFloat((3.8 + (hashVal % 11) * 0.1).toFixed(1)); // 3.8 to 4.8
    
    // Unsplash dress image mapping based on pattern
    const pool = IMAGE_POOLS[pattern] || IMAGE_POOLS['OTHER'];
    const primaryImage = getDeterministicItem(unitId + 'img1', pool);
    const secondaryImage = getDeterministicItem(unitId + 'img2', pool);
    const imageList = [primaryImage, secondaryImage];
    
    const description = `Upgrade your wardrobe with this stylish ${patternFormatted.toLowerCase()} printed A-line dress from ${brand}. Made from soft, breathable premium fabric, it features a comfortable design that is perfect for casual events, weekend brunches, or semi-formal settings. Pair with your favorite accessories to complete the look.`;
    
    const specifications = {
      "Gender": "Women",
      "Fabric": "Cotton Blend",
      "Pattern": patternFormatted,
      "Style": "A-Line",
      "Length": "Midi",
      "Occasion": "Casual / Party Wear",
      "Wash Care": "Hand wash recommended, machine wash cold"
    };

    // Staging table data structure
    stagingRows.push({
      uniq_id: uniqId,
      crawl_timestamp: new Date().toISOString(),
      product_url: `https://www.samzone.in/product/${uniqId}`,
      product_name: productName,
      product_category_tree: [TARGET_CATEGORY_PATH],
      pid: pid,
      retail_price: retailPrice,
      discounted_price: discountedPrice,
      image: imageList,
      is_fk_advantage_product: true,
      description: description,
      product_rating: String(rating),
      overall_rating: String(rating),
      brand: brand,
      product_specifications: specifications
    });

    // Production table data structure
    productionRows.push({
      uniq_id: uniqId,
      pid: pid,
      name: productName,
      brand_id: brandId,
      category_id: targetCategoryId,
      retail_price: retailPrice,
      discounted_price: discountedPrice,
      description: description,
      rating: rating,
      image: imageList,
      specifications: specifications
    });
  }

  console.log(`Prepared ${stagingRows.length} cleaned high-confidence records for import.`);

  // Ingest in batches to avoid Supabase request payload size limitations
  const BATCH_SIZE = 200;
  
  console.log('Ingesting to staging_products...');
  for (let i = 0; i < stagingRows.length; i += BATCH_SIZE) {
    const batch = stagingRows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('staging_products').upsert(batch, { onConflict: 'uniq_id' });
    if (error) {
      console.error(`Staging batch failed at index ${i}:`, error.message);
      process.exit(1);
    }
  }
  console.log('Successfully populated staging_products.');

  console.log('Ingesting to products_new (promoting to production)...');
  let insertedCount = 0;
  for (let i = 0; i < productionRows.length; i += BATCH_SIZE) {
    const batch = productionRows.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase.from('products_new').upsert(batch, { onConflict: 'uniq_id' });
    if (error) {
      console.error(`Production batch failed at index ${i}:`, error.message);
      process.exit(1);
    }
    insertedCount += batch.length;
  }
  
  console.log(`Successfully imported ${insertedCount} dresses into products_new.`);
  console.log('ETL execution completed successfully!');
}

main().catch((err) => {
  console.error('Fatal error during import:', err);
  process.exit(1);
});
