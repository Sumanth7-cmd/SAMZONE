import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import WebSocket from 'ws';
(globalThis as any).WebSocket = WebSocket;

// Load environment variables from project root
dotenv.config({ path: '/home/rishi/Desktop/SAMZONE/.env' });

// Mock Vite's import.meta.env for Node.js execution before importing supabaseClient
(import.meta as any).env = {
    VITE_SUPABASE_URL: process.env.SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
};

import { supabase } from '../frontend/src/services/supabaseClient';
import { searchProducts, type ProductSearchParams } from '../frontend/src/services/productsSearchApi';

// Mock postgrest calls to inspect query builder calls
const originalFrom = supabase.from;
const callHistory: { method: string; args: any[] }[] = [];

function setupMockDb(mockData: any[]) {
    callHistory.length = 0; // Reset history
    
    const builder = {
        select(cols: string, opts: any) {
            callHistory.push({ method: 'select', args: [cols, opts] });
            return this;
        },
        textSearch(col: string, query: string) {
            callHistory.push({ method: 'textSearch', args: [col, query] });
            return this;
        },
        eq(col: string, val: any) {
            callHistory.push({ method: 'eq', args: [col, val] });
            return this;
        },
        gte(col: string, val: any) {
            callHistory.push({ method: 'gte', args: [col, val] });
            return this;
        },
        lte(col: string, val: any) {
            callHistory.push({ method: 'lte', args: [col, val] });
            return this;
        },
        order(col: string, opts: any) {
            callHistory.push({ method: 'order', args: [col, opts] });
            return this;
        },
        range(from: number, to: number) {
            callHistory.push({ method: 'range', args: [from, to] });
            return this;
        },
        // Thenable implementation to support await query
        then(resolve: any) {
            resolve({
                data: mockData,
                count: mockData.length,
                error: null
            });
        }
    };

    supabase.from = (table: string) => {
        callHistory.push({ method: 'from', args: [table] });
        return builder as any;
    };
}

function restoreDb() {
    supabase.from = originalFrom;
}

// Sample mock Amazon product row
const mockAmazonProduct = {
    id: 101,
    asin: 'B00TEST123',
    title: 'Amazon Brand - Solimo Men Hoodie',
    product_url: 'https://amazon.com/dp/B00TEST123',
    image_url: 'https://images.amazon.com/B00TEST123.jpg',
    rating: 4.5,
    reviews_count: 120,
    price: 999.00,
    list_price: 1499.00,
    category_id: 110,
    category_name: "Men's Clothing",
    is_best_seller: true,
    bought_last_month: 500,
    created_at: new Date().toISOString()
};

async function runMockTests() {
    console.log("=== RUNNING MOCK DB QUERY LAYER TESTS ===\n");

    const testCases: { name: string; params: ProductSearchParams }[] = [
        {
            name: "1. Search Query Test (targets 'title' using prefix tsquery)",
            params: { q: "Solimo Hoodie", page: 1, pageSize: 5 }
        },
        {
            name: "2. Category & Rating & Best Seller Filter Test (targets new columns)",
            params: { category: "Men's Clothing", minRating: 4.0, isBestSeller: true, page: 1, pageSize: 5 }
        },
        {
            name: "3. Price Range Filter & Sorting by Rating Test",
            params: { minPrice: 500, maxPrice: 1500, sort: 'rating_desc', page: 1, pageSize: 5 }
        },
        {
            name: "4. Sorting by Popularity (Bought Last Month) Test",
            params: { sort: 'bought_last_month_desc', page: 2, pageSize: 10 }
        }
    ];

    for (const tc of testCases) {
        console.log(`--- Test: ${tc.name} ---`);
        setupMockDb([mockAmazonProduct]);

        const result = await searchProducts(tc.params);

        console.log("Constructed DB Queries:");
        for (const call of callHistory) {
            console.log(`  .${call.method}(${call.args.map(a => JSON.stringify(a)).join(', ')})`);
        }
        
        console.log("\nParsed CatalogProduct Output Sample:");
        console.log(result.products[0]);
        console.log(`Total count: ${result.totalCount}, Pages: ${result.totalPages}\n`);
    }
}

async function runLiveQueryTest() {
    console.log("=== RUNNING LIVE QUERY AGAINST DB ===");
    console.log("Note: Because the database migration has not executed yet, queries targeting the new columns are expected to return a PostgREST schema cache error.\n");

    restoreDb(); // Restore the real Supabase database client

    console.log("Sending query: searchProducts({ category: 'Men\\'s Clothing', minRating: 4.5 })");
    try {
        await searchProducts({ category: "Men's Clothing", minRating: 4.5 });
        console.log("Unexpected success! (The migration might have run on the database in the background)");
    } catch (err: any) {
        console.log("Expected PostgREST Error response:");
        console.error(`  Error message: ${err.message}`);
    }
}

async function main() {
    await runMockTests();
    await runLiveQueryTest();
}

main().catch(console.error);
