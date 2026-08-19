import { useEffect, useState } from "react";
import { suggestCategories } from "@/lib/api";
import { Icon } from "./icons";

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** Shown once, informational: the category the LLM originally suggested. */
  suggested?: string;
}

/**
 * Category picker styled as a removable chip + "+" add button (matches the
 * site's category-chip visual language elsewhere). The underlying data model
 * is still a single free-text `category_path` string - this is a UI layer
 * only, not a multi-category feature - but it now *looks and behaves* like
 * "add a category, remove it with x" rather than a bare text field:
 *
 *  - No category yet: a dashed "+ Add category" chip opens the picker.
 *  - Category set: shown as a solid chip with an x to clear it (which
 *    re-opens the picker so the user can pick/type a different one).
 *
 * Suggestions are pulled from categories already used on real ads (see
 * GET /api/ads/categories/suggest) - this is how a seller's own custom
 * category becomes a suggestion for the next seller with a similar item,
 * per the phase-2 spec, with no separate "approve this category" step.
 */
export default function CategoryAutocomplete({ value, onChange, suggested }: Props) {
  const [draft, setDraft] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [picking, setPicking] = useState(!value);

  useEffect(() => {
    const handle = setTimeout(() => {
      suggestCategories(draft).then(setSuggestions).catch(() => setSuggestions([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [draft]);

  const commit = (next: string) => {
    onChange(next);
    setDraft(next);
    setPicking(false);
  };

  if (!picking && value) {
    return (
      <div className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--foreground)]">Category *</span>
        <div>
          <span className="tag-chip selected inline-flex items-center gap-1.5 rounded-full border border-[var(--primary)] bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)]">
            {value}
            <button
              type="button"
              aria-label="Remove category"
              className="opacity-70 hover:opacity-100"
              onClick={() => {
                setDraft("");
                onChange("");
                setPicking(true);
              }}
            >
              <Icon.X />
            </button>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-[var(--foreground)]">Category *</span>
      {!picking ? (
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="tag-chip inline-flex w-fit items-center gap-1.5 rounded-full border border-dashed border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          <Icon.Plus /> Add category
        </button>
      ) : (
        <>
          <input
            autoFocus
            className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (draft.trim()) commit(draft.trim());
              }
            }}
            placeholder="e.g. Vehicles > Bicycles > Mountain Bikes"
          />
          <div className="flex flex-wrap gap-2">
            {suggested && (
              <button type="button" className="tag-chip rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted-foreground)]" onClick={() => commit(suggested)}>
                Suggested: {suggested}
              </button>
            )}
            {suggestions
              .filter((s) => s !== suggested)
              .slice(0, 6)
              .map((s) => (
                <button
                  key={s}
                  type="button"
                  className="tag-chip rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted-foreground)]"
                  onClick={() => commit(s)}
                >
                  {s}
                </button>
              ))}
            {draft.trim() && (
              <button
                type="button"
                className="rounded-full border border-[var(--accent)] px-3 py-1 text-xs font-medium text-[var(--accent)]"
                onClick={() => commit(draft.trim())}
              >
                Use "{draft.trim()}"
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
