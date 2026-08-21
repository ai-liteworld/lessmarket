import { useRef, useState, type KeyboardEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchSearchFilters, searchAds, type SpecField } from "@/lib/api";
import AdCard from "@/components/AdCard";
import CategoryToggleGroup, { mergeCategoryEntries, type CategoryEntry } from "@/components/CategoryToggleGroup";
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
 * sort chips, capped to 2 so the row doesn't get crowded. */
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

export default function LandingPage() {
  const [prompt, setPrompt] = useState("");
  const [relevant, setRelevant] = useState<CategoryEntry[]>([]);
  const [exclude, setExclude] = useState<CategoryEntry[]>([]);
  const [refinementOptions, setRefinementOptions] = useState<SpecField[]>([]);
  const [sort, setSort] = useState("recent");
  const [hasSearched, setHasSearched] = useState(false);
  // Guards against re-fetching categories on every single space bar hit for
  // text that hasn't actually changed (e.g. holding the key down).
  const lastFetchedText = useRef("");

  const filterMutation = useMutation({
    mutationFn: fetchSearchFilters,
    onSuccess: (result) => {
      // New AI suggestions merge in as active chips; a category the user
      // already deselected stays deselected rather than reappearing.
      setRelevant((prev) => mergeCategoryEntries(prev, result.category_paths));
      setExclude((prev) => mergeCategoryEntries(prev, result.excluded_categories));
      setRefinementOptions(result.refinement_options);
    },
  });

  const activeRelevant = relevant.filter((e) => e.active).map((e) => e.label);
  const activeExclude = exclude.filter((e) => e.active).map((e) => e.label);

  // Before a search is run: recency-based "top ads" browse grid.
  const topAdsQuery = useQuery({
    queryKey: ["ads-top"],
    queryFn: () => searchAds({ page: 1 }),
    enabled: !hasSearched,
  });

  // After the user clicks Search: prompt text + whichever category chips
  // are currently active, in the chosen sort order.
  const searchResultsQuery = useQuery({
    queryKey: ["ads-search", prompt, activeRelevant, activeExclude, sort],
    queryFn: () =>
      searchAds({ q: prompt.trim() || undefined, category_paths: activeRelevant, exclude_category_paths: activeExclude, sort }),
    enabled: hasSearched,
  });

  // Category suggestions refresh as the user finishes each word (space bar),
  // not on every keystroke - keeps the LLM call proportional to typing pace.
  const handleTextareaKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== " ") return;
    const text = prompt.trim();
    if (!text || text === lastFetchedText.current || filterMutation.isPending) return;
    lastFetchedText.current = text;
    filterMutation.mutate(text);
  };

  const runSearch = () => setHasSearched(true);

  const showCategories = prompt.trim().length > 0 || relevant.length > 0 || exclude.length > 0;
  const sortOptions = sortOptionsFor(refinementOptions);

  const ads = hasSearched ? searchResultsQuery.data?.results ?? [] : topAdsQuery.data?.results ?? [];
  const isLoading = hasSearched ? searchResultsQuery.isLoading : topAdsQuery.isLoading;
  const isError = hasSearched ? searchResultsQuery.isError : topAdsQuery.isError;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Search box: middle-top, categories appear once typing starts */}
      <div className="mx-auto max-w-3xl px-6 pb-6 pt-10 text-center">
        <h1 className="font-display mb-6 text-3xl font-light italic leading-snug text-[var(--foreground)]">
          Find what matters.
          <br />
          Let go of what doesn't.
        </h1>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleTextareaKeyDown}
          placeholder="I need a red mountain bike under $500…"
          rows={2}
          className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-left text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
        <div className="mt-3 flex justify-center">
          <button
            onClick={runSearch}
            disabled={!prompt.trim() && activeRelevant.length === 0}
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Search <Icon.Arrow />
          </button>
        </div>

        {showCategories && (
          <div className="mt-6 flex flex-col items-center gap-4 text-left">
            <div className="w-full max-w-xl">
              <CategoryToggleGroup label="Relevant categories" entries={relevant} onChange={setRelevant} tone="primary" addLabel="Add relevant" />
            </div>
            <div className="w-full max-w-xl">
              <CategoryToggleGroup label="Exclude categories" entries={exclude} onChange={setExclude} tone="danger" addLabel="Add exclusion" />
            </div>
          </div>
        )}

        {hasSearched && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
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
        )}
      </div>

      {/* Ad grid: image + price + a short blurb line - full detail is on the ad page */}
      <div className="mx-auto max-w-6xl px-6 pb-16">
        {isLoading && <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>}
        {isError && <p className="text-sm text-red-600">Couldn't load listings right now - try refreshing.</p>}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} compact />
          ))}
          {!isLoading && ads.length === 0 && (
            <div className="col-span-full py-16 text-center text-sm text-[var(--muted-foreground)]">
              {hasSearched ? "No listings found." : "No listings yet - be the first to sell something."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
