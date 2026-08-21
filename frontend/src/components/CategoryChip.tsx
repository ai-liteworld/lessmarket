import { Icon } from "./icons";

/**
 * Pill-shaped toggle chip used for category filtering (landing/search) and
 * for the selected-category display in the sell flow's CategoryPicker.
 * Shows an "x" when selected so the user can remove it with one click;
 * clicking an unselected chip re-selects it.
 */
export default function CategoryChip({
  label,
  selected,
  onToggle,
  tone = "primary",
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
  /** "primary" (dark, default) or "danger" (red-tinted, for exclude groups) when selected. */
  tone?: "primary" | "danger";
}) {
  const selectedClass =
    tone === "danger" ? "border-red-300 bg-red-50 text-red-700" : "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]";
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`tag-chip inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
        selected ? selectedClass : "border-[var(--border)] bg-white text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
      }`}
    >
      {label}
      {selected && (
        <span className="opacity-70">
          <Icon.X />
        </span>
      )}
    </button>
  );
}
