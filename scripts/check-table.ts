import WebSocket from "ws";
(globalThis as any).WebSocket = WebSocket;
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function main() {
  const { error } = await supabase.from('products_new').upsert([{asin:'TEST123', title:'test', category_id:1, category_name:'x', is_best_seller:false}], { onConflict: 'asin' });
  if (error) { console.log('NOT_READY:', error.message); process.exit(1); }
  await supabase.from('products_new').delete().eq('asin', 'TEST123');
  console.log('READY');
  process.exit(0);
}
main();
