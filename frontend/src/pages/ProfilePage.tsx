import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchMe, fetchMyAds, fetchSavedAds, unsaveAd, updateMe } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import AdCard from "@/components/AdCard";

type Tab = "info" | "my-ads" | "saved";

export default function ProfilePage() {
  const [tab, setTab] = useState<Tab>("info");
  const token = useAppStore((s) => s.token);

  if (!token) {
    return (
      <p className="text-sm text-neutral-500">
        <Link to="/login" className="text-blue-600">Log in</Link> to view your profile.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">My account</h1>
      <div className="flex gap-4 border-b text-sm">
        {(["info", "my-ads", "saved"] as Tab[]).map((t) => (
          <button
            key={t}
            className={`border-b-2 px-1 pb-2 ${tab === t ? "border-neutral-900 font-medium" : "border-transparent text-neutral-500"}`}
            onClick={() => setTab(t)}
          >
            {t === "info" ? "Basic info" : t === "my-ads" ? "My ads" : "Saved ads"}
          </button>
        ))}
      </div>

      {tab === "info" && <BasicInfoTab />}
      {tab === "my-ads" && <MyAdsTab />}
      {tab === "saved" && <SavedAdsTab />}
    </div>
  );
}

function BasicInfoTab() {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: fetchMe });
  const setUser = useAppStore((s) => s.setUser);
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [loaded, setLoaded] = useState(false);

  if (meQuery.data && !loaded) {
    setFullName(meQuery.data.full_name);
    setLocation(meQuery.data.location ?? "");
    setEmail(meQuery.data.email ?? "");
    setLoaded(true);
  }

  const saveMutation = useMutation({
    mutationFn: () => updateMe({ full_name: fullName, location, email: email || undefined }),
    onSuccess: setUser,
  });

  if (meQuery.isLoading) return <p className="text-sm text-neutral-500">Loading…</p>;

  return (
    <form
      className="flex max-w-sm flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        saveMutation.mutate();
      }}
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Phone</span>
        <input className="rounded border bg-neutral-50 p-2 text-neutral-500" value={meQuery.data?.phone} disabled />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Full name</span>
        <input className="rounded border p-2" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Location</span>
        <input className="rounded border p-2" value={location} onChange={(e) => setLocation(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Email</span>
        <input type="email" className="rounded border p-2" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <button type="submit" className="w-fit rounded bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50" disabled={saveMutation.isPending}>
        {saveMutation.isPending ? "Saving…" : "Save changes"}
      </button>
      {saveMutation.isSuccess && <p className="text-sm text-green-600">Saved.</p>}
    </form>
  );
}

function MyAdsTab() {
  const myAdsQuery = useQuery({ queryKey: ["my-ads"], queryFn: () => fetchMyAds() });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          {myAdsQuery.data?.length ?? 0} ad{myAdsQuery.data?.length === 1 ? "" : "s"}
        </p>
        <Link to="/manage-ads" className="text-sm text-blue-600">Manage ads →</Link>
      </div>
      {myAdsQuery.isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
      {myAdsQuery.data?.length === 0 && (
        <p className="text-sm text-neutral-500">
          You haven't posted anything yet. <Link to="/sell" className="text-blue-600">Sell something</Link>
        </p>
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {myAdsQuery.data?.map((ad) => <AdCard key={ad.id} ad={ad} />)}
      </div>
    </div>
  );
}

function SavedAdsTab() {
  const queryClient = useQueryClient();
  const savedQuery = useQuery({ queryKey: ["saved-ads"], queryFn: fetchSavedAds });

  const unsaveMutation = useMutation({
    mutationFn: (adId: string) => unsaveAd(adId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-ads"] }),
  });

  return (
    <div className="flex flex-col gap-3">
      {savedQuery.isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
      {savedQuery.data?.length === 0 && <p className="text-sm text-neutral-500">Nothing saved yet.</p>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {savedQuery.data?.map((ad) => (
          <AdCard
            key={ad.id}
            ad={ad}
            action={
              <button
                className="text-xs text-red-600"
                onClick={() => unsaveMutation.mutate(ad.id)}
                disabled={unsaveMutation.isPending}
              >
                Remove
              </button>
            }
          />
        ))}
      </div>
    </div>
  );
}
