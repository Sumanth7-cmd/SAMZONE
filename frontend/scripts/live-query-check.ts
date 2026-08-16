import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let env: Record<string, string> = {};
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const [k, v] = line.split('=');
    if (k && v) env[k.trim()] = v.trim();
  });
}

if (env.VITE_SUPABASE_URL) process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL;
if (env.VITE_SUPABASE_ANON_KEY) process.env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as any).WebSocket = class {};
}

async function testLiveQuery() {
  const { supabase } = await import('../src/services/supabaseClient');
  const { retrieveCandidates, matchesGenderConstraint, DEFAULT_CONTEXT, RecommendationContext } = await import('../src/services/recommendationEngine');

  console.log('=== LIVE QUERY 1: Direct PostgREST query with Men\'s filter ===');
  const { data, error } = await supabase
    .from('products_new')
    .select('product_id, name, retail_price, discounted_price, categories!fk_category!inner(path)')
    .ilike('categories.path', "%Men's%")
    .not('categories.path', 'ilike', "%Women's%")
    .gt('retail_price', 0)
    .limit(20);

  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Returned rows count:', data.length);
  let womensLeaked = 0;
  data.forEach((r: any, i: number) => {
    const isWomens = (r.categories?.path || '').toLowerCase().includes('women');
    if (isWomens) womensLeaked++;
    console.log(` ${i + 1}. [ID:${r.product_id}] "${r.name}" | Path: "${r.categories?.path}" | Leaked Women: ${isWomens}`);
  });
  console.log('Total Women\'s items leaked in Men\'s query:', womensLeaked);

  console.log('\n=== LIVE QUERY 2: recommendationEngine.retrieveCandidates for men\'s wedding under 5000 ===');
  const ctx: RecommendationContext = {
    ...DEFAULT_CONTEXT,
    gender: 'men',
    genderConfidence: 'explicit',
    occasion: 'wedding',
    budgetMax: 5000,
  };
  const res = await retrieveCandidates(ctx);
  console.log('Candidate count:', res.products.length);
  let engineLeaked = 0;
  res.products.forEach((p, i) => {
    const match = matchesGenderConstraint(p, 'men');
    if (!match) engineLeaked++;
    console.log(` ${i + 1}. [ID:${p.id}] "${p.name}" - ₹${p.price} | Cat: "${p.category}" | Matches Men: ${match}`);
  });
  console.log('Total Non-Men items in recommendation engine results:', engineLeaked);
}

testLiveQuery().catch(console.error);
