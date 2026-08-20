import { useEffect, useState } from "react";
import { suggestCategories } from "@/lib/api";
import { Icon } from "./icons";

interface Props {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  /** "primary" (dark, default) for a "relevant/include" group, "danger" (red-tinted) for an "exclude" group. */
  tone?: "primary" | "danger";
  placeholder?: string;
  addLabel?: string;
}

/**
 * Multi-select category chip group: each selected category renders as a
 * solid chip with an "x" to remove it; a dashed "+" chip opens an inline
 * picker (free-text input + autocomplete suggestions from
 * GET /api/ads/categories/suggest, same as CategoryAutocomplete) to add
 * another. Used for:
 *  - Post Ad: two groups, "Categories" (tone="primary") and "Exclude"
 *    (tone="danger") - a listing can now carry several categories.
 *  - Search: two AI-seeded groups, "Relevant" and "Exclude", generated from
 *    the search query (POST /api/search/filters) and freely editable.
 */
export default function CategoryGroupPicker({
  label,
  values,
  onChange,
  tone = "primary",
  placeholder = "e.g. Vehicles > Bicycles > Mountain Bikes",
  addLabel = "Add",
}: Props) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!adding) return;
    const handle = setTimeout(() => {
      suggestCategories(draft).then(setSuggestions).catch(() => setSuggestions([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [draft, adding]);

  const selectedChipClass =
    tone === "danger"
      ? "border-red-300 bg-red-50 text-red-700"
      : "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]";

  const add = (raw: string) => {
    const next = raw.trim();
    if (!next || values.includes(next)) {
      setDraft("");
      setAdding(false);
      return;
    }
    onChange([...values, next]);
    setDraft("");
    setAdding(false);
  };

  const remove = (value: string) => onChange(values.filter((v) => v !== value));

  return (
    <div className="flex flex-col gap-2 text-sm">
      <span className="font-medium text-[var(--foreground)]">{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        {values.map((v) => (
          <span
            key={v}
            className={`tag-chip inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${selectedChipClass}`}
          >
            {v}
            <button type="button" aria-label={`Remove ${v}`} className="opacity-70 hover:opacity-100" onClick={() => remove(v)}>
              <Icon.X />
            </button>
          </span>
        ))}
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="tag-chip inline-flex items-center gap-1.5 rounded-full border border-dashed border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            <Icon.Plus /> {addLabel}
          </button>
        )}
      </div>

      {adding && (
        <div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] p-3">
          <div className="flex gap-2">
            <input
              autoFocus
              className="flex-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add(draft);
                } else if (e.key === "Escape") {
                  setAdding(false);
                  setDraft("");
                }
              }}
              placeholder={placeholder}
            />
            <button
              type="button"
              className="rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              onClick={() => {
                setAdding(false);
                setDraft("");
              }}
            >
              Cancel
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions
              .filter((s) => !values.includes(s))
              .slice(0, 6)
              .map((s) => (
                <button
                  key={s}
                  type="button"
                  className="tag-chip rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  onClick={() => add(s)}
                >
                  {s}
                </button>
              ))}
            {draft.trim() && !values.includes(draft.trim()) && (
              <button
                type="button"
                className="rounded-full border border-[var(--accent)] px-3 py-1 text-xs font-medium text-[var(--accent)]"
                onClick={() => add(draft)}
              >
                Use "{draft.trim()}"
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
