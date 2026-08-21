import { useState } from "react";
import CategoryChip from "./CategoryChip";
import { Icon } from "./icons";

export interface CategoryEntry {
  label: string;
  /** false = suggested-but-removed; stays visible so the user can re-select it without another AI round-trip. */
  active: boolean;
  /** "ai" (system-suggested) sorts above "custom" (user-typed) - see sortCategoryEntries. Defaults to "ai" when absent. */
  source?: "ai" | "custom";
}

/** Merge freshly AI-suggested labels into an existing entry list: new labels
 * are added as active, labels already present keep whatever active state
 * (and source) the user last set (so re-suggesting something they removed
 * doesn't silently bring it back, and a custom label the user already typed
 * doesn't get reclassified as AI-suggested just because the model later
 * echoes the same word back). */
export function mergeCategoryEntries(existing: CategoryEntry[], suggested: string[]): CategoryEntry[] {
  const byLabel = new Map(existing.map((e) => [e.label, e]));
  for (const label of suggested) {
    if (!byLabel.has(label)) byLabel.set(label, { label, active: true, source: "ai" });
  }
  return Array.from(byLabel.values());
}

/** AI-suggested chips always render before user-added ones, regardless of
 * when each was introduced across successive suggestion rounds. Stable sort
 * keeps relative order within each group unchanged. */
function sortCategoryEntries(entries: CategoryEntry[]): CategoryEntry[] {
  const rank = (e: CategoryEntry) => (e.source === "custom" ? 1 : 0);
  return [...entries].sort((a, b) => rank(a) - rank(b));
}

interface Props {
  label: string;
  entries: CategoryEntry[];
  onChange: (entries: CategoryEntry[]) => void;
  tone?: "primary" | "danger";
  addLabel?: string;
}

/**
 * Category chip group where every AI-suggested (or manually added) category
 * stays visible as a toggle chip: click a selected one to remove it from
 * the active filter, click it again (or an unselected one) to re-select it.
 * A dashed "+" chip adds a new custom category, active by default.
 */
export default function CategoryToggleGroup({ label, entries, onChange, tone = "primary", addLabel = "Add" }: Props) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const toggle = (target: string) =>
    onChange(entries.map((e) => (e.label === target ? { ...e, active: !e.active } : e)));

  const addCustom = (raw: string) => {
    const text = raw.trim();
    if (!text) {
      setAdding(false);
      return;
    }
    if (entries.some((e) => e.label === text)) {
      onChange(entries.map((e) => (e.label === text ? { ...e, active: true } : e)));
    } else {
      onChange([...entries, { label: text, active: true, source: "custom" }]);
    }
    setDraft("");
    setAdding(false);
  };

  if (entries.length === 0 && !adding) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-[var(--foreground)]">{label}</span>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="tag-chip inline-flex items-center gap-1.5 rounded-full border border-dashed border-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          <Icon.Plus /> {addLabel}
        </button>
      </div>
    );
  }

  const sortedEntries = sortCategoryEntries(entries);

  return (
    <div className="flex flex-col gap-2 text-sm">
      <span className="font-medium text-[var(--foreground)]">{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        {sortedEntries.map((e) => (
          <CategoryChip key={e.label} label={e.label} selected={e.active} onToggle={() => toggle(e.label)} tone={tone} />
        ))}
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="tag-chip inline-flex items-center gap-1.5 rounded-full border border-dashed border-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            <Icon.Plus /> {addLabel}
          </button>
        )}
      </div>
      {adding && (
        <div className="flex gap-2">
          <input
            autoFocus
            className="flex-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            value={draft}
            onChange={(ev) => setDraft(ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === "Enter") {
                ev.preventDefault();
                addCustom(draft);
              } else if (ev.key === "Escape") {
                setAdding(false);
                setDraft("");
              }
            }}
            placeholder="Type a category and press Enter"
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
      )}
    </div>
  );
}
