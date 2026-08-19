import axios from "axios";
import { useAppStore } from "@/store/useAppStore";

// In local dev without VITE_API_BASE_URL set, requests go to the relative
// "/api" path and Vite's dev server proxy (see vite.config.ts) forwards
// them to the backend. In production (e.g. GitHub Pages, which only serves
// static files and can't proxy anything), VITE_API_BASE_URL must be set at
// build time to the deployed backend's origin, e.g. https://lessmarket-backend.onrender.com
const baseURL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : "/api";

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = useAppStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// A 401 means the token is missing/expired/invalid - clear local auth state
// so the UI falls back to logged-out views instead of silently retrying
// with a dead token on every subsequent request.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      useAppStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// --- Spec-generated (LLM) types, mirrored from backend/app/schemas/llm.py ---

export type FieldType = "text" | "number" | "select" | "boolean" | "date";

export interface SpecField {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
}

export interface SchemaGenerationResult {
  category_path: string;
  required_specs: SpecField[];
  optional_specs: SpecField[];
  /** ADDENDUM: categories this item is commonly confused with; see docs/ADDENDUM_negative_categories.md */
  excluded_category_paths: string[];
}

export interface FilterGenerationResult {
  category_path: string;
  filters: Record<string, string | number | boolean>;
  refinement_options: SpecField[];
  /** ADDENDUM: categories to exclude from results even if they match lexically/semantically */
  excluded_categories: string[];
  /** ADDENDUM: key/value pairs results must NOT match */
  negative_filters: Record<string, string | number | boolean>;
}

export function fetchSellerSchema(description: string) {
  return api.post<SchemaGenerationResult>("/ads/schema", { description }).then((r) => r.data);
}

export function fetchSearchFilters(query: string) {
  return api.post<FilterGenerationResult>("/search/filters", { query }).then((r) => r.data);
}

export interface AdSummary {
  id: string;
  title: string;
  price: number;
  category_path: string;
  location?: string | null;
  image_url?: string | null;
  status?: string;
  created_at?: string | null;
}

export interface AdSearchResponse {
  results: AdSummary[];
  page: number;
  page_size: number;
}

export function searchAds(params: { q?: string; category_path?: string; page?: number }) {
  return api.get<AdSearchResponse>("/ads/search", { params }).then((r) => r.data);
}

// --- Auth (phase 2: phone signup + SMS OTP activation) ---

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export function signup(payload: {
  phone: string;
  password: string;
  full_name: string;
  email?: string;
  location?: string;
}) {
  return api.post<{ message: string; phone: string }>("/auth/signup", payload).then((r) => r.data);
}

export function verifyOtp(phone: string, code: string) {
  return api.post<TokenResponse>("/auth/verify-otp", { phone, code }).then((r) => r.data);
}

export function resendOtp(phone: string) {
  return api.post("/auth/resend-otp", { phone });
}

export function login(phone: string, password: string) {
  return api.post<TokenResponse>("/auth/login", { phone, password }).then((r) => r.data);
}

// --- Profile ---

export interface UserProfile {
  id: string;
  phone: string;
  phone_verified: boolean;
  email: string | null;
  full_name: string;
  location: string | null;
}

export function fetchMe() {
  return api.get<UserProfile>("/users/me").then((r) => r.data);
}

export function updateMe(payload: { full_name?: string; location?: string; email?: string }) {
  return api.put<UserProfile>("/users/me", payload).then((r) => r.data);
}

export function fetchMyAds(statusFilter?: string) {
  return api
    .get<{ ads: AdSummary[] }>("/users/me/ads", { params: statusFilter ? { status_filter: statusFilter } : {} })
    .then((r) => r.data.ads);
}

export function fetchSavedAds() {
  return api.get<{ ads: AdSummary[] }>("/users/me/saved").then((r) => r.data.ads);
}

// --- Ads: create / update / images / save / category suggestions ---

export interface AdDetail {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  status: string;
  category_path: string;
  specs: Record<string, unknown>;
  location: string | null;
  created_at: string | null;
  images: { id: string; url: string; is_primary: boolean }[];
}

export function createAd(payload: {
  title: string;
  description: string;
  price: number;
  category_path: string;
  specs: Record<string, unknown>;
  excluded_category_paths?: string[];
  user_added_fields?: string[];
}) {
  return api.post<{ id: string }>("/ads", payload).then((r) => r.data);
}

export function updateAd(
  adId: string,
  payload: Partial<{
    title: string;
    description: string;
    price: number;
    status: "active" | "sold" | "expired" | "deleted";
    category_path: string;
    specs: Record<string, unknown>;
  }>
) {
  return api.put<AdDetail>(`/ads/${adId}`, payload).then((r) => r.data);
}

export function deleteAd(adId: string) {
  return api.delete(`/ads/${adId}`);
}

export function fetchAd(adId: string) {
  return api.get<AdDetail>(`/ads/${adId}`).then((r) => r.data);
}

export function saveAd(adId: string) {
  return api.post(`/ads/${adId}/save`);
}

export function unsaveAd(adId: string) {
  return api.delete(`/ads/${adId}/save`);
}

export function suggestCategories(q: string) {
  return api.get<{ categories: string[] }>("/ads/categories/suggest", { params: { q } }).then((r) => r.data.categories);
}

interface CloudinarySignature {
  cloud_name: string;
  api_key: string;
  timestamp: number;
  folder: string;
  signature: string;
  upload_url: string;
}

export function getUploadSignature(adId: string) {
  return api.post<CloudinarySignature>(`/ads/${adId}/upload-signature`).then((r) => r.data);
}

export function attachImage(adId: string, url: string, isPrimary: boolean) {
  return api
    .post<{ id: string; url: string; is_primary: boolean }>(`/ads/${adId}/images`, { url, is_primary: isPrimary })
    .then((r) => r.data);
}

export function deleteImage(adId: string, imageId: string) {
  return api.delete(`/ads/${adId}/images/${imageId}`);
}

/**
 * Upload a single image file directly to Cloudinary using a signature from
 * the backend (see getUploadSignature). The file never passes through our
 * backend, which matters on Render's free tier (limited request size/time).
 */
export async function uploadImageToCloudinary(file: File, sig: CloudinarySignature): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.api_key);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);

  const res = await fetch(sig.upload_url, { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Cloudinary upload failed (${res.status}): ${body}`);
  }
  const data = await res.json();
  return data.secure_url as string;
}
