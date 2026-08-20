-- Phase 3: multi-category ads + AI-driven search category groups.
-- Run this once against the existing database (e.g. via Supabase SQL Editor),
-- AFTER taking a backup / during low-traffic hours - it rewrites the ads
-- table's category column.
--
-- Context: ads previously carried a single `category_path`. The redesigned
-- Post Ad / Manage Ads / Search flows let a seller attach several categories
-- to one ad (chip picker with "+" to add, "x" to remove), and let a buyer's
-- search generate BOTH a "relevant" group and an "exclude" group of
-- categories from free text (see app/llm/prompts.py::BUYER_FILTER_SYSTEM_PROMPT
-- and FilterGenerationResult.category_paths). `excluded_category_paths` on
-- ads already existed (LLM "commonly confused with" note) and is now also
-- directly editable by the seller in the Post Ad form.
--
-- No schema change is needed for phone-number reveal (spec: advertiser phone
-- hidden behind a click, visible only to authenticated buyers) - that's
-- enforced entirely in the API route (GET /api/ads/{id}/phone requires a
-- valid bearer token; the number is never included in the public ad payload).

-- 1. Add the new multi-value column, backfilled from the old single value.
ALTER TABLE ads ADD COLUMN IF NOT EXISTS category_paths TEXT[] NOT NULL DEFAULT '{}';
UPDATE ads SET category_paths = ARRAY[category_path]
  WHERE category_paths = '{}' AND category_path IS NOT NULL;

-- 2. Index the new array column the same way excluded_category_paths already is.
CREATE INDEX IF NOT EXISTS idx_ads_category_paths ON ads USING GIN (category_paths);

-- 3. Drop the old single-value column and its index now that every row has
--    been backfilled into category_paths.
DROP INDEX IF EXISTS idx_ads_category_path;
ALTER TABLE ads DROP COLUMN IF EXISTS category_path;
