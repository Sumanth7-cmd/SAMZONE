import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import WebSocket from 'ws';
(global as any).WebSocket = WebSocket;

dotenv.config({ path: path.resolve(__dirname, 'frontend/.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function run() {
  const PRODUCT_SELECT = 'product_id, uniq_id, pid, name, brand_id, category_id, retail_price, discounted_price, description, rating, image, specifications, created_at, brands!fk_brand(name), categories!fk_category(path)';
  const { data, error } = await supabase
    .from('products_new')
    .select(PRODUCT_SELECT)
    .eq('product_id', 6178)
    .maybeSingle();
  console.log("Data:", data);
  console.log("Error:", error);
}

run();
