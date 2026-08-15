/**
 * Runtime integration test for chatbot multi-turn sequence.
 * Run: npx tsx scripts/test-chatbot-sequence.ts
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '/home/rishi/Desktop/SAMZONE/frontend/.env' });

import WebSocket from 'ws';
(globalThis as any).WebSocket = WebSocket;

import { createClient } from '@supabase/supabase-js';
import {
  buildShoppingAssistantReply,
  createEmptyAssistantContext,
  type AssistantContext,
} from '../frontend/src/services/conversationalShoppingAssistant';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || '',
);

const TURNS = [
  "I need a men's wedding outfit under ₹5000.",
  'Show me something black.',
  'Give me cheaper options.',
];

async function verifyProductIds(ids: number[]) {
  const results: Array<{ id: number; exists: boolean; name?: string; price?: number; category?: string }> = [];
  for (const id of ids) {
    const { data } = await supabase
      .from('products_new')
      .select('product_id, name, retail_price, discounted_price, categories!fk_category(path)')
      .eq('product_id', id)
      .maybeSingle();
    results.push({
      id,
      exists: !!data,
      name: data?.name,
      price: data?.discounted_price && data.discounted_price < data.retail_price
        ? Number(data.discounted_price)
        : Number(data?.retail_price),
      category: (data as any)?.categories?.path,
    });
  }
  return results;
}

function isMensCategory(path: string): boolean {
  const lower = path.toLowerCase();
  return lower.includes("men's") && !lower.includes("women's");
}

async function run() {
  let context: AssistantContext = createEmptyAssistantContext();
  const transcript: Array<{
    user: string;
    reply: string;
    heading: string;
    products: Array<{ id: number; name: string; price: number; category: string }>;
    context: { gender?: string; budgetMax?: number; color?: string; occasion?: string };
  }> = [];

  console.log('=== CHATBOT MULTI-TURN SEQUENCE TEST ===\n');

  for (const userMessage of TURNS) {
    const response = await buildShoppingAssistantReply(userMessage, context);
    context = response.context;

    const products = response.products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      category: p.category,
    }));

    transcript.push({
      user: userMessage,
      reply: response.reply,
      heading: response.heading,
      products,
      context: {
        gender: context.lastGender,
        budgetMax: context.lastBudgetMax,
        color: context.lastColor,
        occasion: context.lastOccasion,
      },
    });

    console.log(`USER: ${userMessage}`);
    console.log(`HEADING: ${response.heading}`);
    console.log(`CONTEXT: gender=${context.lastGender} budgetMax=${context.lastBudgetMax} color=${context.lastColor} occasion=${context.lastOccasion}`);
    console.log(`REPLY: ${response.reply.slice(0, 200)}${response.reply.length > 200 ? '...' : ''}`);
    console.log('PRODUCTS:');
    for (const p of products) {
      console.log(`  - [${p.id}] ${p.name} | ₹${p.price} | ${p.category?.slice(0, 60)}`);
    }
    console.log('');
  }

  const allIds = [...new Set(transcript.flatMap((t) => t.products.map((p) => p.id)))];
  const verification = await verifyProductIds(allIds);

  console.log('=== PRODUCT ID VERIFICATION (Supabase) ===');
  for (const v of verification) {
    console.log(`  ID ${v.id}: exists=${v.exists} | ${v.name} | ₹${v.price}`);
  }

  console.log('\n=== ASSERTIONS ===');
  const turn1 = transcript[0];
  const turn2 = transcript[1];
  const turn3 = transcript[2];

  const t1AllMen = turn1.products.every((p) => isMensCategory(p.category || ''));
  console.log(`Turn 1 all men's products: ${t1AllMen} (${turn1.products.length} products)`);

  const t1BudgetOk = turn1.products.every((p) => p.price <= 5000);
  console.log(`Turn 1 all within ₹5000: ${t1BudgetOk}`);

  const ctxRetained = turn2.context.gender === 'men'
    && turn2.context.budgetMax === 5000
    && turn2.context.occasion === 'wedding';
  console.log(`Turn 2 context retained (gender/budget/occasion): ${ctxRetained}`);

  const t2HasColor = turn2.context.color === 'black';
  console.log(`Turn 2 color set to black: ${t2HasColor}`);

  const t3Cheaper = (turn3.context.budgetMax ?? 5000) < 5000;
  console.log(`Turn 3 budget reduced: ${t3Cheaper} (max=${turn3.context.budgetMax})`);

  const allExist = verification.every((v) => v.exists);
  console.log(`All product IDs exist in Supabase: ${allExist}`);

  const failed = !t1AllMen || !t1BudgetOk || !ctxRetained || !t2HasColor || !t3Cheaper || !allExist;
  process.exit(failed ? 1 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
