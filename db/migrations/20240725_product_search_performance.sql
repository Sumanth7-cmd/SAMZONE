-- Production indexes for the Supabase/PostgREST catalog read paths.
-- Run after 20240723_add_flipkart_schema.sql.  All statements are idempotent.

ALTER TABLE products_new
    ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_products_new_search_vector
    ON products_new USING GIN (search_vector);

-- Stable product_id tiebreakers match the application's paginated queries.
CREATE INDEX IF NOT EXISTS idx_products_new_price_product
    ON products_new (discounted_price, product_id);
CREATE INDEX IF NOT EXISTS idx_products_new_rating_product
    ON products_new (rating DESC, product_id);
CREATE INDEX IF NOT EXISTS idx_products_new_created_product
    ON products_new (created_at DESC, product_id);
CREATE INDEX IF NOT EXISTS idx_products_new_category_price_product
    ON products_new (category_id, discounted_price, product_id);
