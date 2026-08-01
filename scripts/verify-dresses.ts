// scripts/verify-dresses.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import ws from 'ws';

globalThis.WebSocket = ws as any;
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

async function checkSupabase() {
  console.log('=== Checking Supabase database ===');
  
  // 1. Get count of products in category 'Dresses'
  const { data: catData, error: catErr } = await supabase
    .from('categories')
    .select('category_id')
    .eq('path', "Clothing >> Women's Clothing >> Western Wear >> Dresses & Skirts >> Dresses")
    .single();
    
  if (catErr) {
    console.error('Error fetching dress category:', catErr.message);
    return;
  }
  
  const categoryId = catData.category_id;
  
  const { count, error: countErr } = await supabase
    .from('products_new')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', categoryId);
    
  if (countErr) {
    console.error('Error counting dresses in products_new:', countErr.message);
    return;
  }
  
  console.log(`Total dresses in products_new: ${count}`);
  
  // 2. Fetch a sample of 3 dresses
  const { data: samples, error: sampleErr } = await supabase
    .from('products_new')
    .select('product_id, name, rating, retail_price, discounted_price, image, specifications, brand_id')
    .eq('category_id', categoryId)
    .limit(3);
    
  if (sampleErr) {
    console.error('Error fetching sample dresses:', sampleErr.message);
    return;
  }
  
  console.log('Sample dress records:');
  samples?.forEach((item: any, idx) => {
    console.log(`\n[Sample ${idx + 1}]`);
    console.log(`ID: ${item.product_id}`);
    console.log(`Name: ${item.name}`);
    console.log(`Brand ID: ${item.brand_id}`);
    console.log(`Prices: Retail ₹${item.retail_price}, Discounted ₹${item.discounted_price}`);
    console.log(`Rating: ${item.rating}`);
    console.log(`Images:`, item.image);
    console.log(`Specifications:`, item.specifications);
  });
}

async function checkH2Backend() {
  console.log('\n=== Checking H2 local backend ===');
  try {
    const res = await fetch('http://localhost:8081/api/admin/stats');
    if (!res.ok) {
      console.error(`Stats endpoint returned status: ${res.status}`);
      return;
    }
    const data: any = await res.json();
    console.log('H2 database stats:');
    console.log(`Total products: ${data.totalProducts}`);
    console.log(`Total categories: ${data.totalCategories}`);
    console.log(`Category distribution:`, data.categoryCounts);
  } catch (err: any) {
    console.error('Failed to query backend stats:', err.message);
  }
}

async function main() {
  await checkSupabase();
  await checkH2Backend();
}

main();
