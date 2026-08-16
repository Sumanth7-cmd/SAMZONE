const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: 'frontend/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const selectStr = 'product_id, categories!fk_category!inner(path)';
    const { data, error } = await supabase
        .from('products_new')
        .select(selectStr)
        .ilike('categories.path', '%laptops%')
        .limit(3);
    console.log("Error:", error);
    console.log("Data:", data);
}
test();
