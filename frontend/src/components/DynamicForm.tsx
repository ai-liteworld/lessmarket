import { useForm } from "react-hook-form";
import { useState } from "react";
import type { SchemaGenerationResult, SpecField } from "@/lib/api";
import FormField from "./FormField";

interface Props {
  schema: SchemaGenerationResult;
  onSubmit: (values: Record<string, unknown>) => void;
}

/**
 * Renders the required_specs / optional_specs returned by POST /api/ads/schema
 * (spec section 8.1). `excluded_category_paths` (ADDENDUM) isn't rendered as
 * a field — it's shown as an informational note so the seller can confirm
 * the LLM didn't miscategorize the item.
 */
export default function DynamicForm({ schema, onSubmit }: Props) {
  const { register, handleSubmit } = useForm();
  const [customFields, setCustomFields] = useState<SpecField[]>([]);

  const addCustomField = () => {
    const key = window.prompt("Custom field name?");
    if (!key) return;
    setCustomFields((prev) => [...prev, { key, label: key, type: "text" }]);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-md flex-col gap-3">
      <p className="text-sm text-neutral-500">Category: {schema.category_path}</p>

      {schema.required_specs.map((field) => (
        <FormField key={field.key} field={field} register={register} required />
      ))}
      {schema.optional_specs.map((field) => (
        <FormField key={field.key} field={field} register={register} />
      ))}
      {customFields.map((field) => (
        <FormField key={field.key} field={field} register={register} />
      ))}

      {schema.excluded_category_paths.length > 0 && (
        <p className="text-xs text-neutral-400">
          Not listed under: {schema.excluded_category_paths.join(", ")}
        </p>
      )}

      <button type="button" onClick={addCustomField} className="text-left text-sm text-blue-600">
        + Add Custom Field
      </button>
      <button type="submit" className="rounded bg-neutral-900 p-2 text-white">
        Continue
      </button>
    </form>
  );
}
