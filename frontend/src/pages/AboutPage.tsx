import PageShell from "@/components/PageShell";

/**
 * Placeholder "About us" content, linked from the guest header. Swap the
 * copy below for the real story whenever it's ready - this just gives the
 * header link somewhere real to go instead of a dead link.
 */
export default function AboutPage() {
  return (
    <PageShell title="About Less.Market" subtitle="A simpler way to buy and sell locally.">
      <div className="max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm leading-relaxed text-[var(--foreground)]">
        <p>
          Less.Market is a local marketplace built around one idea: describe what you want, or what you're selling,
          in your own words - the site figures out the categories, fields, and filters instead of making you fill
          out a form.
        </p>
        <p className="mt-4">
          Post an ad in a few sentences, add some photos, and it's live. Search the same way - type what you're
          looking for and the relevant categories are suggested automatically, ready for you to fine-tune.
        </p>
        <p className="mt-4 text-[var(--muted-foreground)]">
          This page is a placeholder - replace it with your real story whenever you're ready.
        </p>
      </div>
    </PageShell>
  );
}
