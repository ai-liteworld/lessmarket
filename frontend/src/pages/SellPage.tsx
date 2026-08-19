import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createAd, fetchSellerSchema, type SchemaGenerationResult } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import DynamicForm from "@/components/DynamicForm";
import CategoryAutocomplete from "@/components/CategoryAutocomplete";
import ImageUploader, { type UploadedImage } from "@/components/ImageUploader";

type Step = "describe" | "details" | "photos";

export default function SellPage() {
  const token = useAppStore((s) => s.token);
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("describe");
  const [description, setDescription] = useState("");
  const [schema, setSchema] = useState<SchemaGenerationResult | null>(null);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [adId, setAdId] = useState<string | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const schemaMutation = useMutation({
    mutationFn: fetchSellerSchema,
    onSuccess: (result) => {
      setSchema(result);
      setCategory(result.category_path);
      setStep("details");
    },
  });

  const createMutation = useMutation({
    mutationFn: (specs: Record<string, unknown>) =>
      createAd({
        title,
        description,
        price: Number(price),
        category_path: category,
        specs,
        excluded_category_paths: schema?.excluded_category_paths ?? [],
      }),
    onSuccess: (ad) => {
      setAdId(ad.id);
      setStep("photos");
    },
  });

  if (!token) {
    return (
      <p className="text-sm text-neutral-500">
        <Link to="/login" className="text-blue-600">Log in</Link> to sell an item.
      </p>
    );
  }

  if (step === "photos" && adId) {
    return (
      <div className="flex max-w-md flex-col gap-4">
        <h1 className="text-lg font-semibold">Add photos</h1>
        <p className="text-sm text-neutral-500">Your listing is up - add up to 3 photos (optional, but listings with photos get more views).</p>
        <ImageUploader adId={adId} images={images} onChange={setImages} />
        <button
          className="w-fit rounded bg-neutral-900 px-4 py-2 text-sm text-white"
          onClick={() => navigate(`/ad/${adId}`)}
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="flex max-w-md flex-col gap-3">
      <h1 className="text-lg font-semibold">Sell an item</h1>
      <textarea
        className="rounded border p-2"
        rows={3}
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
      {schemaMutation.isError && (
        <p className="text-sm text-red-600">Couldn't generate fields - try rewording your description.</p>
      )}

      {step === "details" && schema && (
        <div className="flex flex-col gap-3 border-t pt-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Title *</span>
            <input className="rounded border p-2" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Price (USD) *</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="rounded border p-2"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </label>
          <CategoryAutocomplete value={category} onChange={setCategory} suggested={schema.category_path} />

          <DynamicForm
            schema={schema}
            onSubmit={(specs) => {
              // title/price/category live outside DynamicForm's own <form>,
              // so its submit button doesn't natively validate them - check
              // here before hitting the API.
              if (!title.trim()) return setFormError("Title is required.");
              if (!price || Number(price) <= 0) return setFormError("Enter a valid price.");
              if (!category.trim()) return setFormError("Category is required.");
              setFormError(null);
              createMutation.mutate(specs);
            }}
          />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          {createMutation.isError && (
            <p className="text-sm text-red-600">Couldn't create the listing - please try again.</p>
          )}
        </div>
      )}
    </div>
  );
}
