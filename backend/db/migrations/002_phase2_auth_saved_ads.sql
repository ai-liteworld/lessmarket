-- Phase 2: phone auth + saved ads (favorites)
-- Run this once against the existing database (e.g. via Supabase SQL Editor).

-- Phone becomes the primary signup/login identifier; email becomes optional.
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Enforce one account per phone number (Postgres allows multiple NULLs under
-- a UNIQUE constraint, so this doesn't block legacy/email-only rows, if any).
ALTER TABLE users ADD CONSTRAINT users_phone_unique UNIQUE (phone);

CREATE TABLE IF NOT EXISTS saved_ads (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, ad_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_ads_user_id ON saved_ads(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_ads_ad_id ON saved_ads(ad_id);
