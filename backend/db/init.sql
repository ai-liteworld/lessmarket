-- Initial schema, from TECHNICAL SPECIFICATION section 3, extended per
-- docs/ADDENDUM_negative_categories.md (excluded_category_paths on ads).
-- Applied automatically by the postgres container on first boot (see
-- docker-compose.yml) or manually via:
--   psql "$DATABASE_URL" -f backend/db/init.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS vector;     -- pgvector

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- active, sold, expired, deleted
    category_paths TEXT[] NOT NULL DEFAULT '{}', -- e.g. ARRAY['Vehicles > Bicycles > Mountain Bikes'] (phase 3: multi-category)
    excluded_category_paths TEXT[] DEFAULT '{}', -- LLM-flagged "commonly confused with" categories, seller-editable (phase 3)
    specs JSONB NOT NULL,                  -- Dynamic specs (LLM-generated + user-added)
    user_added_fields TEXT[] DEFAULT '{}',
    embedding VECTOR(1536),
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ads_seller_id ON ads(seller_id);
CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_category_paths ON ads USING GIN (category_paths);
CREATE INDEX IF NOT EXISTS idx_ads_excluded_category_paths ON ads USING GIN (excluded_category_paths);
CREATE INDEX IF NOT EXISTS idx_ads_specs ON ads USING GIN (specs);
CREATE INDEX IF NOT EXISTS idx_ads_embedding ON ads USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_ads_fulltext ON ads USING GIN (to_tsvector('english', title || ' ' || description));

CREATE TABLE IF NOT EXISTS ad_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ad_images_ad_id ON ad_images(ad_id);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID NOT NULL REFERENCES ads(id),
    buyer_id UUID NOT NULL REFERENCES users(id),
    seller_id UUID NOT NULL REFERENCES users(id),
    total_price DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, shipped, delivered, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id),
    receiver_id UUID NOT NULL REFERENCES users(id),
    ad_id UUID NOT NULL REFERENCES ads(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schema_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_text TEXT NOT NULL UNIQUE,
    schema_json JSONB NOT NULL,  -- includes excluded_category_paths (ADDENDUM)
    filter_json JSONB NOT NULL,  -- includes excluded_categories / negative_filters (ADDENDUM)
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    use_count INT DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_schema_cache_trigger_text ON schema_cache(trigger_text);

CREATE TABLE IF NOT EXISTS promoted_specs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_path TEXT NOT NULL,
    field_key TEXT NOT NULL,
    frequency NUMERIC NOT NULL,
    promoted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (category_path, field_key)
);
