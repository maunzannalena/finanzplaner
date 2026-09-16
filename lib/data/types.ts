export type Id = string;
export type Language = "de" | "en";
export type SavingsMode = "percentage" | "fixed";
export type DebtDirection = "ana_owes" | "owed_to_ana";
export type SavingsTxType = "deposit" | "withdrawal";

export interface Account {
  id: Id;
  name: string;
  /** Real balance on `balance_date` (end of that day). Everything after it is computed by the app. */
  starting_balance: number;
  balance_date: string; // YYYY-MM-DD
}

export interface Category {
  id: Id;
  name: string;
}

export interface Settings {
  id: Id;
  savings_mode: SavingsMode;
  savings_value: number;
  language: Language;
  /** Account the monthly set-aside is taken from (default: Sparkasse). */
  savings_source_account_id: Id | null;
  /** Account that holds the savings (default: Revolut Sparen). */
  savings_account_id: Id | null;
}

/**
 * Recurring row (fixed income / fixed expense).
 * `valid_from` / `valid_to` keep past months untouched when an amount changes:
 * editing closes the old row at the end of last month and creates a new one.
 */
export interface FixedRow {
  id: Id;
  name: string;
  amount: number;
  account_id: Id | null;
  day_of_month: number;
  active: boolean;
  valid_from: string; // YYYY-MM-DD
  valid_to: string | null; // YYYY-MM-DD, inclusive
}

export type IncomeFixed = FixedRow;
export type ExpenseFixed = FixedRow;

export interface IncomeOnetime {
  id: Id;
  name: string;
  amount: number;
  account_id: Id | null;
  date: string;
}

export interface ExpenseVariable {
  id: Id;
  name: string;
  category_id: Id | null;
  amount: number;
  account_id: Id | null;
  date: string;
  paid_from_savings: boolean;
}

export interface Debt {
  id: Id;
  direction: DebtDirection;
  person: string;
  amount: number;
  note: string;
  due_date: string | null;
  installments: number | null;
  /** How many installments are already settled (only meaningful when `installments` is set). */
  paid_installments: number;
  paid: boolean;
}

export interface SavingsTransaction {
  id: Id;
  type: SavingsTxType;
  amount: number;
  note: string;
  date: string;
  /** Set (YYYY-MM) on the automatic monthly deposit for that month. */
  auto_month: string | null;
  /** Set when the withdrawal belongs to a variable expense paid from savings. */
  expense_id: Id | null;
  /** Counter-account: for a deposit the account the money came from, for a withdrawal the account it went to. */
  account_id: Id | null;
}

export interface AppData {
  accounts: Account[];
  categories: Category[];
  settings: Settings;
  incomeFixed: IncomeFixed[];
  incomeOnetime: IncomeOnetime[];
  expensesFixed: ExpenseFixed[];
  expensesVariable: ExpenseVariable[];
  debts: Debt[];
  savingsTransactions: SavingsTransaction[];
}

export type NewRow<T extends { id: Id }> = Omit<T, "id">;
export type RowPatch<T extends { id: Id }> = Partial<NewRow<T>>;
