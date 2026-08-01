import * as dotenv from 'dotenv';
dotenv.config({ path: '/home/rishi/Desktop/SAMZONE/frontend/.env' });

(import.meta as any).env = {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY
};

import { searchProducts } from './frontend/src/services/productsSearchApi';
import WebSocket from 'ws';
(globalThis as any).WebSocket = WebSocket;

async function test() {
  try {
    const res = await searchProducts({ q: 'shoes', maxPrice: 1000 });
    console.log("JSON response:", JSON.stringify(res.products.slice(0, 3), null, 2));
  } catch(e) {
    console.error("FAIL:", e);
  }
}
test();
