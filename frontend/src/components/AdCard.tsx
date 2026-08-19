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
    <div className="flex flex-col overflow-hidden rounded-lg border">
      <Link to={`/ad/${ad.id}`} className="block">
        <div className="aspect-square w-full bg-neutral-100">
          {ad.image_url ? (
            <img src={ad.image_url} alt={ad.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
              No photo
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link to={`/ad/${ad.id}`} className="line-clamp-2 text-sm font-medium hover:underline">
          {ad.title}
        </Link>
        <p className="text-sm font-semibold text-neutral-900">${ad.price}</p>
        <p className="truncate text-xs text-neutral-500">{ad.category_path}</p>
        {ad.location && <p className="truncate text-xs text-neutral-400">{ad.location}</p>}
        {ad.status && ad.status !== "active" && (
          <span className="w-fit rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] uppercase text-neutral-500">
            {ad.status}
          </span>
        )}
        {action && <div className="mt-1">{action}</div>}
      </div>
    </div>
  );
}
