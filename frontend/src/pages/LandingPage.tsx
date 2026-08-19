import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { searchAds } from "@/lib/api";
import AdCard from "@/components/AdCard";

export default function LandingPage() {
  // No q/category_path -> most recently posted active ads (see the comment
  // on GET /api/ads/search in the backend: recency is the "top ads"
  // stand-in until view/click tracking exists).
  const topAdsQuery = useQuery({
    queryKey: ["ads-top"],
    queryFn: () => searchAds({ page: 1 }),
  });

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col items-center gap-4 rounded-lg bg-neutral-900 px-6 py-12 text-center text-white">
        <h1 className="text-2xl font-semibold sm:text-3xl">Describe it. We'll list it.</h1>
        <p className="max-w-md text-sm text-neutral-300">
          Tell lessmarket what you're selling or looking for in plain language - our AI
          handles the categories and filters for you.
        </p>
        <div className="flex gap-3">
          <Link to="/search" className="rounded bg-white px-4 py-2 text-sm font-medium text-neutral-900">
            Browse
          </Link>
          <Link to="/sell" className="rounded border border-white px-4 py-2 text-sm font-medium text-white">
            Sell something
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Recent listings</h2>
        {topAdsQuery.isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
        {topAdsQuery.isError && (
          <p className="text-sm text-red-600">Couldn't load listings right now - try refreshing.</p>
        )}
        {topAdsQuery.data && topAdsQuery.data.results.length === 0 && (
          <p className="text-sm text-neutral-500">No listings yet - be the first to sell something.</p>
        )}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {topAdsQuery.data?.results.map((ad) => (
            <AdCard key={ad.id} ad={ad} />
          ))}
        </div>
      </section>
    </div>
  );
}
