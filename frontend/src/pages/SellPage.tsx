import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createAd, fetchSellerSchema, type SchemaGenerationResult } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import DynamicForm from "@/components/DynamicForm";
import CategoryGroupPicker from "@/components/CategoryGroupPicker";
import ImageUploader, { type UploadedImage } from "@/components/ImageUploader";
import PageShell from "@/components/PageShell";
import { Icon } from "@/components/icons";

type Step = "describe" | "details" | "photos";

const inputClass =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]";
const labelClass = "mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]";
const cardClass = "rounded-xl border border-[var(--border)] bg-[var(--card)] p-6";

export default function SellPage() {
  const token = useAppStore((s) => s.token);
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("describe");
  const [description, setDescription] = useState("");
  const [schema, setSchema] = useState<SchemaGenerationResult | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [excludedCategories, setExcludedCategories] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [adId, setAdId] = useState<string | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const schemaMutation = useMutation({
    mutationFn: fetchSellerSchema,
    onSuccess: (result) => {
      setSchema(result);
      // The LLM's top suggestion seeds the "Categories" group; the seller
      // can add more (from prior ads' categories or a custom one) or remove
      // it entirely. Its "commonly confused with" list seeds the editable
      // "Exclude" group the same way.
      setCategories([result.category_path]);
      setExcludedCategories(result.excluded_category_paths);
      setStep("details");
    },
  });

  const createMutation = useMutation({
    mutationFn: (specs: Record<string, unknown>) =>
      createAd({
        title,
        description,
        price: Number(price),
        category_paths: categories,
        specs,
        excluded_category_paths: excludedCategories,
      }),
    onSuccess: (ad) => {
      setAdId(ad.id);
      setStep("photos");
    },
  });

  if (!token) {
    return (
      <p className="p-8 text-sm text-[var(--muted-foreground)]">
        <Link to="/login" className="text-[var(--accent)]">Log in</Link> to sell an item.
      </p>
    );
  }

  if (step === "photos" && adId) {
    return (
      <PageShell title="Add Photos" subtitle="Your listing is up - add up to 3 photos (optional, but listings with photos get more views).">
        <div className="max-w-md">
          <div className={cardClass}>
            <ImageUploader adId={adId} images={images} onChange={setImages} />
          </div>
          <button
            className="mt-5 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
            onClick={() => navigate(`/ad/${adId}`)}
          >
            Done <Icon.Arrow />
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Post an Ad" subtitle="Reach buyers in your area. Ads go live immediately.">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className={cardClass}>
            <h3 className="mb-4 text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)]">Describe your item</h3>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder="Describe what you're selling…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button
              className="mt-3 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
              disabled={!description || schemaMutation.isPending}
              onClick={() => schemaMutation.mutate(description)}
            >
              {schemaMutation.isPending ? "Generating…" : "Generate listing fields"} <Icon.Arrow />
            </button>
            {schemaMutation.isError && (
              <p className="mt-2 text-sm text-red-600">Couldn't generate fields - try rewording your description.</p>
            )}
          </div>

          {step === "details" && schema && (
            <div className="mt-5 flex flex-col gap-5">
              <div className={cardClass}>
                <h3 className="mb-4 text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)]">Listing Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Title *</label>
                    <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
                  </div>
                  <div>
                    <label className={labelClass}>Price (USD) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputClass}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className={`${cardClass} flex flex-col gap-5`}>
                <CategoryGroupPicker
                  label="Categories *"
                  values={categories}
                  onChange={setCategories}
                  tone="primary"
                  addLabel="Add category"
                />
                <CategoryGroupPicker
                  label="Exclude"
                  values={excludedCategories}
                  onChange={setExcludedCategories}
                  tone="danger"
                  addLabel="Add exclusion"
                  placeholder="A category this item is NOT (e.g. Sports & Fitness > Exercise Bikes)"
                />
              </div>

              <div className={cardClass}>
                <h3 className="mb-4 text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)]">Item Details</h3>
                <DynamicForm
                  schema={schema}
                  onSubmit={(specs) => {
                    // title/price/category live outside DynamicForm's own <form>,
                    // so its submit button doesn't natively validate them - check
                    // here before hitting the API.
                    if (!title.trim()) return setFormError("Title is required.");
                    if (!price || Number(price) <= 0) return setFormError("Enter a valid price.");
                    if (categories.length === 0) return setFormError("At least one category is required.");
                    setFormError(null);
                    createMutation.mutate(specs);
                  }}
                />
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              {createMutation.isError && (
                <p className="text-sm text-red-600">Couldn't create the listing - please try again.</p>
              )}
            </div>
          )}
        </div>

        {/* Live preview */}
        {step === "details" && (
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)]">Preview</p>
              <div className="ad-card overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-sm">
                <div className="relative flex aspect-[4/3] items-center justify-center bg-[var(--muted)]">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-[var(--muted-foreground)]">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                  </svg>
                  <div className="price-badge absolute inset-x-0 bottom-0 px-3 py-2">
                    <span className="font-display text-lg font-semibold text-white">{price ? `$${price}` : "$—"}</span>
                  </div>
                </div>
                <div className="px-3 py-2.5">
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">{title || "Your listing title"}</p>
                  <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">{categories.join(", ") || "Category"}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
