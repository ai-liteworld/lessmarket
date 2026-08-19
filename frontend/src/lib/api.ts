import axios from "axios";
import { useAppStore } from "@/store/useAppStore";

export const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = useAppStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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

export function searchAds(params: { q?: string; category_path?: string; page?: number }) {
  return api.get("/ads/search", { params }).then((r) => r.data);
}
