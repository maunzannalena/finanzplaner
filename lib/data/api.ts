import type {
  Account,
  AppData,
  Category,
  Debt,
  ExpenseFixed,
  ExpenseVariable,
  Id,
  IncomeFixed,
  IncomeOnetime,
  NewRow,
  RowPatch,
  SavingsTransaction,
  Settings,
} from "./types";

/** Generic CRUD for one table. Both the mock and the Supabase layer implement this. */
export interface TableApi<T extends { id: Id }> {
  create(row: NewRow<T>): Promise<T>;
  update(id: Id, patch: RowPatch<T>): Promise<T>;
  remove(id: Id): Promise<void>;
}

export interface DataApi {
  readonly mode: "mock" | "supabase";
  loadAll(): Promise<AppData>;
  updateSettings(patch: RowPatch<Settings>): Promise<Settings>;
  accounts: TableApi<Account>;
  categories: TableApi<Category>;
  incomeFixed: TableApi<IncomeFixed>;
  incomeOnetime: TableApi<IncomeOnetime>;
  expensesFixed: TableApi<ExpenseFixed>;
  expensesVariable: TableApi<ExpenseVariable>;
  debts: TableApi<Debt>;
  savingsTransactions: TableApi<SavingsTransaction>;
}
