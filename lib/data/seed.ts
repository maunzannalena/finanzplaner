import type { AppData } from "./types";
import { addMonths, currentMonthKey, dayInMonth, monthEnd, monthStart, todayISO } from "@/lib/dates";

/**
 * Phase 1 demo data. Dates are generated relative to today so the demo always
 * looks "live". Round placeholder numbers only.
 */
export function buildSeed(): AppData {
  const now = currentMonthKey();
  const m = (n: number) => addMonths(now, n); // n months from now
  const today = todayISO();

  const acc = { sparkasse: "acc-sparkasse", revolut: "acc-revolut", ahorro: "acc-ahorro" };
  // Balances were "taken" at the end of the month before the first tracked month.
  const balanceDate = monthEnd(m(-7));
  const cat = { essen: "cat-essen", freizeit: "cat-freizeit", haushalt: "cat-haushalt" };

  const vari = (
    id: string,
    name: string,
    category_id: string,
    amount: number,
    account_id: string,
    date: string,
    paid_from_savings = false,
  ) => ({ id, name, category_id, amount, account_id, date, paid_from_savings });

  return {
    accounts: [
      { id: acc.sparkasse, name: "Sparkasse", starting_balance: 1200, balance_date: balanceDate },
      { id: acc.revolut, name: "Revolut Privat", starting_balance: 1500, balance_date: balanceDate },
      { id: acc.ahorro, name: "Revolut Sparen", starting_balance: 500, balance_date: balanceDate },
    ],
    categories: [
      { id: cat.essen, name: "Essen" },
      { id: cat.freizeit, name: "Freizeit" },
      { id: cat.haushalt, name: "Haushalt" },
    ],
    settings: { id: "settings", savings_mode: "percentage", savings_value: 10, language: "de", savings_source_account_id: acc.sparkasse, savings_account_id: acc.ahorro },
    incomeFixed: [
      { id: "inc-vater", name: "Vater", amount: 1000, account_id: acc.sparkasse, day_of_month: 1, active: true, valid_from: monthStart(m(-6)), valid_to: null },
      { id: "inc-staat", name: "Staat", amount: 500, account_id: acc.sparkasse, day_of_month: 15, active: true, valid_from: monthStart(m(-6)), valid_to: null },
    ],
    incomeOnetime: [
      { id: "ione-1", name: "Geburtstagsgeld", amount: 100, account_id: acc.revolut, date: dayInMonth(m(-2), 12) },
      { id: "ione-2", name: "Verkauf Fahrrad", amount: 150, account_id: acc.revolut, date: dayInMonth(now, 5) },
    ],
    expensesFixed: [
      { id: "exf-miete", name: "Miete", amount: 700, account_id: acc.sparkasse, day_of_month: 2, active: true, valid_from: monthStart(m(-6)), valid_to: null },
      { id: "exf-neben", name: "Nebenkosten", amount: 150, account_id: acc.revolut, day_of_month: 2, active: true, valid_from: monthStart(m(-6)), valid_to: null },
      { id: "exf-metro", name: "Metro", amount: 50, account_id: acc.sparkasse, day_of_month: 2, active: true, valid_from: monthStart(m(-6)), valid_to: null },
    ],
    expensesVariable: [
      // this month
      vari("ev-1", "Supermarkt", cat.essen, 60, acc.sparkasse, dayInMonth(now, 3)),
      vari("ev-2", "Kino", cat.freizeit, 15, acc.revolut, dayInMonth(now, 6)),
      vari("ev-3", "Wochenmarkt", cat.essen, 25, acc.sparkasse, dayInMonth(now, 8)),
      vari("ev-4", "Neue Lampe", cat.haushalt, 80, acc.revolut, dayInMonth(now, 9), true),
      vari("ev-5", "Café", cat.freizeit, 10, acc.revolut, today),
      // last month
      vari("ev-6", "Supermarkt", cat.essen, 120, acc.sparkasse, dayInMonth(m(-1), 4)),
      vari("ev-7", "Konzert", cat.freizeit, 45, acc.revolut, dayInMonth(m(-1), 15)),
      vari("ev-8", "Drogerie", cat.haushalt, 30, acc.sparkasse, dayInMonth(m(-1), 20)),
      vari("ev-9", "Restaurant", cat.essen, 40, acc.revolut, dayInMonth(m(-1), 27)),
      // two months ago
      vari("ev-10", "Supermarkt", cat.essen, 110, acc.sparkasse, dayInMonth(m(-2), 2)),
      vari("ev-11", "Schwimmbad", cat.freizeit, 20, acc.revolut, dayInMonth(m(-2), 18)),
      // three months ago
      vari("ev-12", "Supermarkt", cat.essen, 130, acc.sparkasse, dayInMonth(m(-3), 5)),
      vari("ev-13", "Museum", cat.freizeit, 12, acc.revolut, dayInMonth(m(-3), 21)),
      vari("ev-14", "Putzmittel", cat.haushalt, 15, acc.sparkasse, dayInMonth(m(-3), 23)),
    ],
    debts: [
      { id: "debt-1", direction: "ana_owes", person: "Lisa", amount: 50, note: "Konzertticket", due_date: dayInMonth(m(1), 1), installments: null, paid_installments: 0, paid: false },
      { id: "debt-2", direction: "owed_to_ana", person: "Max", amount: 120, note: "Ausgeliehen für Fahrradreparatur", due_date: dayInMonth(m(2), 15), installments: 3, paid_installments: 1, paid: false },
    ],
    savingsTransactions: [
      // automatic monthly deposits for the past months (10 % of 1.500 €)
      { id: "sav-1", type: "deposit", amount: 150, note: "", date: monthStart(m(-5)), auto_month: m(-5), expense_id: null, account_id: acc.sparkasse },
      { id: "sav-2", type: "deposit", amount: 150, note: "", date: monthStart(m(-4)), auto_month: m(-4), expense_id: null, account_id: acc.sparkasse },
      { id: "sav-3", type: "deposit", amount: 150, note: "", date: monthStart(m(-3)), auto_month: m(-3), expense_id: null, account_id: acc.sparkasse },
      { id: "sav-4", type: "deposit", amount: 150, note: "", date: monthStart(m(-2)), auto_month: m(-2), expense_id: null, account_id: acc.sparkasse },
      { id: "sav-5", type: "deposit", amount: 150, note: "", date: monthStart(m(-1)), auto_month: m(-1), expense_id: null, account_id: acc.sparkasse },
      { id: "sav-6", type: "withdrawal", amount: 200, note: "Zahnarzt", date: dayInMonth(m(-3), 14), auto_month: null, expense_id: null, account_id: acc.revolut },
      { id: "sav-7", type: "deposit", amount: 50, note: "Rest vom Monat", date: dayInMonth(m(-2), 28), auto_month: null, expense_id: null, account_id: acc.sparkasse },
      // withdrawal linked to the "Neue Lampe" expense paid from savings
      { id: "sav-8", type: "withdrawal", amount: 80, note: "Neue Lampe", date: dayInMonth(now, 9), auto_month: null, expense_id: "ev-4", account_id: acc.revolut },
    ],
  };
}
