import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchMe, fetchMyAds, fetchSavedAds, unsaveAd, updateMe, type AdSummary } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import AdCard from "@/components/AdCard";
import PageShell from "@/components/PageShell";
import { Icon } from "@/components/icons";

type Tab = "info" | "my-ads" | "saved";

const inputClass =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]";
const labelClass = "mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]";
const cardClass = "rounded-xl border border-[var(--border)] bg-[var(--card)] p-6";

export default function ProfilePage() {
  const [tab, setTab] = useState<Tab>("info");
  const token = useAppStore((s) => s.token);
  const meQuery = useQuery({ queryKey: ["me"], queryFn: fetchMe, enabled: !!token });
  const myAdsQuery = useQuery({ queryKey: ["my-ads"], queryFn: () => fetchMyAds(), enabled: !!token });

  if (!token) {
    return (
      <p className="p-8 text-sm text-[var(--muted-foreground)]">
        <Link to="/login" className="text-[var(--accent)]">Log in</Link> to view your profile.
      </p>
    );
  }

  const myAds = myAdsQuery.data ?? [];
  const activeCount = myAds.filter((a) => (a.status ?? "active") === "active").length;
  const soldCount = myAds.filter((a) => a.status === "sold").length;
  const initial = (meQuery.data?.full_name || "?").trim().charAt(0).toUpperCase();

  return (
    <PageShell title="Your Profile" subtitle="Manage your account details and listing activity.">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: account card + stats */}
        <div className="lg:col-span-1">
          <div className={cardClass}>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[var(--border)] bg-[var(--secondary)]">
                <span className="font-display text-2xl font-semibold text-[var(--foreground)]">{initial}</span>
              </div>
              <h2 className="font-display text-xl font-semibold text-[var(--foreground)]">{meQuery.data?.full_name}</h2>
              <p className="mt-1 flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
                {meQuery.data?.phone}
                {meQuery.data?.phone_verified && (
                  <span title="Verified" className="text-[var(--accent)]">
                    <Icon.Check />
                  </span>
                )}
              </p>
              {meQuery.data?.email && <p className="text-xs text-[var(--muted-foreground)]">{meQuery.data.email}</p>}
            </div>
            <hr className="my-5 border-[var(--border)]" />
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg bg-[var(--secondary)] p-3">
                <p className="font-display text-2xl font-semibold text-[var(--foreground)]">{activeCount}</p>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Active</p>
              </div>
              <div className="rounded-lg bg-[var(--secondary)] p-3">
                <p className="font-display text-2xl font-semibold text-[var(--foreground)]">{soldCount}</p>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Sold</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: tabs + content */}
        <div className="lg:col-span-2">
          <div className="mb-5 flex gap-2 text-sm">
            {(["info", "my-ads", "saved"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-full border px-4 py-2 text-xs font-medium transition-all ${
                  tab === t
                    ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--accent)]"
                }`}
              >
                {t === "info" ? "Basic info" : t === "my-ads" ? "My ads" : "Saved ads"}
              </button>
            ))}
          </div>

          {tab === "info" && <BasicInfoTab />}
          {tab === "my-ads" && <MyAdsTab ads={myAds} isLoading={myAdsQuery.isLoading} />}
          {tab === "saved" && <SavedAdsTab />}
        </div>
      </div>
    </PageShell>
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

  if (meQuery.isLoading) return <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>;

  return (
    <form
      className={cardClass}
      onSubmit={(e) => {
        e.preventDefault();
        saveMutation.mutate();
      }}
    >
      <h3 className="mb-5 text-sm font-medium text-[var(--foreground)]">Account Details</h3>
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Phone</label>
          <input className={`${inputClass} bg-[var(--secondary)] text-[var(--muted-foreground)]`} value={meQuery.data?.phone} disabled />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Full name</label>
            <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Location</label>
            <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
          </div>
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="pt-2">
          <button
            type="submit"
            className="rounded-[var(--radius-md)] bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? "Saving…" : "Save changes"}
          </button>
          {saveMutation.isSuccess && <span className="ml-3 text-sm text-[var(--accent)]">Saved.</span>}
        </div>
      </div>
    </form>
  );
}

function MyAdsTab({ ads, isLoading }: { ads: AdSummary[]; isLoading: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted-foreground)]">
          {ads.length} ad{ads.length === 1 ? "" : "s"}
        </p>
        <Link to="/manage-ads" className="text-sm text-[var(--accent)]">Manage ads →</Link>
      </div>
      {isLoading && <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>}
      {!isLoading && ads.length === 0 && (
        <p className="text-sm text-[var(--muted-foreground)]">
          You haven't posted anything yet. <Link to="/sell" className="text-[var(--accent)]">Sell something</Link>
        </p>
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {ads.map((ad) => <AdCard key={ad.id} ad={ad} />)}
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
      {savedQuery.isLoading && <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>}
      {savedQuery.data?.length === 0 && <p className="text-sm text-[var(--muted-foreground)]">Nothing saved yet.</p>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {savedQuery.data?.map((ad) => (
          <AdCard
            key={ad.id}
            ad={ad}
            action={
              <button
                className="text-xs text-red-500 hover:text-red-600"
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
