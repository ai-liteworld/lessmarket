import type { ReactNode } from "react";

/** Centered card wrapper for signup/login/verify screens, matching the site's login-modal styling. */
export default function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-[var(--background)] px-4 py-10">
      <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
        <h1 className="font-display mb-1 text-2xl font-semibold text-[var(--foreground)]">{title}</h1>
        {subtitle && <p className="mb-6 text-sm text-[var(--muted-foreground)]">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
