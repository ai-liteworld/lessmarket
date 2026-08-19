import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchSearchFilters, searchAds, type FilterGenerationResult } from "@/lib/api";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<FilterGenerationResult | null>(null);

  const filterMutation = useMutation({
    mutationFn: fetchSearchFilters,
    onSuccess: setFilters,
  });

  const resultsQuery = useQuery({
    queryKey: ["ads-search", filters?.category_path],
    queryFn: () => searchAds({ category_path: filters?.category_path }),
    enabled: !!filters,
  });

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h1 className="text-lg font-semibold">Find something</h1>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded border p-2"
          placeholder="I need a red mountain bike under $500"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
          disabled={!query || filterMutation.isPending}
          onClick={() => filterMutation.mutate(query)}
        >
          Search
        </button>
      </div>

      {filters && (
        <div className="flex flex-wrap gap-2 text-sm">
          {filters.refinement_options.map((opt) => (
            <span key={opt.key} className="rounded-full border px-3 py-1">{opt.label}</span>
          ))}
          {/* ADDENDUM: surfaces the LLM's exclusion reasoning to the buyer for transparency */}
          {filters.excluded_categories.length > 0 && (
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-neutral-500">
              Excluding: {filters.excluded_categories.join(", ")}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {resultsQuery.data?.results?.map((ad: any) => (
          <div key={ad.id} className="rounded border p-3">
            <p className="font-medium">{ad.title}</p>
            <p className="text-sm text-neutral-500">${ad.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
