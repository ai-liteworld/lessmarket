import { useEffect, useState } from "react";
import { suggestCategories } from "@/lib/api";

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** Shown once, informational: the category the LLM originally suggested. */
  suggested?: string;
}

/**
 * Free-text category field with autocomplete suggestions pulled from
 * categories already used on real ads (see GET /api/ads/categories/suggest)
 * - this is how a seller's own custom category becomes a suggestion for the
 * next seller with a similar item, per the phase-2 spec, with no separate
 * "approve this category" moderation step.
 */
export default function CategoryAutocomplete({ value, onChange, suggested }: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      suggestCategories(value).then(setSuggestions).catch(() => setSuggestions([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [value]);

  return (
    <div className="relative flex flex-col gap-1 text-sm">
      <span className="font-medium">Category *</span>
      <input
        className="rounded border p-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="e.g. Vehicles > Bicycles > Mountain Bikes"
      />
      {suggested && suggested !== value && (
        <button
          type="button"
          className="w-fit text-left text-xs text-blue-600"
          onClick={() => onChange(suggested)}
        >
          Use suggested: {suggested}
        </button>
      )}
      {open && suggestions.length > 0 && (
        <ul className="absolute top-full z-10 mt-14 max-h-48 w-full overflow-auto rounded border bg-white shadow">
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                className="block w-full px-2 py-1 text-left text-sm hover:bg-neutral-100"
                onMouseDown={() => onChange(s)}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
