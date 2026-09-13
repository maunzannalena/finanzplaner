import type {
  AppData,
  Category,
  ExpenseVariable,
  FixedRow,
  Id,
  SavingsTransaction,
  Settings,
} from "@/lib/data/types";
import {
  currentMonthKey,
  dayInMonth,
  isInMonth,
  lastNMonths,
  monthEnd,
  monthKeyOf,
  monthRange,
  monthStart,
  todayISO,
} from "@/lib/dates";
import { round2 } from "@/lib/format";

export const sum = (xs: number[]) => round2(xs.reduce((a, b) => a + b, 0));

/** Is a recurring row valid (existing) during the given month? */
export function isRowValidInMonth(row: FixedRow, key: string): boolean {
  return row.valid_from <= monthEnd(key) && (row.valid_to === null || row.valid_to >= monthStart(key));
}

/** Rows that count for a month: valid and active. */
export function fixedRowsForMonth(rows: FixedRow[], key: string): FixedRow[] {
  return rows.filter((r) => r.active && isRowValidInMonth(r, key));
}

/** Rows to show in the "current" list (not closed by an edit in the past). */
export function currentFixedRows(rows: FixedRow[]): FixedRow[] {
  const key = currentMonthKey();
  return rows.filter((r) => r.valid_to === null || r.valid_to >= monthStart(key));
}

export function incomeForMonth(data: AppData, key: string) {
  const fixed = sum(fixedRowsForMonth(data.incomeFixed, key).map((r) => r.amount));
  const onetime = sum(data.incomeOnetime.filter((r) => isInMonth(r.date, key)).map((r) => r.amount));
  return { fixed, onetime, total: round2(fixed + onetime) };
}

export function fixedExpensesForMonth(data: AppData, key: string): number {
  return sum(fixedRowsForMonth(data.expensesFixed, key).map((r) => r.amount));
}

export function variableForMonth(data: AppData, key: string) {
  const all = data.expensesVariable.filter((e) => isInMonth(e.date, key));
  const fromBudget = all.filter((e) => !e.paid_from_savings);
  const fromSavings = all.filter((e) => e.paid_from_savings);
  return {
    all,
    fromBudget,
    fromSavings,
    totalBudget: sum(fromBudget.map((e) => e.amount)),
    totalSavings: sum(fromSavings.map((e) => e.amount)),
    total: sum(all.map((e) => e.amount)),
  };
}

export function savingsForMonth(data: AppData, key: string) {
  const txs = data.savingsTransactions.filter((t) => isInMonth(t.date, key));
  return {
    deposits: sum(txs.filter((t) => t.type === "deposit").map((t) => t.amount)),
    withdrawals: sum(txs.filter((t) => t.type === "withdrawal").map((t) => t.amount)),
  };
}

/** All-time savings balance: deposits minus withdrawals. */
export function savingsBalance(txs: SavingsTransaction[]): number {
  return sum(txs.map((t) => (t.type === "deposit" ? t.amount : -t.amount)));
}

/** Amount the settings say to set aside for a month with the given income. */
export function autoSavingsAmount(settings: Settings, income: number): number {
  if (settings.savings_mode === "percentage") {
    return round2(Math.max(0, income) * (Math.max(0, settings.savings_value) / 100));
  }
  return round2(Math.max(0, settings.savings_value));
}

export interface MonthSummary {
  key: string;
  income: number;
  fixedExpenses: number;
  saved: number; // deposits this month
  withdrawn: number;
  free: number; // income - fixed - saved
  spent: number; // variable expenses paid from the free balance
  spentFromSavings: number;
  remaining: number; // free - spent
  ratio: number; // spent / free (0 when free <= 0 and spent 0)
  over: boolean;
}

export function monthSummary(data: AppData, key: string): MonthSummary {
  const income = incomeForMonth(data, key).total;
  const fixedExpenses = fixedExpensesForMonth(data, key);
  const { deposits: saved, withdrawals: withdrawn } = savingsForMonth(data, key);
  const v = variableForMonth(data, key);
  const free = round2(income - fixedExpenses - saved);
  const spent = v.totalBudget;
  const remaining = round2(free - spent);
  let ratio = 0;
  if (free > 0) ratio = spent / free;
  else if (spent > 0) ratio = Infinity;
  return {
    key,
    income,
    fixedExpenses,
    saved,
    withdrawn,
    free,
    spent,
    spentFromSavings: v.totalSavings,
    remaining,
    ratio,
    over: spent > free,
  };
}

export interface CategoryTotal {
  category: Category | null;
  total: number;
  count: number;
}

export function categoryTotals(data: AppData, key: string): CategoryTotal[] {
  const map = new Map<Id | null, { total: number; count: number }>();
  for (const e of variableForMonth(data, key).all) {
    const cur = map.get(e.category_id) ?? { total: 0, count: 0 };
    cur.total += e.amount;
    cur.count += 1;
    map.set(e.category_id, cur);
  }
  const out: CategoryTotal[] = [];
  for (const [id, v] of map) {
    out.push({
      category: id ? (data.categories.find((c) => c.id === id) ?? null) : null,
      total: round2(v.total),
      count: v.count,
    });
  }
  return out.sort((a, b) => b.total - a.total);
}

export interface SavingsPoint {
  key: string;
  deposits: number;
  withdrawals: number;
  balance: number;
}

export function savingsSeries(data: AppData, months: number): SavingsPoint[] {
  const keys = lastNMonths(months);
  const before = savingsBalance(data.savingsTransactions.filter((t) => monthKeyOf(t.date) < keys[0]));
  let running = before;
  return keys.map((key) => {
    const { deposits, withdrawals } = savingsForMonth(data, key);
    running = round2(running + deposits - withdrawals);
    return { key, deposits, withdrawals, balance: running };
  });
}

export type TxKind =
  | "income_fixed"
  | "income_onetime"
  | "expense_fixed"
  | "expense_variable"
  | "savings_deposit"
  | "savings_withdrawal";

export interface Tx {
  id: string;
  kind: TxKind;
  name: string;
  amount: number;
  date: string;
  account_id: Id | null;
  category_id: Id | null;
  paid_from_savings: boolean;
  auto: boolean;
}

/** Everything that happened in a month, newest first. */
export function transactionsForMonth(data: AppData, key: string): Tx[] {
  const out: Tx[] = [];
  for (const r of fixedRowsForMonth(data.incomeFixed, key)) {
    out.push({ id: `if-${r.id}`, kind: "income_fixed", name: r.name, amount: r.amount, date: dayInMonth(key, r.day_of_month), account_id: r.account_id, category_id: null, paid_from_savings: false, auto: false });
  }
  for (const r of data.incomeOnetime.filter((r) => isInMonth(r.date, key))) {
    out.push({ id: `io-${r.id}`, kind: "income_onetime", name: r.name, amount: r.amount, date: r.date, account_id: r.account_id, category_id: null, paid_from_savings: false, auto: false });
  }
  for (const r of fixedRowsForMonth(data.expensesFixed, key)) {
    out.push({ id: `ef-${r.id}`, kind: "expense_fixed", name: r.name, amount: r.amount, date: dayInMonth(key, r.day_of_month), account_id: r.account_id, category_id: null, paid_from_savings: false, auto: false });
  }
  for (const r of data.expensesVariable.filter((r) => isInMonth(r.date, key))) {
    out.push({ id: `ev-${r.id}`, kind: "expense_variable", name: r.name, amount: r.amount, date: r.date, account_id: r.account_id, category_id: r.category_id, paid_from_savings: r.paid_from_savings, auto: false });
  }
  for (const t of data.savingsTransactions.filter((t) => isInMonth(t.date, key))) {
    // Withdrawals linked to an expense are already represented by that expense.
    if (t.type === "withdrawal" && t.expense_id) continue;
    out.push({ id: `st-${t.id}`, kind: t.type === "deposit" ? "savings_deposit" : "savings_withdrawal", name: t.note, amount: t.amount, date: t.date, account_id: t.account_id, category_id: null, paid_from_savings: false, auto: t.auto_month !== null });
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** Earliest month that has any data, defaults to current month. */
export function earliestMonthKey(data: AppData): string {
  const dates: string[] = [
    ...data.incomeFixed.map((r) => r.valid_from),
    ...data.expensesFixed.map((r) => r.valid_from),
    ...data.incomeOnetime.map((r) => r.date),
    ...data.expensesVariable.map((r) => r.date),
    ...data.savingsTransactions.map((r) => r.date),
  ];
  const min = dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : todayKeyStart();
  const key = monthKeyOf(min);
  return key < currentMonthKey() ? key : currentMonthKey();
}

function todayKeyStart() {
  return monthStart(currentMonthKey());
}

export function expenseById(data: AppData, id: Id): ExpenseVariable | undefined {
  return data.expensesVariable.find((e) => e.id === id);
}

// ---------------------------------------------------------------------------
// Account balances
// ---------------------------------------------------------------------------

export type MovementKind =
  | "income_fixed"
  | "income_onetime"
  | "expense_fixed"
  | "expense_variable"
  | "savings_out" // monthly set-aside / manual deposit leaving this account
  | "savings_in" // deposit arriving in the savings account
  | "withdrawal_out" // money leaving the savings account
  | "withdrawal_in"; // money from savings arriving in this account

export interface Movement {
  id: string;
  kind: MovementKind;
  date: string;
  name: string;
  /** Signed: positive = money in, negative = money out. */
  amount: number;
  auto: boolean;
  /** The other account involved in a transfer, if any. */
  counterparty: Id | null;
}

/**
 * Every movement on an account after its balance_date (exclusive) up to today
 * (inclusive). Recurring rows are materialised per month; future days of the
 * current month are not counted yet, so the result matches the bank app.
 */
export function accountMovements(data: AppData, accountId: Id, today = todayISO()): Movement[] {
  const acc = data.accounts.find((a) => a.id === accountId);
  if (!acc) return [];
  const from = acc.balance_date;
  const inWindow = (d: string) => d > from && d <= today;
  const out: Movement[] = [];
  const savingsAcc = data.settings.savings_account_id;

  if (from < today) {
    for (const key of monthRange(monthKeyOf(from), monthKeyOf(today))) {
      for (const r of fixedRowsForMonth(data.incomeFixed, key)) {
        const d = dayInMonth(key, r.day_of_month);
        if (r.account_id === accountId && inWindow(d)) out.push({ id: `if-${r.id}-${key}`, kind: "income_fixed", date: d, name: r.name, amount: r.amount, auto: false, counterparty: null });
      }
      for (const r of fixedRowsForMonth(data.expensesFixed, key)) {
        const d = dayInMonth(key, r.day_of_month);
        if (r.account_id === accountId && inWindow(d)) out.push({ id: `ef-${r.id}-${key}`, kind: "expense_fixed", date: d, name: r.name, amount: -r.amount, auto: false, counterparty: null });
      }
    }
  }
  for (const r of data.incomeOnetime) {
    if (r.account_id === accountId && inWindow(r.date)) out.push({ id: `io-${r.id}`, kind: "income_onetime", date: r.date, name: r.name, amount: r.amount, auto: false, counterparty: null });
  }
  for (const r of data.expensesVariable) {
    if (r.account_id === accountId && inWindow(r.date)) out.push({ id: `ev-${r.id}`, kind: "expense_variable", date: r.date, name: r.name, amount: -r.amount, auto: false, counterparty: null });
  }
  for (const t of data.savingsTransactions) {
    if (!inWindow(t.date)) continue;
    const auto = t.auto_month !== null;
    if (t.type === "deposit") {
      if (t.account_id === accountId) out.push({ id: `so-${t.id}`, kind: "savings_out", date: t.date, name: t.note, amount: -t.amount, auto, counterparty: savingsAcc });
      if (savingsAcc === accountId) out.push({ id: `si-${t.id}`, kind: "savings_in", date: t.date, name: t.note, amount: t.amount, auto, counterparty: t.account_id });
    } else {
      if (savingsAcc === accountId) out.push({ id: `wo-${t.id}`, kind: "withdrawal_out", date: t.date, name: t.note, amount: -t.amount, auto: false, counterparty: t.account_id });
      if (t.account_id === accountId) out.push({ id: `wi-${t.id}`, kind: "withdrawal_in", date: t.date, name: t.note, amount: t.amount, auto: false, counterparty: savingsAcc });
    }
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.id < b.id ? 1 : -1));
}

/** starting_balance + all movements since balance_date. */
export function accountBalance(data: AppData, accountId: Id, today = todayISO()): number {
  const acc = data.accounts.find((a) => a.id === accountId);
  if (!acc) return 0;
  return round2(acc.starting_balance + sum(accountMovements(data, accountId, today).map((m) => m.amount)));
}

export interface LogEntry {
  movement: Movement;
  /** Balance right after this movement. */
  balanceAfter: number;
}

/** Movements newest first, each with the running balance after it. */
export function accountLog(data: AppData, accountId: Id, today = todayISO()): LogEntry[] {
  const movements = accountMovements(data, accountId, today);
  let running = accountBalance(data, accountId, today);
  return movements.map((movement) => {
    const entry = { movement, balanceAfter: running };
    running = round2(running - movement.amount);
    return entry;
  });
}
