import * as dotenv from 'dotenv';
dotenv.config({ path: '/home/rishi/Desktop/SAMZONE/frontend/.env' });

(import.meta as any).env = {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
    VITE_API_URL: process.env.VITE_API_URL,
    VITE_USE_MOCK_API: 'false'
};

import { productApi } from './frontend/src/services/api';
import WebSocket from 'ws';
(globalThis as any).WebSocket = WebSocket;

async function test() {
  try {
    const p = await productApi.getProductById(6178);
    console.log("SUCCESS:", p);
  } catch(e) {
    console.error("FAIL:", e);
  }
}
test();
