import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { fetchAd, fetchAdPhone, saveAd, unsaveAd } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { Icon } from "@/components/icons";

export default function AdDetailPage() {
  const { id } = useParams<{ id: string }>();
  const token = useAppStore((s) => s.token);
  const [saved, setSaved] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const adQuery = useQuery({
    queryKey: ["ad", id],
    queryFn: () => fetchAd(id as string),
    enabled: !!id,
  });

  const saveMutation = useMutation({
    mutationFn: () => (saved ? unsaveAd(id as string) : saveAd(id as string)),
    onSuccess: () => setSaved((s) => !s),
  });

  // Phone is never in the ad payload above - it's only ever fetched here,
  // once a logged-in buyer clicks "show phone" (spec: masked by default,
  // registered users only, revealed on click, never exposed to anonymous
  // visitors even in the network tab).
  const phoneMutation = useMutation({ mutationFn: () => fetchAdPhone(id as string) });

  if (adQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>
      </div>
    );
  }
  if (adQuery.isError || !adQuery.data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-red-600">Ad not found.</p>
      </div>
    );
  }

  const ad = adQuery.data;
  const specs = ad.specs ?? {};
  const images = ad.images.length > 0 ? ad.images : null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-5xl px-6 py-10 sm:px-8">
        <Link
          to="/search"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--accent)]"
        >
          <span className="rotate-180"><Icon.Arrow /></span> Back to listings
        </Link>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
          {/* Gallery */}
          <div className="lg:col-span-3">
            <div className="ad-card overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)]">
              {images ? (
                <div className="relative aspect-[4/3] bg-[var(--muted)]">
                  <img src={images[activeImage].url} alt={ad.title} className="h-full w-full object-cover" />
                  <div className="price-badge absolute inset-x-0 bottom-0 px-4 py-3">
                    <span className="font-display text-2xl font-semibold text-white">${ad.price}</span>
                  </div>
                </div>
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-[var(--muted)] text-sm text-[var(--muted-foreground)]">
                  No photos
                </div>
              )}
            </div>
            {images && images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={`h-16 w-16 overflow-hidden rounded-[var(--radius-md)] border transition-colors ${
                      i === activeImage ? "border-[var(--primary)]" : "border-[var(--border)] opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info panel */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
              <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)]">
                {ad.category_paths.join(", ")}
              </p>
              <h1 className="font-display text-2xl font-semibold text-[var(--foreground)]">{ad.title}</h1>
              <p className="font-display mt-2 text-3xl font-semibold text-[var(--accent)]">${ad.price}</p>

              {token && (
                <button
                  type="button"
                  className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                >
                  <Icon.Star filled={saved} /> {saved ? "Saved" : "Save"}
                </button>
              )}

              {ad.location && <p className="mt-4 text-sm text-[var(--muted-foreground)]">📍 {ad.location}</p>}

              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-[var(--muted-foreground)]">Phone:</span>
                {!token ? (
                  <p className="text-sm text-[var(--muted-foreground)]">
                    <Link to="/login" className="font-medium text-[var(--accent)]">Log in</Link> to see the seller's number
                  </p>
                ) : phoneMutation.data ? (
                  <a href={`tel:${phoneMutation.data}`} className="text-sm font-medium text-[var(--accent)]">
                    {phoneMutation.data}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => phoneMutation.mutate()}
                    disabled={phoneMutation.isPending}
                    className="text-sm font-medium tracking-widest text-[var(--accent)] hover:underline disabled:opacity-50"
                  >
                    {phoneMutation.isPending ? "Loading…" : "*** (click to show)"}
                  </button>
                )}
                {phoneMutation.isError && <span className="text-xs text-red-600">No phone on file for this seller</span>}
              </div>

              {ad.description && (
                <div className="mt-5 border-t border-[var(--border)] pt-5">
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)]">
                    Description
                  </h3>
                  <p className="whitespace-pre-wrap text-sm text-[var(--foreground)]">{ad.description}</p>
                </div>
              )}

              {Object.keys(specs).length > 0 && (
                <div className="mt-5 border-t border-[var(--border)] pt-5">
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)]">
                    Details
                  </h3>
                  <div className="flex flex-col gap-2">
                    {Object.entries(specs).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-[var(--muted-foreground)]">{key}</span>
                        <span className="font-medium text-[var(--foreground)]">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
