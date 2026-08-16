// Test script to run SAMZONE Recommendation Engine Self-Test & Pipeline Assertions
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env file for Supabase credentials if available
if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as any).WebSocket = class {};
}

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

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jemveilvzusksclfsckr.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('--- SAMZONE RECOMMENDATION ENGINE HARDENING VERIFICATION ---');
console.log('Supabase URL configured:', !!supabaseUrl);
console.log('Supabase Anon Key configured:', !!supabaseKey);

async function runTests() {
  const {
    runEngineSelfTest,
    mergeIntentIntoContext,
    applyHardFilters,
    matchesGenderConstraint,
    matchesBudgetConstraint,
    runRecommendationPipeline,
    DEFAULT_CONTEXT,
  } = await import('../src/services/recommendationEngine.ts');

  console.log('\n[1/4] Running Engine Unit & Integration Self-Tests...');
  const result = runEngineSelfTest();
  console.log(`Self-Test Results: ${result.passed} PASSED, ${result.failed} FAILED`);
  if (result.errors.length > 0) {
    console.error('Test Failures:');
    result.errors.forEach((err: string) => console.error('  - ' + err));
    process.exit(1);
  }

  console.log('\n[2/4] Testing Multi-Turn Context Retention & Switching...');

  // Turn 1: Initial query for men's wedding outfit under 5000
  const turn1 = mergeIntentIntoContext("I need a men's wedding outfit under ₹5000", DEFAULT_CONTEXT);
  console.log('Turn 1 Parsed:', { gender: turn1.gender, occasion: turn1.occasion, budgetMax: turn1.budgetMax });
  if (turn1.gender !== 'men' || turn1.occasion !== 'wedding' || turn1.budgetMax !== 5000) {
    console.error('FAIL: Turn 1 multi-intent parsing invalid');
    process.exit(1);
  }

  // Turn 2: Color refinement
  const turn2 = mergeIntentIntoContext('Show me something black', turn1);
  console.log('Turn 2 Parsed:', { gender: turn2.gender, occasion: turn2.occasion, budgetMax: turn2.budgetMax, color: turn2.color });
  if (turn2.gender !== 'men' || turn2.occasion !== 'wedding' || turn2.budgetMax !== 5000 || turn2.color !== 'black') {
    console.error('FAIL: Turn 2 context retention invalid');
    process.exit(1);
  }

  // Turn 3: Budget reduction request
  const turn3 = mergeIntentIntoContext('Give me cheaper options', turn2);
  console.log('Turn 3 Parsed:', { gender: turn3.gender, occasion: turn3.occasion, budgetMax: turn3.budgetMax, color: turn3.color });
  if (turn3.gender !== 'men' || turn3.occasion !== 'wedding' || !turn3.budgetMax || turn3.budgetMax >= 5000) {
    console.error('FAIL: Turn 3 cheaper budget reduction invalid');
    process.exit(1);
  }

  // Turn 4: Gender switch to sister (women)
  const turn4 = mergeIntentIntoContext('Now show for my sister', turn3);
  console.log('Turn 4 Parsed:', { gender: turn4.gender, occasion: turn4.occasion, budgetMax: turn4.budgetMax });
  if (turn4.gender !== 'women' || turn4.occasion !== 'wedding') {
    console.error('FAIL: Turn 4 gender switch invalid');
    process.exit(1);
  }

  console.log('\n[3/4] Testing Gender & Price Hard Filtering Disambiguation...');
  const testCatalog: any[] = [
    { id: 101, name: "Silver Streak Men's Casual Shirt", price: 1200, rating: 4.5, category: "Clothing >> Men's Clothing >> Shirts", image: 'x', brand: 'Silver Streak', description: '' },
    { id: 102, name: "S4S Stylish Women's Full Coverage Bra", price: 300, rating: 4.2, category: "Clothing >> Women's Clothing >> Lingerie >> Bras", image: 'x', brand: 'S4S', description: '' },
    { id: 103, name: "Women's Silk Saree", price: 4500, rating: 4.8, category: "Clothing >> Women's Clothing >> Ethnic Wear >> Sarees", image: 'x', brand: 'Vark', description: '' },
    { id: 104, name: "Men's Expensive Silk Sherwani", price: 15000, rating: 4.9, category: "Clothing >> Men's Clothing >> Ethnic Wear >> Sherwanis", image: 'x', brand: 'Manyavar', description: '' },
  ];

  const menFiltered = applyHardFilters(testCatalog, { ...turn1, gender: 'men', genderConfidence: 'explicit', budgetMax: 5000 });
  console.log(`Men's Filter Results (under 5000): ${menFiltered.map((p) => p.name).join(', ')}`);
  if (menFiltered.length !== 1 || menFiltered[0].id !== 101) {
    console.error('FAIL: Men hard filter leaked non-matching items or excluded valid item');
    process.exit(1);
  }

  const womenFiltered = applyHardFilters(testCatalog, { ...turn4, gender: 'women', genderConfidence: 'explicit', budgetMax: 5000 });
  console.log(`Women's Filter Results (under 5000): ${womenFiltered.map((p) => p.name).join(', ')}`);
  if (womenFiltered.length !== 2 || womenFiltered.some((p) => p.id === 101 || p.id === 104)) {
    console.error('FAIL: Women hard filter leaked men items');
    process.exit(1);
  }

  console.log('\n[4/4] Testing Live Database Candidate Retrieval & Recommendation Pipeline...');
  const pipelineResult = await runRecommendationPipeline("men's shirt under ₹3000");
  console.log('Pipeline Heading:', pipelineResult.heading);
  console.log('Pipeline Explanation:', pipelineResult.explanation);
  console.log(`Products Returned: ${pipelineResult.products.length}`);
  pipelineResult.products.forEach((p, idx) => {
    console.log(`  ${idx + 1}. [ID:${p.id}] ${p.name} - ₹${p.price} (${p.category})`);
  });

  // Verify that all returned products pass hard constraints
  for (const product of pipelineResult.products) {
    if (!matchesGenderConstraint(product, 'men')) {
      console.error(`FAIL: Returned product ${product.name} violates men's gender constraint!`);
      process.exit(1);
    }
    if (!matchesBudgetConstraint(product, undefined, 3000)) {
      console.error(`FAIL: Returned product ${product.name} price ₹${product.price} exceeds budget ₹3000!`);
      process.exit(1);
    }
  }

  console.log('\n✅ ALL RECOMMENDATION ENGINE HARDENING TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('Unhandled Error during tests:', err);
  process.exit(1);
});
