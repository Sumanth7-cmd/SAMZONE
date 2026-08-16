import dotenv from 'dotenv';
import path from 'path';
import WebSocket from 'ws';

(global as any).WebSocket = WebSocket;
dotenv.config({ path: path.resolve(__dirname, 'frontend/.env') });
(globalThis as any).import = { meta: { env: process.env } };

async function checkWomenCategoryPaths() {
  const { supabase } = await import('./frontend/src/services/supabaseClient');

  const { data: catList } = await supabase
    .from('categories')
    .select('path')
    .ilike('path', '%women%');

  console.log(`Found ${catList?.length} categories containing 'women' in path:`);
  const samples = new Set<string>();
  catList?.forEach(c => {
    const parts = c.path.split('>>');
    if (parts.length >= 2) samples.add(`${parts[0].trim()} >> ${parts[1].trim()}`);
  });
  console.log(Array.from(samples));
}

checkWomenCategoryPaths().catch(console.error);
