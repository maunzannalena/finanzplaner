import { hasSupabaseConfig } from "@/lib/supabase";
import type { DataApi } from "./api";
import { mockApi } from "./mock";
import { supabaseApi } from "./supabase";

/**
 * The one data-access entry point for the app.
 * With NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY set, real
 * Supabase queries are used; otherwise the in-memory demo layer.
 */
export const api: DataApi = hasSupabaseConfig ? supabaseApi : mockApi;

export type { DataApi, TableApi } from "./api";
export * from "./types";
