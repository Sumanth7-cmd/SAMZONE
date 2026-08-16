#!/bin/bash
source frontend/.env
URL="${VITE_SUPABASE_URL}/rest/v1/products_new?product_id=eq.6178&select=product_id%2Cuniq_id%2Cpid%2Cname%2Cbrand_id%2Ccategory_id%2Cretail_price%2Cdiscounted_price%2Cdescription%2Crating%2Cimage%2Cspecifications%2Ccreated_at%2Cbrands%21fk_brand%28name%29%2Ccategories%21fk_category%28path%29"

curl -s "$URL" \
  -H "apikey: ${VITE_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}" \
  | jq .
