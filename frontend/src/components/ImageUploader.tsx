import { useState } from "react";
import { attachImage, deleteImage, getUploadSignature, uploadImageToCloudinary } from "@/lib/api";

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
      <p className="text-sm font-medium">Photos ({images.length}/{max})</p>
      <div className="flex flex-wrap gap-2">
        {images.map((img) => (
          <div key={img.id} className="relative h-20 w-20 overflow-hidden rounded border">
            <img src={img.url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(img.id)}
              className="absolute right-0 top-0 rounded-bl bg-black/60 px-1 text-xs text-white"
            >
              ✕
            </button>
            {img.is_primary && (
              <span className="absolute bottom-0 left-0 w-full bg-black/60 text-center text-[9px] text-white">
                cover
              </span>
            )}
          </div>
        ))}
        {remaining > 0 && (
          <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded border border-dashed text-xs text-neutral-500 hover:bg-neutral-50">
            {busy ? "Uploading…" : "+ Add"}
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
