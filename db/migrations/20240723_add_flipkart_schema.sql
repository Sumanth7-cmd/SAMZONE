-- 20240723_add_flipkart_schema.sql
-- Creates staging table and normalized schema for Flipkart dataset

-- Staging table (raw import)
CREATE TABLE IF NOT EXISTS staging_products (
    uniq_id TEXT PRIMARY KEY,
    crawl_timestamp TIMESTAMP,
    product_url TEXT UNIQUE,                     -- added UNIQUE
    product_name TEXT NOT NULL,                  -- NOT NULL
    product_category_tree JSONB NOT NULL,        -- NOT NULL
    pid TEXT,
    retail_price NUMERIC CHECK (retail_price >= 0),            -- CHECK
    discounted_price NUMERIC CHECK (discounted_price >= 0),      -- CHECK
    image JSONB NOT NULL,
    is_fk_advantage_product BOOLEAN,
    description TEXT,
    product_rating TEXT,
    overall_rating TEXT,
    brand TEXT NOT NULL,                         -- NOT NULL
    product_specifications JSONB
);

-- Brands
CREATE TABLE IF NOT EXISTS brands (
    brand_id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY,
    path TEXT UNIQUE NOT NULL
);

-- Products (normalized; staged separately until promotion)
CREATE TABLE IF NOT EXISTS products_new (
    product_id SERIAL PRIMARY KEY,
    uniq_id TEXT UNIQUE NOT NULL,
    pid TEXT,
    name TEXT NOT NULL,
    brand_id INT NOT NULL REFERENCES brands(brand_id),
    category_id INT NOT NULL REFERENCES categories(category_id),
    retail_price NUMERIC CHECK (retail_price >= 0),
    discounted_price NUMERIC CHECK (discounted_price >= 0),
    description TEXT,
    rating NUMERIC,
    image JSONB,
    specifications JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_brand FOREIGN KEY (brand_id) REFERENCES brands(brand_id) ON DELETE RESTRICT,
    CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT
);

-- Indexes for search & filtering
CREATE INDEX IF NOT EXISTS idx_products_new_brand ON products_new(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_new_category ON products_new(category_id);
CREATE INDEX IF NOT EXISTS idx_products_new_price ON products_new(retail_price);
CREATE INDEX IF NOT EXISTS idx_products_new_rating ON products_new(rating);
CREATE INDEX IF NOT EXISTS idx_products_new_fulltext ON products_new USING GIN (to_tsvector('english', name || ' ' || description));
