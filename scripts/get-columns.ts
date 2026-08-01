// scripts/get-columns.ts
import { supabase } from '../frontend/src/services/supabaseClient';

async function main() {
  const { data, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: false })
    .limit(1);
  if (error) {
    console.error('Error fetching product:', error);
    process.exit(1);
  }
  if (!data || data.length === 0) {
    console.log('No rows in products table');
    process.exit(0);
  }
  const columns = Object.keys(data[0]);
  console.log(columns.join('\n'));
}

main();
