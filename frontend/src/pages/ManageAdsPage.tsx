import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { deleteAd, fetchMyAds, updateAd, type AdSummary } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";

export default function ManageAdsPage() {
  const token = useAppStore((s) => s.token);
  const queryClient = useQueryClient();
  const myAdsQuery = useQuery({ queryKey: ["my-ads"], queryFn: () => fetchMyAds() });
  const [editingId, setEditingId] = useState<string | null>(null);

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
      <p className="text-sm text-neutral-500">
        <Link to="/login" className="text-blue-600">Log in</Link> to manage your ads.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Manage ads</h1>
      {myAdsQuery.isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
      {myAdsQuery.data?.length === 0 && (
        <p className="text-sm text-neutral-500">
          You haven't posted anything yet. <Link to="/sell" className="text-blue-600">Sell something</Link>
        </p>
      )}
      <div className="flex flex-col divide-y rounded border">
        {myAdsQuery.data?.map((ad) => (
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
    </div>
  );
}

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

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2 p-3">
        <input className="min-w-0 flex-1 rounded border p-1 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input
          type="number"
          className="w-24 rounded border p-1 text-sm"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <button
          className="rounded bg-neutral-900 px-3 py-1 text-xs text-white disabled:opacity-50"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          Save
        </button>
        <button className="rounded border px-3 py-1 text-xs" onClick={onCancelEdit}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 p-3">
      <Link to={`/ad/${ad.id}`} className="min-w-0 flex-1 truncate text-sm font-medium hover:underline">
        {ad.title}
      </Link>
      <span className="text-sm text-neutral-500">${ad.price}</span>
      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] uppercase text-neutral-500">
        {ad.status}
      </span>
      <div className="flex gap-2">
        <button className="text-xs text-blue-600" onClick={onEdit}>Edit</button>
        <button className="text-xs text-blue-600" onClick={onToggleStatus}>
          {ad.status === "sold" ? "Mark active" : "Mark sold"}
        </button>
        <button className="text-xs text-red-600" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}
