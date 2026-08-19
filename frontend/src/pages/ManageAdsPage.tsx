import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { deleteAd, fetchMyAds, updateAd, type AdSummary } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import PageShell from "@/components/PageShell";
import { Icon } from "@/components/icons";

type Filter = "all" | "active" | "sold";

export default function ManageAdsPage() {
  const token = useAppStore((s) => s.token);
  const queryClient = useQueryClient();
  const myAdsQuery = useQuery({ queryKey: ["my-ads"], queryFn: () => fetchMyAds() });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["my-ads"] });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "sold" }) => updateAd(id, { status }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAd(id),
    onSuccess: invalidate,
  });

  if (!token) {
    return (
      <p className="p-8 text-sm text-[var(--muted-foreground)]">
        <Link to="/login" className="text-[var(--accent)]">Log in</Link> to manage your ads.
      </p>
    );
  }

  const ads = myAdsQuery.data ?? [];
  const activeCount = ads.filter((a) => (a.status ?? "active") === "active").length;
  const soldCount = ads.filter((a) => a.status === "sold").length;
  const filtered = ads.filter((a) => filter === "all" || (a.status ?? "active") === filter);

  return (
    <PageShell title="Manage Ads" subtitle={`You have ${ads.length} listing${ads.length !== 1 ? "s" : ""}.`}>
      <div className="mb-6 flex gap-2">
        {([
          { key: "all" as Filter, label: `All (${ads.length})` },
          { key: "active" as Filter, label: `Active (${activeCount})` },
          { key: "sold" as Filter, label: `Sold (${soldCount})` },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full border px-4 py-2 text-xs font-medium capitalize transition-all ${
              filter === key
                ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--accent)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {myAdsQuery.isLoading && <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>}
      {!myAdsQuery.isLoading && ads.length === 0 && (
        <p className="text-sm text-[var(--muted-foreground)]">
          You haven't posted anything yet. <Link to="/sell" className="text-[var(--accent)]">Sell something</Link>
        </p>
      )}
      {!myAdsQuery.isLoading && ads.length > 0 && filtered.length === 0 && (
        <p className="py-20 text-center text-sm text-[var(--muted-foreground)]">No listings here yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((ad) => (
          <AdRow
            key={ad.id}
            ad={ad}
            editing={editingId === ad.id}
            onEdit={() => setEditingId(ad.id)}
            onCancelEdit={() => setEditingId(null)}
            onSaved={() => {
              setEditingId(null);
              invalidate();
            }}
            onToggleStatus={() =>
              statusMutation.mutate({ id: ad.id, status: ad.status === "sold" ? "active" : "sold" })
            }
            onDelete={() => {
              if (confirm(`Delete "${ad.title}"? This can't be undone.`)) deleteMutation.mutate(ad.id);
            }}
          />
        ))}
      </div>
    </PageShell>
  );
}

const inputClass =
  "rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]";

function AdRow({
  ad,
  editing,
  onEdit,
  onCancelEdit,
  onSaved,
  onToggleStatus,
  onDelete,
}: {
  ad: AdSummary;
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaved: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(ad.title);
  const [price, setPrice] = useState(String(ad.price));

  const saveMutation = useMutation({
    mutationFn: () => updateAd(ad.id, { title, price: Number(price) }),
    onSuccess: onSaved,
  });

  const isSold = ad.status === "sold";

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <input className={`min-w-0 flex-1 ${inputClass}`} value={title} onChange={(e) => setTitle(e.target.value)} />
        <input type="number" className={`w-28 ${inputClass}`} value={price} onChange={(e) => setPrice(e.target.value)} />
        <button
          className="rounded-[var(--radius-md)] bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          Save
        </button>
        <button className="rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--secondary)]" onClick={onCancelEdit}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--muted)]">
        {ad.image_url ? (
          <img src={ad.image_url} alt={ad.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-[var(--muted-foreground)]">No photo</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link to={`/ad/${ad.id}`} className="truncate text-sm font-medium text-[var(--foreground)] hover:underline">
            {ad.title}
          </Link>
          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${isSold ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600"}`}>
            {isSold ? "Sold" : "Active"}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">
          {ad.category_path}
          {ad.location ? ` · ${ad.location}` : ""}
          {ad.created_at ? ` · ${new Date(ad.created_at).toLocaleDateString()}` : ""}
        </p>
        <p className="font-display mt-1 text-base font-semibold text-[var(--accent)]">${ad.price}</p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1">
        <button
          onClick={onToggleStatus}
          title={isSold ? "Mark as Active" : "Mark as Sold"}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
            isSold
              ? "border-green-200 text-green-600 hover:bg-green-50"
              : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-red-200 hover:text-red-400"
          }`}
        >
          <Icon.Tag />
          {isSold ? "Re-list" : "Mark Sold"}
        </button>
        <button
          onClick={onEdit}
          title="Edit"
          className="rounded-lg border border-[var(--border)] p-2 text-[var(--muted-foreground)] transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          <Icon.Edit />
        </button>
        <button
          onClick={onDelete}
          title="Delete"
          className="rounded-lg border border-[var(--border)] p-2 text-[var(--muted-foreground)] transition-all hover:border-red-300 hover:text-red-400"
        >
          <Icon.Trash />
        </button>
      </div>
    </div>
  );
}
