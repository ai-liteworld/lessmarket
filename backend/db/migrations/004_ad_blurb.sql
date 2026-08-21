-- Phase 3b: short LLM-generated blurb shown under an ad's image in
-- search/browse grids (the grid has no room for the full description).
-- Run this once against the existing database (e.g. via Supabase SQL Editor).

ALTER TABLE ads ADD COLUMN IF NOT EXISTS blurb TEXT;
