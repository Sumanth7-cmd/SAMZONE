import dotenv from 'dotenv';
import path from 'path';
import WebSocket from 'ws';

(global as any).WebSocket = WebSocket;
dotenv.config({ path: path.resolve(__dirname, 'frontend/.env') });
(globalThis as any).import = { meta: { env: process.env } };

async function testCoralBug() {
  const { supabase } = await import('./frontend/src/services/supabaseClient');
  const { productApi, COLOR_FAMILY_FALLBACK, mapRawProduct, PRODUCT_SELECT } = await import('./frontend/src/services/api');

  console.log('--- COLOR_FAMILY_FALLBACK ---');
  console.log('Coral fallback:', COLOR_FAMILY_FALLBACK['coral']);

  console.log('\n--- WEIDELI Backpack Category Search ---');
  const { data: backpackRows } = await supabase
    .from('products_new')
    .select(PRODUCT_SELECT.replace('categories!fk_category(path)', 'categories!fk_category!inner(path)'))
    .ilike('name', '%WEIDELI%');

  backpackRows?.forEach((r, i) => {
    console.log(`Backpack ${i + 1}: name="${r.name}", category_path="${r.categories?.path}"`);
  });

  console.log('\n--- Skin Guide searchByColor("coral", 8) ---');
  const coralProducts = await productApi.searchByColor('coral', 8);
  console.log(`Returned ${coralProducts.length} items for coral:`);
  coralProducts.forEach((p, i) => {
    console.log(`  ${i + 1}. [${p.id}] "${p.name}" | Cat: "${p.category}" | Image: "${p.image}"`);
  });

  console.log('\n--- Database query for products containing "coral" ---');
  const { data: rawCoral } = await supabase
    .from('products_new')
    .select(PRODUCT_SELECT.replace('categories!fk_category(path)', 'categories!fk_category!inner(path)'))
    .or('name.ilike.%coral%,description.ilike.%coral%')
    .limit(20);

  console.log(`Found ${rawCoral?.length} raw rows matching coral in name/desc:`);
  rawCoral?.forEach((r, i) => {
    console.log(`  ${i + 1}. [${r.product_id}] "${r.name}" | Cat: "${r.categories?.path}" | Image: ${JSON.stringify(r.image)}`);
  });
}

testCoralBug().catch(console.error);
