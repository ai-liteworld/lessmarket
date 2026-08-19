import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchSearchFilters, searchAds, type FilterGenerationResult } from "@/lib/api";
import AdCard from "@/components/AdCard";
import { Icon } from "@/components/icons";

export default function SearchPage() {
  const location = useLocation();
  const initialQuery = (location.state as { query?: string } | null)?.query ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<FilterGenerationResult | null>(null);

  const filterMutation = useMutation({
    mutationFn: fetchSearchFilters,
    onSuccess: setFilters,
  });

  // A query handed off from the landing page's hero prompt runs
  // automatically, so "Let's do it!" feels like one action, not two.
  useEffect(() => {
    if (initialQuery) filterMutation.mutate(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Runs even before a search is made, so /search shows recent listings by
  // default (same recency-based query the landing page uses) rather than a
  // blank page; narrows to filters.category_path once a search runs.
  const resultsQuery = useQuery({
    queryKey: ["ads-search", filters?.category_path],
    queryFn: () => searchAds({ category_path: filters?.category_path }),
  });

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
              if (e.key === "Enter" && query && !filterMutation.isPending) filterMutation.mutate(query);
            }}
          />
          <button
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
            disabled={!query || filterMutation.isPending}
            onClick={() => filterMutation.mutate(query)}
          >
            {filterMutation.isPending ? "Searching…" : "Search"} <Icon.Search />
          </button>
        </div>

        {filters && (
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {filters.refinement_options.map((opt) => (
              <span key={opt.key} className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs text-[var(--foreground)]">
                {opt.label}
              </span>
            ))}
            {/* ADDENDUM: surfaces the LLM's exclusion reasoning to the buyer for transparency */}
            {filters.excluded_categories.length > 0 && (
              <span className="rounded-full bg-[var(--secondary)] px-3 py-1 text-xs text-[var(--muted-foreground)]">
                Excluding: {filters.excluded_categories.join(", ")}
              </span>
            )}
          </div>
        )}

        <div className="mt-8">
          {resultsQuery.isLoading && <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>}
          {resultsQuery.data?.results?.length === 0 && (
            <p className="text-sm text-[var(--muted-foreground)]">No listings found.</p>
          )}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {resultsQuery.data?.results?.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
