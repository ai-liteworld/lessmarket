import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { AdSummary } from "@/lib/api";

interface Props {
  ad: AdSummary;
  /** Optional trailing action slot (save/unsave button, manage actions, ...) */
  action?: ReactNode;
}

export default function AdCard({ ad, action }: Props) {
  return (
    <div className="ad-card overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-sm">
      <Link to={`/ad/${ad.id}`} className="block">
        <div className="relative aspect-[4/3] bg-[var(--muted)]">
          {ad.image_url ? (
            <img src={ad.image_url} alt={ad.title} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-[var(--muted-foreground)]">
              No photo
            </div>
          )}
          <div className="price-badge absolute inset-x-0 bottom-0 flex items-end justify-between px-3 py-2">
            <span className="font-display text-lg font-semibold leading-none text-white">${ad.price}</span>
            {ad.status && ad.status !== "active" && (
              <span className="text-xs font-medium uppercase tracking-wide text-red-300">{ad.status}</span>
            )}
          </div>
        </div>
      </Link>
      <div className="px-3 py-2.5">
        <Link to={`/ad/${ad.id}`} className="block truncate text-sm font-medium text-[var(--foreground)] hover:underline">
          {ad.title}
        </Link>
        <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">
          {ad.location ? `${ad.location} · ` : ""}
          {ad.category_path}
        </p>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}
