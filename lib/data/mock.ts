import type { DataApi, TableApi } from "./api";
import type { AppData, Id, NewRow, RowPatch, Settings } from "./types";
import { buildSeed } from "./seed";

/** In-memory data layer (Phase 1). State lives for the lifetime of the page. */
let db: AppData = buildSeed();

function newId(): Id {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const wait = () => new Promise<void>((r) => setTimeout(r, 30));

function table<T extends { id: Id }>(get: () => T[], set: (rows: T[]) => void): TableApi<T> {
  return {
    async create(row: NewRow<T>) {
      await wait();
      const created = { ...(row as object), id: newId() } as T;
      set([...get(), created]);
      return clone(created);
    },
    async update(id: Id, patch: RowPatch<T>) {
      await wait();
      const rows = get();
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) throw new Error(`Row ${id} not found`);
      const updated = { ...rows[idx], ...patch } as T;
      set(rows.map((r) => (r.id === id ? updated : r)));
      return clone(updated);
    },
    async remove(id: Id) {
      await wait();
      set(get().filter((r) => r.id !== id));
    },
  };
}

export const mockApi: DataApi = {
  mode: "mock",
  async loadAll() {
    await wait();
    return clone(db);
  },
  async updateSettings(patch: RowPatch<Settings>) {
    await wait();
    db = { ...db, settings: { ...db.settings, ...patch } };
    return clone(db.settings);
  },
  accounts: table(() => db.accounts, (rows) => (db = { ...db, accounts: rows })),
  categories: table(() => db.categories, (rows) => (db = { ...db, categories: rows })),
  incomeFixed: table(() => db.incomeFixed, (rows) => (db = { ...db, incomeFixed: rows })),
  incomeOnetime: table(() => db.incomeOnetime, (rows) => (db = { ...db, incomeOnetime: rows })),
  expensesFixed: table(() => db.expensesFixed, (rows) => (db = { ...db, expensesFixed: rows })),
  expensesVariable: table(() => db.expensesVariable, (rows) => (db = { ...db, expensesVariable: rows })),
  debts: table(() => db.debts, (rows) => (db = { ...db, debts: rows })),
  savingsTransactions: table(() => db.savingsTransactions, (rows) => (db = { ...db, savingsTransactions: rows })),
};
