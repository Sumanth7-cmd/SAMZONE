-- SAMZONE products table migration, part 1 of 2.
-- Creates a new table alongside the existing `products` table using the
-- Amazon Products Dataset schema. Run this once in the Supabase SQL Editor,
-- then tell Claude it's done so it can import the sampled data.
--
-- The existing `products` table (40,591 Kaggle fashion rows) is NOT touched
-- by this script. The swap to replace it happens in part 2, after the new
-- data has been imported and verified.

begin;

create table if not exists products_new (
    id bigint generated always as identity primary key,
    asin text not null unique,
    title text not null,
    product_url text,
    image_url text,
    rating numeric(3,2),
    reviews_count integer,
    price numeric(10,2),
    list_price numeric(10,2),
    category_id integer,
    category_name text,
    is_best_seller boolean not null default false,
    bought_last_month integer,
    created_at timestamptz not null default now()
);

-- asin's `unique` constraint above already creates a unique btree index.
create index if not exists idx_products_new_category_id on products_new (category_id);
create index if not exists idx_products_new_rating on products_new (rating);
create index if not exists idx_products_new_title_fts on products_new using gin (to_tsvector('english', title));

commit;
