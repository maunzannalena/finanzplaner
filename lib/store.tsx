"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api } from "@/lib/data";
import type {
  Account,
  AppData,
  Category,
  Debt,
  ExpenseVariable,
  FixedRow,
  Id,
  IncomeOnetime,
  NewRow,
  RowPatch,
  SavingsTransaction,
  Settings,
} from "@/lib/data/types";
import { autoSavingsAmount, incomeForMonth } from "@/lib/calc";
import { currentMonthKey, monthStart, prevMonthEnd } from "@/lib/dates";
import { readStoredLanguage, useI18n } from "@/lib/i18n";

export type FixedKind = "income" | "expense";
export type FixedInput = Pick<FixedRow, "name" | "amount" | "account_id" | "day_of_month" | "active">;
export type RemoveResult = { ok: true } | { ok: false; reason: "in_use" };

export interface Store {
  data: AppData | null;
  loading: boolean;
  error: string | null;
  mode: "mock" | "supabase";
  clearError: () => void;

  addAccount: (row: NewRow<Account>) => Promise<void>;
  updateAccount: (id: Id, patch: RowPatch<Account>) => Promise<void>;
  removeAccount: (id: Id) => Promise<RemoveResult>;

  addCategory: (name: string) => Promise<Category | null>;
  renameCategory: (id: Id, name: string) => Promise<void>;
  removeCategory: (id: Id) => Promise<RemoveResult>;

  updateSettings: (patch: RowPatch<Settings>) => Promise<void>;

  addFixed: (kind: FixedKind, row: FixedInput) => Promise<void>;
  updateFixed: (kind: FixedKind, id: Id, patch: Partial<FixedInput>) => Promise<void>;
  removeFixed: (kind: FixedKind, id: Id) => Promise<void>;

  addOnetimeIncome: (row: NewRow<IncomeOnetime>) => Promise<void>;
  updateOnetimeIncome: (id: Id, patch: RowPatch<IncomeOnetime>) => Promise<void>;
  removeOnetimeIncome: (id: Id) => Promise<void>;

  addVariableExpense: (row: NewRow<ExpenseVariable>) => Promise<void>;
  updateVariableExpense: (id: Id, patch: RowPatch<ExpenseVariable>) => Promise<void>;
  removeVariableExpense: (id: Id) => Promise<void>;

  addDebt: (row: NewRow<Debt>) => Promise<void>;
  updateDebt: (id: Id, patch: RowPatch<Debt>) => Promise<void>;
  removeDebt: (id: Id) => Promise<void>;

  addSavingsTx: (row: NewRow<SavingsTransaction>) => Promise<void>;
  updateSavingsTx: (id: Id, patch: RowPatch<SavingsTransaction>) => Promise<void>;
  removeSavingsTx: (id: Id) => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

function fixedKey(kind: FixedKind): "incomeFixed" | "expensesFixed" {
  return kind === "income" ? "incomeFixed" : "expensesFixed";
}

function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e && "message" in e) return String((e as { message: unknown }).message);
  return String(e);
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dataRef = useRef<AppData | null>(null);
  const { setLang } = useI18n();

  const setData = useCallback((fn: (d: AppData) => AppData) => {
    setDataState((prev) => {
      if (!prev) return prev;
      const next = fn(prev);
      dataRef.current = next;
      return next;
    });
  }, []);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    api
      .loadAll()
      .then((d) => {
        if (cancelled) return;
        dataRef.current = d;
        setDataState(d);
        if (!readStoredLanguage()) setLang(d.settings.language);
      })
      .catch((e) => !cancelled && setError(errorMessage(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [setLang]);

  /** Runs an action, surfaces errors as a banner instead of throwing. */
  const run = useCallback(async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await fn();
    } catch (e) {
      console.error(e);
      setError(errorMessage(e));
      return fallback;
    }
  }, []);

  // ---- Accounts & categories ------------------------------------------------

  const addAccount = useCallback(
    (row: NewRow<Account>) =>
      run(async () => {
        const created = await api.accounts.create({ ...row, name: row.name.trim() });
        setData((d) => ({ ...d, accounts: [...d.accounts, created] }));
      }, undefined),
    [run, setData],
  );

  const updateAccount = useCallback(
    (id: Id, patch: RowPatch<Account>) =>
      run(async () => {
        const row = await api.accounts.update(id, patch.name !== undefined ? { ...patch, name: patch.name.trim() } : patch);
        setData((d) => ({ ...d, accounts: d.accounts.map((a) => (a.id === id ? row : a)) }));
      }, undefined),
    [run, setData],
  );

  const removeAccount = useCallback(
    (id: Id): Promise<RemoveResult> =>
      run<RemoveResult>(async () => {
        const d = dataRef.current!;
        const inUse =
          d.incomeFixed.some((r) => r.account_id === id) ||
          d.incomeOnetime.some((r) => r.account_id === id) ||
          d.expensesFixed.some((r) => r.account_id === id) ||
          d.expensesVariable.some((r) => r.account_id === id) ||
          d.savingsTransactions.some((t) => t.account_id === id) ||
          d.settings.savings_source_account_id === id ||
          d.settings.savings_account_id === id;
        if (inUse) return { ok: false, reason: "in_use" };
        await api.accounts.remove(id);
        setData((d) => ({ ...d, accounts: d.accounts.filter((a) => a.id !== id) }));
        return { ok: true };
      }, { ok: false, reason: "in_use" }),
    [run, setData],
  );

  const addCategory = useCallback(
    (name: string) =>
      run<Category | null>(async () => {
        const row = await api.categories.create({ name: name.trim() });
        setData((d) => ({ ...d, categories: [...d.categories, row] }));
        return row;
      }, null),
    [run, setData],
  );

  const renameCategory = useCallback(
    (id: Id, name: string) =>
      run(async () => {
        const row = await api.categories.update(id, { name: name.trim() });
        setData((d) => ({ ...d, categories: d.categories.map((c) => (c.id === id ? row : c)) }));
      }, undefined),
    [run, setData],
  );

  const removeCategory = useCallback(
    (id: Id): Promise<RemoveResult> =>
      run<RemoveResult>(async () => {
        const d = dataRef.current!;
        if (d.expensesVariable.some((e) => e.category_id === id)) return { ok: false, reason: "in_use" };
        await api.categories.remove(id);
        setData((d) => ({ ...d, categories: d.categories.filter((c) => c.id !== id) }));
        return { ok: true };
      }, { ok: false, reason: "in_use" }),
    [run, setData],
  );

  // ---- Settings -------------------------------------------------------------

  const updateSettings = useCallback(
    (patch: RowPatch<Settings>) =>
      run(async () => {
        const s = await api.updateSettings(patch);
        setData((d) => ({ ...d, settings: s }));
      }, undefined),
    [run, setData],
  );

  // ---- Fixed rows (versioned so past months keep their history) -------------

  const addFixed = useCallback(
    (kind: FixedKind, row: FixedInput) =>
      run(async () => {
        const key = fixedKey(kind);
        const created = await api[key].create({ ...row, valid_from: monthStart(currentMonthKey()), valid_to: null });
        setData((d) => ({ ...d, [key]: [...d[key], created] }));
      }, undefined),
    [run, setData],
  );

  const updateFixed = useCallback(
    (kind: FixedKind, id: Id, patch: Partial<FixedInput>) =>
      run(async () => {
        const key = fixedKey(kind);
        const rows = dataRef.current![key];
        const row = rows.find((r) => r.id === id);
        if (!row) return;
        const thisMonth = monthStart(currentMonthKey());
        const moneyChanged =
          (patch.amount !== undefined && patch.amount !== row.amount) ||
          (patch.active !== undefined && patch.active !== row.active);
        if (moneyChanged && row.valid_from < thisMonth) {
          // Close the old version at the end of last month, start a new one this month.
          const closed = await api[key].update(id, { valid_to: prevMonthEnd(currentMonthKey()) });
          const { id: _oldId, ...rest } = row;
          void _oldId;
          const created = await api[key].create({ ...rest, ...patch, valid_from: thisMonth, valid_to: null });
          setData((d) => ({ ...d, [key]: [...d[key].map((r) => (r.id === id ? closed : r)), created] }));
        } else {
          const updated = await api[key].update(id, patch);
          setData((d) => ({ ...d, [key]: d[key].map((r) => (r.id === id ? updated : r)) }));
        }
      }, undefined),
    [run, setData],
  );

  const removeFixed = useCallback(
    (kind: FixedKind, id: Id) =>
      run(async () => {
        const key = fixedKey(kind);
        const row = dataRef.current![key].find((r) => r.id === id);
        if (!row) return;
        if (row.valid_from < monthStart(currentMonthKey())) {
          // Keep it in past months, just end it.
          const closed = await api[key].update(id, { valid_to: prevMonthEnd(currentMonthKey()) });
          setData((d) => ({ ...d, [key]: d[key].map((r) => (r.id === id ? closed : r)) }));
        } else {
          await api[key].remove(id);
          setData((d) => ({ ...d, [key]: d[key].filter((r) => r.id !== id) }));
        }
      }, undefined),
    [run, setData],
  );

  // ---- One-time income -------------------------------------------------------

  const addOnetimeIncome = useCallback(
    (row: NewRow<IncomeOnetime>) =>
      run(async () => {
        const created = await api.incomeOnetime.create(row);
        setData((d) => ({ ...d, incomeOnetime: [...d.incomeOnetime, created] }));
      }, undefined),
    [run, setData],
  );

  const updateOnetimeIncome = useCallback(
    (id: Id, patch: RowPatch<IncomeOnetime>) =>
      run(async () => {
        const updated = await api.incomeOnetime.update(id, patch);
        setData((d) => ({ ...d, incomeOnetime: d.incomeOnetime.map((r) => (r.id === id ? updated : r)) }));
      }, undefined),
    [run, setData],
  );

  const removeOnetimeIncome = useCallback(
    (id: Id) =>
      run(async () => {
        await api.incomeOnetime.remove(id);
        setData((d) => ({ ...d, incomeOnetime: d.incomeOnetime.filter((r) => r.id !== id) }));
      }, undefined),
    [run, setData],
  );

  // ---- Variable expenses (kept in sync with savings withdrawals) ---------------

  const addVariableExpense = useCallback(
    (row: NewRow<ExpenseVariable>) =>
      run(async () => {
        const created = await api.expensesVariable.create(row);
        let tx: SavingsTransaction | null = null;
        if (created.paid_from_savings) {
          tx = await api.savingsTransactions.create({
            type: "withdrawal",
            amount: created.amount,
            note: created.name,
            date: created.date,
            auto_month: null,
            expense_id: created.id,
            account_id: created.account_id,
          });
        }
        setData((d) => ({
          ...d,
          expensesVariable: [...d.expensesVariable, created],
          savingsTransactions: tx ? [...d.savingsTransactions, tx] : d.savingsTransactions,
        }));
      }, undefined),
    [run, setData],
  );

  const updateVariableExpense = useCallback(
    (id: Id, patch: RowPatch<ExpenseVariable>) =>
      run(async () => {
        const updated = await api.expensesVariable.update(id, patch);
        const linked = dataRef.current!.savingsTransactions.find((t) => t.expense_id === id);
        let txs = dataRef.current!.savingsTransactions;
        if (updated.paid_from_savings) {
          const wanted = { amount: updated.amount, note: updated.name, date: updated.date, account_id: updated.account_id };
          if (linked) {
            if (linked.amount !== wanted.amount || linked.note !== wanted.note || linked.date !== wanted.date || linked.account_id !== wanted.account_id) {
              const tx = await api.savingsTransactions.update(linked.id, wanted);
              txs = txs.map((t) => (t.id === linked.id ? tx : t));
            }
          } else {
            const tx = await api.savingsTransactions.create({ type: "withdrawal", ...wanted, auto_month: null, expense_id: id });
            txs = [...txs, tx];
          }
        } else if (linked) {
          await api.savingsTransactions.remove(linked.id);
          txs = txs.filter((t) => t.id !== linked.id);
        }
        setData((d) => ({
          ...d,
          expensesVariable: d.expensesVariable.map((e) => (e.id === id ? updated : e)),
          savingsTransactions: txs,
        }));
      }, undefined),
    [run, setData],
  );

  const removeVariableExpense = useCallback(
    (id: Id) =>
      run(async () => {
        const linked = dataRef.current!.savingsTransactions.find((t) => t.expense_id === id);
        if (linked) await api.savingsTransactions.remove(linked.id);
        await api.expensesVariable.remove(id);
        setData((d) => ({
          ...d,
          expensesVariable: d.expensesVariable.filter((e) => e.id !== id),
          savingsTransactions: d.savingsTransactions.filter((t) => t.expense_id !== id),
        }));
      }, undefined),
    [run, setData],
  );

  // ---- Debts --------------------------------------------------------------------

  const addDebt = useCallback(
    (row: NewRow<Debt>) =>
      run(async () => {
        const created = await api.debts.create(row);
        setData((d) => ({ ...d, debts: [...d.debts, created] }));
      }, undefined),
    [run, setData],
  );

  const updateDebt = useCallback(
    (id: Id, patch: RowPatch<Debt>) =>
      run(async () => {
        const updated = await api.debts.update(id, patch);
        setData((d) => ({ ...d, debts: d.debts.map((x) => (x.id === id ? updated : x)) }));
      }, undefined),
    [run, setData],
  );

  const removeDebt = useCallback(
    (id: Id) =>
      run(async () => {
        await api.debts.remove(id);
        setData((d) => ({ ...d, debts: d.debts.filter((x) => x.id !== id) }));
      }, undefined),
    [run, setData],
  );

  // ---- Savings transactions ---------------------------------------------------

  const addSavingsTx = useCallback(
    (row: NewRow<SavingsTransaction>) =>
      run(async () => {
        const created = await api.savingsTransactions.create(row);
        setData((d) => ({ ...d, savingsTransactions: [...d.savingsTransactions, created] }));
      }, undefined),
    [run, setData],
  );

  const updateSavingsTx = useCallback(
    (id: Id, patch: RowPatch<SavingsTransaction>) =>
      run(async () => {
        const updated = await api.savingsTransactions.update(id, patch);
        setData((d) => ({ ...d, savingsTransactions: d.savingsTransactions.map((t) => (t.id === id ? updated : t)) }));
      }, undefined),
    [run, setData],
  );

  const removeSavingsTx = useCallback(
    (id: Id) =>
      run(async () => {
        const tx = dataRef.current!.savingsTransactions.find((t) => t.id === id);
        if (!tx) return;
        let expense: ExpenseVariable | null = null;
        if (tx.expense_id) {
          // Unlink: the expense is no longer "paid from savings".
          expense = await api.expensesVariable.update(tx.expense_id, { paid_from_savings: false });
        }
        await api.savingsTransactions.remove(id);
        setData((d) => ({
          ...d,
          savingsTransactions: d.savingsTransactions.filter((t) => t.id !== id),
          expensesVariable: expense ? d.expensesVariable.map((e) => (e.id === expense!.id ? expense! : e)) : d.expensesVariable,
        }));
      }, undefined),
    [run, setData],
  );

  // ---- Automatic monthly set-aside -------------------------------------------
  // Keeps exactly one "auto" deposit for the current month in sync with the
  // savings settings and this month's income. Past months are never touched.
  const autoBusy = useRef(false);
  const autoFailed = useRef(false);
  useEffect(() => {
    if (!data || autoBusy.current || autoFailed.current) return;
    const key = currentMonthKey();
    const expected = autoSavingsAmount(data.settings, incomeForMonth(data, key).total);
    const source = data.settings.savings_source_account_id;
    const existing = data.savingsTransactions.find((t) => t.auto_month === key);
    let job: Promise<void> | null = null;
    if (existing) {
      if (expected <= 0) {
        job = api.savingsTransactions.remove(existing.id).then(() =>
          setData((d) => ({ ...d, savingsTransactions: d.savingsTransactions.filter((t) => t.id !== existing.id) })),
        );
      } else if (Math.abs(existing.amount - expected) >= 0.005 || existing.account_id !== source) {
        // Amount or source account changed this month -> the transfer follows the rule.
        job = api.savingsTransactions.update(existing.id, { amount: expected, account_id: source }).then((tx) =>
          setData((d) => ({ ...d, savingsTransactions: d.savingsTransactions.map((t) => (t.id === tx.id ? tx : t)) })),
        );
      }
    } else if (expected > 0) {
      job = api.savingsTransactions
        .create({ type: "deposit", amount: expected, note: "", date: monthStart(key), auto_month: key, expense_id: null, account_id: source })
        .then((tx) => setData((d) => ({ ...d, savingsTransactions: [...d.savingsTransactions, tx] })));
    }
    if (!job) return;
    autoBusy.current = true;
    job
      .catch((e) => {
        console.error(e);
        autoFailed.current = true;
        setError(errorMessage(e));
      })
      .finally(() => {
        autoBusy.current = false;
      });
  }, [data, setData]);

  const value = useMemo<Store>(
    () => ({
      data,
      loading,
      error,
      mode: api.mode,
      clearError: () => setError(null),
      addAccount,
      updateAccount,
      removeAccount,
      addCategory,
      renameCategory,
      removeCategory,
      updateSettings,
      addFixed,
      updateFixed,
      removeFixed,
      addOnetimeIncome,
      updateOnetimeIncome,
      removeOnetimeIncome,
      addVariableExpense,
      updateVariableExpense,
      removeVariableExpense,
      addDebt,
      updateDebt,
      removeDebt,
      addSavingsTx,
      updateSavingsTx,
      removeSavingsTx,
    }),
    [
      data, loading, error,
      addAccount, updateAccount, removeAccount,
      addCategory, renameCategory, removeCategory,
      updateSettings,
      addFixed, updateFixed, removeFixed,
      addOnetimeIncome, updateOnetimeIncome, removeOnetimeIncome,
      addVariableExpense, updateVariableExpense, removeVariableExpense,
      addDebt, updateDebt, removeDebt,
      addSavingsTx, updateSavingsTx, removeSavingsTx,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside DataProvider");
  return ctx;
}

/** Same as useStore but guarantees loaded data (use only after the loading gate). */
export function useData(): AppData {
  const { data } = useStore();
  if (!data) throw new Error("Data not loaded yet");
  return data;
}

export function accountName(accounts: Account[], id: Id | null): string {
  return accounts.find((a) => a.id === id)?.name ?? "";
}

export function categoryName(categories: Category[], id: Id | null): string {
  return categories.find((c) => c.id === id)?.name ?? "";
}
