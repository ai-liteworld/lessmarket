import type { UseFormRegister } from "react-hook-form";
import type { SpecField } from "@/lib/api";

interface Props {
  field: SpecField;
  register: UseFormRegister<any>;
  required?: boolean;
}

export default function FormField({ field, register, required }: Props) {
  const common = { ...register(field.key, { required }) };

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{field.label}{required && " *"}</span>
      {field.type === "select" ? (
        <select className="rounded border p-2" {...common}>
          <option value="">Select…</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : field.type === "boolean" ? (
        <input type="checkbox" {...common} />
      ) : (
        <input
          type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
          className="rounded border p-2"
          {...common}
        />
      )}
    </label>
  );
}
