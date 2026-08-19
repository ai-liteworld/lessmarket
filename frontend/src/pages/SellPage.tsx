import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { fetchSellerSchema, type SchemaGenerationResult } from "@/lib/api";
import DynamicForm from "@/components/DynamicForm";

export default function SellPage() {
  const [description, setDescription] = useState("");
  const [schema, setSchema] = useState<SchemaGenerationResult | null>(null);

  const schemaMutation = useMutation({
    mutationFn: fetchSellerSchema,
    onSuccess: setSchema,
  });

  return (
    <div className="flex max-w-md flex-col gap-3">
      <h1 className="text-lg font-semibold">Sell an item</h1>
      <textarea
        className="rounded border p-2"
        placeholder="Describe what you're selling…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button
        className="rounded bg-neutral-900 p-2 text-white disabled:opacity-50"
        disabled={!description || schemaMutation.isPending}
        onClick={() => schemaMutation.mutate(description)}
      >
        {schemaMutation.isPending ? "Generating…" : "Generate listing fields"}
      </button>

      {schema && <DynamicForm schema={schema} onSubmit={(values) => console.log("TODO: POST /api/ads", values)} />}
    </div>
  );
}
