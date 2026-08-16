const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: 'frontend/.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
    let query = supabase
        .from('products_new')
        .select('product_id, brands!fk_brand(name), categories!fk_category(path)');
    query = query.or(`name.ilike.%shirt%,description.ilike.%shirt%`);
    const { data, error } = await query;
    console.log("Error:", error);
    console.log("Data length:", data ? data.length : 0);
}
test();
