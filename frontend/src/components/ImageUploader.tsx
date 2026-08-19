import { useState } from "react";
import { attachImage, deleteImage, getUploadSignature, uploadImageToCloudinary } from "@/lib/api";
import { Icon } from "./icons";

export interface UploadedImage {
  id: string;
  url: string;
  is_primary: boolean;
}

interface Props {
  adId: string;
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  max?: number;
}

/**
 * Uploads up to `max` (default 3) photos for an ad. Each file is sent
 * straight to Cloudinary from the browser (via a backend-issued signature),
 * then recorded against the ad - see getUploadSignature/uploadImageToCloudinary
 * /attachImage in lib/api.ts for why it's split this way.
 */
export default function ImageUploader({ adId, images, onChange, max = 3 }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = max - images.length;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length < files.length) {
      setError(`Only ${max} photos per ad - the rest were skipped.`);
    }

    setBusy(true);
    try {
      let current = images;
      for (const file of toUpload) {
        const sig = await getUploadSignature(adId);
        const url = await uploadImageToCloudinary(file, sig);
        const isPrimary = current.length === 0;
        const saved = await attachImage(adId, url, isPrimary);
        current = [...current, saved];
        onChange(current);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(imageId: string) {
    setError(null);
    try {
      await deleteImage(adId, imageId);
      onChange(images.filter((i) => i.id !== imageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove photo");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)]">
        Photos ({images.length}/{max})
      </p>
      <div className="flex flex-wrap gap-3">
        {images.map((img) => (
          <div key={img.id} className="relative h-24 w-24 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]">
            <img src={img.url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(img.id)}
              aria-label="Remove photo"
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <Icon.X />
            </button>
            {img.is_primary && (
              <span className="price-badge absolute bottom-0 left-0 w-full py-1 text-center text-[9px] font-medium uppercase tracking-wide text-white">
                Cover
              </span>
            )}
          </div>
        ))}
        {remaining > 0 && (
          <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]">
            {busy ? (
              <span className="text-xs">Uploading…</span>
            ) : (
              <>
                <Icon.Plus />
                <span className="text-xs">Add</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={busy}
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
