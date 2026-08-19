import type { UseFormRegister } from "react-hook-form";
import type { SpecField } from "@/lib/api";

interface Props {
  field: SpecField;
  register: UseFormRegister<any>;
  required?: boolean;
}

const inputClass =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]";

export default function FormField({ field, register, required }: Props) {
  const common = { ...register(field.key, { required }) };

  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-xs font-medium text-[var(--muted-foreground)]">
        {field.label}
        {required && " *"}
      </span>
      {field.type === "select" ? (
        <select className={inputClass} {...common}>
          <option value="">Select…</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : field.type === "boolean" ? (
        <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" {...common} />
      ) : (
        <input
          type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
          className={inputClass}
          {...common}
        />
      )}
    </label>
  );
}
