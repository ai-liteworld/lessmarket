import type { ReactNode } from "react";

/** Shared header + container for authenticated inner pages (profile, sell, manage ads, ad detail). */
export default function PageShell({
  title,
  subtitle,
  children,
  maxWidth = "max-w-4xl",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className={`mx-auto ${maxWidth} px-6 py-12 sm:px-8`}>
        <div className="mb-10">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-[var(--muted-foreground)]">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
