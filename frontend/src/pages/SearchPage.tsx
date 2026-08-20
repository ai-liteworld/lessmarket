import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchSearchFilters, searchAds, type SpecField } from "@/lib/api";
import AdCard from "@/components/AdCard";
import CategoryGroupPicker from "@/components/CategoryGroupPicker";
import { Icon } from "@/components/icons";

interface SortOption {
  key: string;
  label: string;
}

const BASE_SORT_OPTIONS: SortOption[] = [
  { key: "recent", label: "Newest" },
  { key: "price_asc", label: "Price: Low to High" },
  { key: "price_desc", label: "Price: High to Low" },
];

/** Numeric refinement fields (from the AI's search filters) double as extra
 * sort chips - e.g. a "mileage" field lets the buyer sort "Mileage: Low to
 * High" in addition to the always-available price/newest options. Capped
 * to the first 2 fields so the row doesn't get crowded. */
function sortOptionsFor(refinementOptions: SpecField[]): SortOption[] {
  const numeric = refinementOptions.filter((f) => f.type === "number").slice(0, 2);
  return [
    ...BASE_SORT_OPTIONS,
    ...numeric.flatMap((f) => [
      { key: `spec:${f.key}:asc`, label: `${f.label}: Low to High` },
      { key: `spec:${f.key}:desc`, label: `${f.label}: High to Low` },
    ]),
  ];
}

export default function SearchPage() {
  const location = useLocation();
  const initialQuery = (location.state as { query?: string } | null)?.query ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [refinementOptions, setRefinementOptions] = useState<SpecField[]>([]);
  const [relevant, setRelevant] = useState<string[]>([]);
  const [exclude, setExclude] = useState<string[]>([]);
  const [sort, setSort] = useState("recent");

  const filterMutation = useMutation({
    mutationFn: fetchSearchFilters,
    onSuccess: (result) => {
      // AI suggestions seed the two chip groups but stay fully editable
      // from here - add your own, remove a suggestion, either group.
      setRelevant(result.category_paths);
      setExclude(result.excluded_categories);
      setRefinementOptions(result.refinement_options);
    },
  });

  // A query handed off from the landing page's hero prompt runs
  // automatically, so "Let's do it!" feels like one action, not two.
  useEffect(() => {
    if (initialQuery) filterMutation.mutate(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Runs even before a search is made, so /search shows recent listings by
  // default rather than a blank page; narrows by whatever's currently in
  // the relevant/exclude chip groups and the chosen sort.
  const resultsQuery = useQuery({
    queryKey: ["ads-search", query, relevant, exclude, sort],
    queryFn: () => searchAds({ q: query || undefined, category_paths: relevant, exclude_category_paths: exclude, sort }),
  });

  const runSearch = () => {
    if (query.trim()) filterMutation.mutate(query.trim());
  };

  const sortOptions = sortOptionsFor(refinementOptions);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-6xl px-6 pb-16 pt-10">
        <h1 className="font-display mb-6 text-3xl font-semibold tracking-tight text-[var(--foreground)]">Find something</h1>

        <div className="flex max-w-xl gap-2">
          <input
            className="flex-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            placeholder="I need a red mountain bike under $500"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query && !filterMutation.isPending) runSearch();
            }}
          />
          <button
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
            disabled={!query || filterMutation.isPending}
            onClick={runSearch}
          >
            {filterMutation.isPending ? "Searching…" : "Search"} <Icon.Search />
          </button>
        </div>

        {/* Relevant / exclude category groups - AI-seeded from the query above, freely editable either way */}
        <div className="mt-6 flex max-w-xl flex-col gap-5">
          <CategoryGroupPicker
            label="Relevant categories"
            values={relevant}
            onChange={setRelevant}
            tone="primary"
            addLabel="Add relevant"
          />
          <CategoryGroupPicker
            label="Exclude categories"
            values={exclude}
            onChange={setExclude}
            tone="danger"
            addLabel="Add exclusion"
          />
        </div>

        {/* Sort chips - generated from whichever categories are currently relevant */}
        <div className="mt-6 flex flex-wrap gap-2">
          {sortOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSort(opt.key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                sort === opt.key
                  ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {resultsQuery.isLoading && <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>}
          {resultsQuery.data?.results?.length === 0 && (
            <p className="text-sm text-[var(--muted-foreground)]">No listings found.</p>
          )}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {resultsQuery.data?.results?.map((ad) => (
              <AdCard key={ad.id} ad={ad} compact />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
