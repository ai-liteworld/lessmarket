import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { AdSummary } from "@/lib/api";

interface Props {
  ad: AdSummary;
  /** Optional trailing action slot (save/unsave button, manage actions, ...) */
  action?: ReactNode;
  /**
   * Main search/browse grids show only the image + price, plus a short
   * AI-generated blurb line (falls back to the first category if the ad
   * predates the blurb field) - the title/location combo lives on the ad
   * detail page instead. Other contexts (profile's "my ads"/"saved" lists)
   * keep the fuller title/location line.
   */
  compact?: boolean;
}

function DefaultAdImage() {
  return (
    <div className="flex h-full w-full items-center justify-center text-[var(--muted-foreground)]">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    </div>
  );
}

export default function AdCard({ ad, action, compact = false }: Props) {
  return (
    <div className="ad-card overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-sm">
      <Link to={`/ad/${ad.id}`} className="block">
        <div className="relative aspect-[4/3] bg-[var(--muted)]">
          {ad.image_url ? (
            <img src={ad.image_url} alt={ad.title} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <DefaultAdImage />
          )}
          <div className="price-badge absolute inset-x-0 bottom-0 flex items-end justify-between px-3 py-2">
            <span className="font-display text-lg font-semibold leading-none text-white">${ad.price}</span>
            {ad.status && ad.status !== "active" && (
              <span className="text-xs font-medium uppercase tracking-wide text-red-300">{ad.status}</span>
            )}
          </div>
        </div>
      </Link>
      {!compact && (
        <div className="px-3 py-2.5">
          <Link to={`/ad/${ad.id}`} className="block truncate text-sm font-medium text-[var(--foreground)] hover:underline">
            {ad.title}
          </Link>
          <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">
            {ad.location ? `${ad.location} · ` : ""}
            {ad.category_paths?.[0]}
          </p>
          {action && <div className="mt-2">{action}</div>}
        </div>
      )}
      {compact && (
        <div className="px-3 py-2">
          {(ad.blurb || ad.category_paths?.[0]) && (
            <p className="truncate text-xs text-[var(--muted-foreground)]">{ad.blurb || ad.category_paths?.[0]}</p>
          )}
          {action && <div className="mt-2">{action}</div>}
        </div>
      )}
    </div>
  );
}
