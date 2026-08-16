# Root Causes & Fix Plan

## 1. Product Grid – Broken Images
**Root cause**: `productsSearchApi.ts → mapProduct()` calls its own `firstImage()` which does NOT call `normalizeImageUrl`. It just does string splitting and returns the raw `http://img5a.flixcart.com/...` URL without rewriting to `rukminim2` or upgrading to HTTPS. The browser blocks or fails mixed-content HTTP images.

**Fix**: Replace `firstImage()` in `productsSearchApi.ts` to call `normalizeImageUrl` from `productImage.ts`. Also remove the incomplete naive split logic.

## 2. Product Details – Image mismatch/duplicates/raw specs
**Root cause**: `getProductById` in `api.ts` fetches from Supabase and calls `mapRawProduct()` which correctly calls `normalizeProductImages()`. So images should work IF the CDN rewrite works. Issue is `normalizeImageUrl` only handles `imgNa.flixcart.com` pattern but DB also has exact pattern `img5a.flixcart.com` and `img6a.flixcart.com` which matches the regex. The `parseSpecifications` function was already added.

**Fix**: Make image normalization more robust. Ensure CDN rewrite covers all `imgXXa.flixcart.com` patterns.

## 3. Skin Guide – Non-fashion results
**Root cause**: `productApi.searchByColor` searches ALL products in `products_new` by name/description color terms. No fashion category filter. Returns car mats, home items, electronics.

**Fix**: Add category filter to `searchByColor` — restrict to known fashion categories from `categories` table.

## 4. Outfit Stylist – "Couldn't style a look"
**Root cause**: Backend runs on port 8081 and uses seeded mock data (FASHION-MEN-* products from H2/in-memory database), not Supabase. BUT the stylist DOES return results from the curl test. The frontend error comes from `fetch()` failing. The backend port may be wrong or the frontend uses 8080 by default but backend is on 8081.

**Fix**: Check `VITE_API_URL` in frontend `.env`. Backend is on 8081, so the env needs to reflect this.

## 5. Visual Search – "Couldn't analyze"
**Root cause**: Same port issue. Backend's `/api/visual-search` WORKS on 8081 (verified). Frontend errors because the fetch fails (wrong port or CORS).

**Fix**: Same as #4 — fix the API URL.

## 6. AI Chatbot – Fashion intent & outfit reasoning
**Root cause**: `conversationalShoppingAssistant.ts` has `CATEGORY_HINTS` including laptops, cameras, toys. For "what suits black pant", no outfit compatibility logic exists — it just does a keyword search for "suit" (which matches "suit" the garment type). The `searchByColor` query doesn't filter fashion categories.

**Fix**: 
1. Add outfit compatibility logic: "black pant" → search tops (shirts, t-shirts) not just keyword match.
2. Remove non-fashion CATEGORY_HINTS from fashion context detection.
3. Add strict fashion-only filter in getProducts call path.

## 7. Frontend API URL
**Root cause**: Vite `.env` likely missing `VITE_API_URL=http://localhost:8081`.
