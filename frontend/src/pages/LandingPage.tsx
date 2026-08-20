import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { searchAds, suggestCategories } from "@/lib/api";
import AdCard from "@/components/AdCard";
import CategoryChip from "@/components/CategoryChip";
import { Icon } from "@/components/icons";

export default function LandingPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [activeCategories, setActiveCategories] = useState<string[]>([]);

  // "Top ads" stand-in: most recently posted active listings (see the
  // comment on GET /api/ads/search - recency until view/click tracking
  // exists), shown as a grid.
  const topAdsQuery = useQuery({
    queryKey: ["ads-top"],
    queryFn: () => searchAds({ page: 1 }),
  });

  // Category chips are real data (categories already used on live ads),
  // not a hardcoded list - keeps the filter row in sync with whatever
  // sellers have actually posted, including their own custom categories.
  const categoriesQuery = useQuery({
    queryKey: ["categories-top"],
    queryFn: () => suggestCategories(""),
  });

  const toggleCategory = (cat: string) => {
    setActiveCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const ads = topAdsQuery.data?.results ?? [];
  const filteredAds = activeCategories.length
    ? ads.filter((ad) => ad.category_paths?.some((cp) => activeCategories.includes(cp)))
    : ads;

  const handleSubmit = () => {
    if (prompt.trim()) navigate("/search", { state: { query: prompt.trim() } });
    else navigate("/search");
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero prompt */}
      <div className="mx-auto max-w-6xl px-6 pb-6 pt-10">
        <div className="max-w-xl">
          <h1 className="font-display mb-4 text-3xl font-light italic leading-snug text-[var(--foreground)]">
            Find what matters.
            <br />
            Let go of what doesn't.
          </h1>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="I need a red mountain bike under $500…"
            rows={2}
            className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
            >
              Let's do it! <Icon.Arrow />
            </button>
          </div>
        </div>

        {/* Category filters */}
        {categoriesQuery.data && categoriesQuery.data.length > 0 && (
          <div className="mt-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)]">Browse by category</p>
            <div className="flex flex-wrap gap-2">
              {categoriesQuery.data.map((cat) => (
                <CategoryChip key={cat} label={cat} selected={activeCategories.includes(cat)} onToggle={() => toggleCategory(cat)} />
              ))}
              {activeCategories.length > 0 && (
                <button
                  onClick={() => setActiveCategories([])}
                  className="ml-1 text-xs text-[var(--muted-foreground)] underline underline-offset-2 transition-colors hover:text-[var(--accent)]"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Ad grid: image + price only - other details show on the ad page */}
      <div className="mx-auto max-w-6xl px-6 pb-16">
        {topAdsQuery.isLoading && <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>}
        {topAdsQuery.isError && <p className="text-sm text-red-600">Couldn't load listings right now - try refreshing.</p>}
        {activeCategories.length > 0 && (
          <p className="mb-4 text-xs text-[var(--muted-foreground)]">
            {filteredAds.length} listing{filteredAds.length !== 1 ? "s" : ""} in {activeCategories.join(", ")}
          </p>
        )}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filteredAds.map((ad) => (
            <AdCard key={ad.id} ad={ad} compact />
          ))}
          {topAdsQuery.data && filteredAds.length === 0 && (
            <div className="col-span-full py-16 text-center text-sm text-[var(--muted-foreground)]">
              {activeCategories.length > 0 ? "No listings in this category yet." : "No listings yet - be the first to sell something."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
