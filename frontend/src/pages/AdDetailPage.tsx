import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { fetchAd, saveAd, unsaveAd } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";

export default function AdDetailPage() {
  const { id } = useParams<{ id: string }>();
  const token = useAppStore((s) => s.token);
  const [saved, setSaved] = useState(false);

  const adQuery = useQuery({
    queryKey: ["ad", id],
    queryFn: () => fetchAd(id as string),
    enabled: !!id,
  });

  const saveMutation = useMutation({
    mutationFn: () => (saved ? unsaveAd(id as string) : saveAd(id as string)),
    onSuccess: () => setSaved((s) => !s),
  });

  if (adQuery.isLoading) return <p className="text-sm text-neutral-500">Loading…</p>;
  if (adQuery.isError || !adQuery.data) return <p className="text-sm text-red-600">Ad not found.</p>;

  const ad = adQuery.data;
  const specs = ad.specs ?? {};

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        {ad.images.length > 0 ? (
          ad.images.map((img) => (
            <img key={img.id} src={img.url} alt={ad.title} className="aspect-square w-full rounded object-cover" />
          ))
        ) : (
          <div className="col-span-3 flex aspect-video items-center justify-center rounded bg-neutral-100 text-sm text-neutral-400">
            No photos
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{ad.title}</h1>
          <p className="text-sm text-neutral-500">{ad.category_path}</p>
        </div>
        <p className="text-xl font-semibold">${ad.price}</p>
      </div>

      {token && (
        <button
          className="w-fit rounded border px-4 py-2 text-sm disabled:opacity-50"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          {saved ? "★ Saved" : "☆ Save"}
        </button>
      )}

      <p className="whitespace-pre-wrap text-sm text-neutral-700">{ad.description}</p>

      {Object.keys(specs).length > 0 && (
        <div className="rounded border">
          {Object.entries(specs).map(([key, value]) => (
            <div key={key} className="flex justify-between border-b p-2 text-sm last:border-b-0">
              <span className="text-neutral-500">{key}</span>
              <span>{String(value)}</span>
            </div>
          ))}
        </div>
      )}

      {ad.location && <p className="text-sm text-neutral-500">📍 {ad.location}</p>}
    </div>
  );
}
