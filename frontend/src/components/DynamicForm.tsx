import { useForm } from "react-hook-form";
import { useState } from "react";
import type { SchemaGenerationResult, SpecField } from "@/lib/api";
import FormField from "./FormField";
import { Icon } from "./icons";

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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {(schema.required_specs.length > 0 || schema.optional_specs.length > 0 || customFields.length > 0) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {schema.required_specs.map((field) => (
            <FormField key={field.key} field={field} register={register} required />
          ))}
          {schema.optional_specs.map((field) => (
            <FormField key={field.key} field={field} register={register} />
          ))}
          {customFields.map((field) => (
            <FormField key={field.key} field={field} register={register} />
          ))}
        </div>
      )}

      {schema.excluded_category_paths.length > 0 && (
        <p className="text-xs text-[var(--muted-foreground)]">Not listed under: {schema.excluded_category_paths.join(", ")}</p>
      )}

      <button
        type="button"
        onClick={addCustomField}
        className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:underline"
      >
        <Icon.Plus /> Add custom field
      </button>

      <button
        type="submit"
        className="w-full rounded-[var(--radius-md)] bg-[var(--primary)] py-3 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
      >
        Post Ad
      </button>
    </form>
  );
}
