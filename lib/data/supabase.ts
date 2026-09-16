import { getSupabase } from "@/lib/supabase";
import type { DataApi, TableApi } from "./api";
import type { AppData, Id, NewRow, RowPatch, Settings } from "./types";

/**
 * Supabase data layer (Phase 2). Table and column names match the TypeScript
 * field names 1:1, so every table goes through the same generic helper.
 */

const NUMERIC_FIELDS = new Set(["amount", "savings_value", "starting_balance"]);

/**
 * PostgREST may return numeric columns as strings; coerce them. `created_at` is
 * DB-only bookkeeping and is dropped so rows look exactly like the mock layer's
 * (otherwise it would leak into re-created rows, e.g. new fixed-row versions).
 */
function normalize<T>(row: Record<string, unknown>): T {
  const { created_at: _createdAt, ...out } = row;
  void _createdAt;
  for (const key of NUMERIC_FIELDS) {
    if (typeof out[key] === "string") out[key] = Number(out[key]);
  }
  return out as T;
}

function table<T extends { id: Id }>(name: string): TableApi<T> {
  return {
    async create(row: NewRow<T>) {
      const { data, error } = await getSupabase().from(name).insert(row as Record<string, unknown>).select().single();
      if (error) throw error;
      return normalize<T>(data);
    },
    async update(id: Id, patch: RowPatch<T>) {
      const { data, error } = await getSupabase().from(name).update(patch as Record<string, unknown>).eq("id", id).select().single();
      if (error) throw error;
      return normalize<T>(data);
    },
    async remove(id: Id) {
      const { error } = await getSupabase().from(name).delete().eq("id", id);
      if (error) throw error;
    },
  };
}

async function selectAll<T>(name: string, orderBy = "created_at"): Promise<T[]> {
  const { data, error } = await getSupabase().from(name).select("*").order(orderBy, { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => normalize<T>(r));
}

async function loadSettings(): Promise<Settings> {
  const sb = getSupabase();
  const { data, error } = await sb.from("settings").select("*").limit(1).maybeSingle();
  if (error) throw error;
  if (data) return normalize<Settings>(data);
  const { data: created, error: insertError } = await sb
    .from("settings")
    .insert({ savings_mode: "percentage", savings_value: 10, language: "de", savings_source_account_id: null, savings_account_id: null })
    .select()
    .single();
  if (insertError) throw insertError;
  return normalize<Settings>(created);
}

export const supabaseApi: DataApi = {
  mode: "supabase",
  async loadAll(): Promise<AppData> {
    const [accounts, categories, settings, incomeFixed, incomeOnetime, expensesFixed, expensesVariable, debts, savingsTransactions] =
      await Promise.all([
        selectAll<AppData["accounts"][number]>("accounts"),
        selectAll<AppData["categories"][number]>("categories"),
        loadSettings(),
        selectAll<AppData["incomeFixed"][number]>("income_fixed"),
        selectAll<AppData["incomeOnetime"][number]>("income_onetime"),
        selectAll<AppData["expensesFixed"][number]>("expenses_fixed"),
        selectAll<AppData["expensesVariable"][number]>("expenses_variable"),
        selectAll<AppData["debts"][number]>("debts"),
        selectAll<AppData["savingsTransactions"][number]>("savings_transactions"),
      ]);
    return { accounts, categories, settings, incomeFixed, incomeOnetime, expensesFixed, expensesVariable, debts, savingsTransactions };
  },
  async updateSettings(patch: RowPatch<Settings>) {
    const current = await loadSettings();
    const { data, error } = await getSupabase().from("settings").update(patch).eq("id", current.id).select().single();
    if (error) throw error;
    return normalize<Settings>(data);
  },
  accounts: table("accounts"),
  categories: table("categories"),
  incomeFixed: table("income_fixed"),
  incomeOnetime: table("income_onetime"),
  expensesFixed: table("expenses_fixed"),
  expensesVariable: table("expenses_variable"),
  debts: table("debts"),
  savingsTransactions: table("savings_transactions"),
};
