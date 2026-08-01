-- 20240724_add_shopping_infrastructure.sql
-- Adds normalized shopping and user persistence tables for the SAMZONE catalog.

-- Application users used for cart/wishlist/orders/reviews/history.
CREATE TABLE IF NOT EXISTS app_users (
    app_user_id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Persistent cart items for authenticated users.
CREATE TABLE IF NOT EXISTS cart_items (
    cart_item_id SERIAL PRIMARY KEY,
    app_user_id TEXT NOT NULL REFERENCES app_users(app_user_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products_new(product_id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity >= 1),
    size TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (app_user_id, product_id, size, color)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_app_user_id ON cart_items(app_user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- Persistent wishlist items for authenticated users.
CREATE TABLE IF NOT EXISTS wishlist_items (
    wishlist_item_id SERIAL PRIMARY KEY,
    app_user_id TEXT NOT NULL REFERENCES app_users(app_user_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products_new(product_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (app_user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_app_user_id ON wishlist_items(app_user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id ON wishlist_items(product_id);

-- Orders and ordered products.
CREATE TABLE IF NOT EXISTS orders (
    order_id SERIAL PRIMARY KEY,
    app_user_id TEXT NOT NULL REFERENCES app_users(app_user_id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    total NUMERIC NOT NULL DEFAULT 0,
    payment_method TEXT,
    shipping_address JSONB,
    billing_address JSONB,
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_app_user_id ON orders(app_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products_new(product_id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity >= 1),
    price NUMERIC NOT NULL DEFAULT 0,
    size TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Product reviews.
CREATE TABLE IF NOT EXISTS product_reviews (
    review_id SERIAL PRIMARY KEY,
    app_user_id TEXT NOT NULL REFERENCES app_users(app_user_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products_new(product_id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (app_user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_app_user_id ON product_reviews(app_user_id);

-- Recently viewed products.
CREATE TABLE IF NOT EXISTS recently_viewed_products (
    view_id SERIAL PRIMARY KEY,
    app_user_id TEXT NOT NULL REFERENCES app_users(app_user_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products_new(product_id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (app_user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_recently_viewed_app_user_id ON recently_viewed_products(app_user_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_app_user_id_viewed_at ON recently_viewed_products(app_user_id, viewed_at DESC);

-- Search history.
CREATE TABLE IF NOT EXISTS search_history (
    search_id SERIAL PRIMARY KEY,
    app_user_id TEXT NOT NULL REFERENCES app_users(app_user_id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    result_count INT NOT NULL DEFAULT 0,
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_history_app_user_id ON search_history(app_user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_searched_at ON search_history(searched_at DESC);

-- User preferences and personalization.
CREATE TABLE IF NOT EXISTS user_preferences (
    app_user_id TEXT PRIMARY KEY REFERENCES app_users(app_user_id) ON DELETE CASCADE,
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification inbox for the user experience.
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    app_user_id TEXT NOT NULL REFERENCES app_users(app_user_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_app_user_id ON notifications(app_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(app_user_id, is_read);
