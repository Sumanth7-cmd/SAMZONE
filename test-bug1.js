import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: 'frontend/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data, error } = await supabase
        .from('products_new')
        .select('product_id, brands(name), categories(path)')
        .eq('product_id', 6178)
        .maybeSingle();
    console.log("Error:", error);
    console.log("Data:", data);
}
test();
