# Addendum: Negative Categories for Filtration

**Status:** Proposed extension to `TECHNICAL SPECIFICATION AI-Driven Dynamic
Marketplace.pdf` v1.0, section 4 (LLM Integration Specifications). Not yet
merged into the source PDF — this document is the spec of record for the
feature until it is folded into a v1.1 of the main document.

## 1. The idea

The original spec has the LLM generate only *positive* signals:

- **Sellers** get a `category_path` plus `required_specs` / `optional_specs`
  for the item they're describing.
- **Buyers** get a `category_path` plus `filters` for their search query.

In practice, embeddings and keyword matching pull in near-miss results that
share vocabulary or category proximity without being the right item — e.g.
a search for "waterproof jacket" can surface "Camping > Tents" listings
because "waterproof" matches strongly on both. The fix is to have the same
LLM call also emit what the item/query is **not**, so search can actively
exclude those categories rather than relying on ranking alone to bury them.

This gives two negative signals, one per flow:

| Flow | New field(s) | Purpose |
|---|---|---|
| Seller schema generation | `excluded_category_paths` | Categories this item is commonly confused with / miscategorized under — helps prevent the item itself from being mis-filed, and seeds the buyer-side exclusion list for related categories. |
| Buyer filter generation | `excluded_categories`, `negative_filters` | Categories to drop from this search's results even if they match lexically/semantically; specific key/value pairs the results must NOT have. |

## 2. Updated LLM prompts

Both system prompts (spec 4.1 and 4.2) gain one additional numbered
instruction. Implemented in `backend/app/llm/prompts.py`:

**Seller schema prompt** — adds:
> 4. excluded_category_paths: An array of hierarchical category paths that
> this item is commonly confused with or miscategorized under, and that it
> explicitly does NOT belong to (e.g., a "mountain bike" should exclude
> "Sports & Fitness > Exercise Bikes"). Return an empty array if nothing is
> obviously confusable.

**Buyer filter prompt** — adds:
> 4. excluded_categories: An array of hierarchical category paths that are
> lexically or semantically similar to the query but should be EXCLUDED
> from results (e.g., "waterproof jacket" should exclude "Outdoor & Camping
> \> Tents" even though "waterproof" matches).
> 5. negative_filters: An object with key-value pairs the results must NOT
> match, when the query implies an exclusion.

## 3. Updated response shapes

```jsonc
// POST /api/ads/schema response (seller flow)
{
  "category_path": "Vehicles > Bicycles > Mountain Bikes",
  "required_specs": [ /* ... unchanged ... */ ],
  "optional_specs": [ /* ... unchanged ... */ ],
  "excluded_category_paths": [
    "Sports & Fitness > Exercise Bikes",
    "Vehicles > Bicycles > Kids Bikes"
  ]
}
```

```jsonc
// POST /api/search/filters response (buyer flow)
{
  "category_path": "Clothing > Outerwear > Jackets",
  "filters": { "waterproof": true, "price_max": 150 },
  "refinement_options": [ /* ... unchanged ... */ ],
  "excluded_categories": ["Outdoor & Camping > Tents", "Outdoor & Camping > Tarps"],
  "negative_filters": { "condition": "for parts" }
}
```

Validated at runtime by `SchemaGenerationResult` / `FilterGenerationResult`
in `backend/app/schemas/llm.py`.

## 4. Data model changes

- `ads.excluded_category_paths TEXT[]` — new column (see
  `backend/db/init.sql` and `backend/app/models/ad.py`), GIN-indexed. Set
  once at listing time from the seller schema response; used by search to
  keep an ad out of results for a query whose `excluded_categories`
  includes one of the ad's excluded paths (or, more directly, keep an ad
  out of a category page it explicitly doesn't belong to).
- `schema_cache.schema_json` / `schema_cache.filter_json` — no new columns;
  the negative fields ride inside the existing JSONB payloads since this
  table is a transient cache keyed by trigger text, not something queried
  by exclusion field.

No migration tooling is wired up yet (see `docs/DEVELOPMENT_PLAN.md`,
Phase 1) — `backend/db/init.sql` is the current source of truth and already
includes this column.

## 5. Search execution changes (spec section 4.3)

Original steps 1–4 (semantic search, JSONB filters, 70/30 ranking,
pagination) are unchanged. Two exclusion steps are inserted between steps 2
and 3:

1. Semantic search via pgvector cosine similarity on `ads.embedding`.
2. Apply JSONB `filters` on `ads.specs`.
3. **(new)** Drop rows where `ads.category_path` (or any of
   `ads.excluded_category_paths`) intersects the LLM's `excluded_categories`.
4. **(new)** Drop rows where `ads.specs` matches any key/value in
   `negative_filters`.
5. Rank by weighted combination: vector similarity (70%) + recency (30%).
6. Return paginated results.

Stubbed with `TODO`s in `backend/app/api/routes/search.py::search_ads` —
the actual SQL predicate composition is real implementation work, not just
scaffolding, and is scheduled for Milestone M4 (search & vector) in the
development plan.

## 6. Frontend

`SchemaGenerationResult` and `FilterGenerationResult` in
`frontend/src/lib/api.ts` carry the new fields. `DynamicForm.tsx` shows the
seller a "Not listed under: …" note; `SearchPage.tsx` shows the buyer an
"Excluding: …" chip so the exclusion logic isn't a silent black box.

## 7. Open questions to resolve before implementation

- Should `excluded_category_paths` on an ad be **enforced** (hard filter)
  or just used as a **ranking penalty**? Hard filtering is simpler and is
  what's scaffolded, but a bad LLM call could wrongly exclude a valid ad
  from a category it should appear in.
- Should the nightly background-learning job (spec section 5) also learn
  common exclusion patterns per category, the way it promotes user-added
  fields? Not scoped yet.
- `negative_filters` matching semantics on JSONB values (exact match vs.
  substring vs. numeric range) need a decision once real query volume
  exists to test against.
