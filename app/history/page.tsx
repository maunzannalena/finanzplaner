"use client";

import { useMemo, useState } from "react";
import { PiggyBank, Receipt, TrendingUp, Wallet } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { accountName, categoryName, useData } from "@/lib/store";
import { categoryTotals, earliestMonthKey, monthSummary, transactionsForMonth, type Tx } from "@/lib/calc";
import { currentMonthKey, formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { OTHER_COLOR, categoryColor } from "@/lib/palette";
import { Card, CardTitle, PageHeader, SectionTitle } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { EmptyState } from "@/components/ui/EmptyState";
import { CategoryChart, type CategoryBar } from "@/components/charts/CategoryChart";

const MAX_BARS = 7;

export default function HistoryPage() {
  const { t, lang } = useI18n();
  const data = useData();
  const [month, setMonth] = useState(currentMonthKey());
  const s = monthSummary(data, month);
  const expenses = s.fixedExpenses + s.spent;
  const left = s.income - expenses - s.saved;

  const totals = useMemo(() => categoryTotals(data, month), [data, month]);
  const bars: CategoryBar[] = useMemo(() => {
    const named = totals.map((ct) => ({
      name: ct.category?.name ?? t("common.noCategory"),
      total: ct.total,
      color: ct.category ? categoryColor(data.categories.findIndex((c) => c.id === ct.category!.id)) : OTHER_COLOR,
    }));
    if (named.length <= MAX_BARS) return named;
    const head = named.slice(0, MAX_BARS - 1);
    const rest = named.slice(MAX_BARS - 1).reduce((a, b) => a + b.total, 0);
    return [...head, { name: t("history.other"), total: rest, color: OTHER_COLOR }];
  }, [totals, data.categories, t]);
  const grand = totals.reduce((a, b) => a + b.total, 0);

  const txs = useMemo(() => transactionsForMonth(data, month), [data, month]);
  const byDay = useMemo(() => {
    const m = new Map<string, Tx[]>();
    for (const tx of txs) m.set(tx.date, [...(m.get(tx.date) ?? []), tx]);
    return [...m.entries()];
  }, [txs]);

  const style = (tx: Tx): { icon: string; cls: string; sign: string; note?: string } => {
    switch (tx.kind) {
      case "income_fixed":
        return { icon: "🔁", cls: "text-income-dark", sign: "+" };
      case "income_onetime":
        return { icon: "🎁", cls: "text-income-dark", sign: "+" };
      case "expense_fixed":
        return { icon: "🧾", cls: "text-fixed-dark", sign: "−" };
      case "expense_variable":
        return { icon: tx.paid_from_savings ? "🐷" : "🛍️", cls: tx.paid_from_savings ? "text-savings-dark" : "text-ink", sign: "−", note: tx.paid_from_savings ? t("variable.fromSavings") : undefined };
      case "savings_deposit":
        return { icon: "⬇️", cls: "text-savings-dark", sign: "→", note: t("savings.deposit") };
      case "savings_withdrawal":
        return { icon: "⬆️", cls: "text-savings-dark", sign: "←", note: t("savings.withdrawal") };
    }
  };

  const nameOf = (tx: Tx) => {
    if (tx.kind === "savings_deposit" && tx.auto) return t("savings.autoDepositShort");
    return tx.name || t("common.untitled");
  };

  return (
    <>
      <PageHeader title={t("history.title")} subtitle={t("history.subtitle")} />
      <MonthPicker value={month} onChange={setMonth} min={earliestMonthKey(data)} />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatTile label={t("history.income")} value={s.income} tone="income" icon={<TrendingUp className="h-4 w-4" />} />
        <StatTile label={t("history.expenses")} value={expenses} tone="fixed" icon={<Receipt className="h-4 w-4" />} hint={t("history.expensesHint", { fixed: formatMoney(s.fixedExpenses), variable: formatMoney(s.spent) })} />
        <StatTile label={t("history.saved")} value={s.saved} tone="savings" icon={<PiggyBank className="h-4 w-4" />} />
        <StatTile label={t("history.left")} value={left} tone={left < 0 ? "danger" : "good"} icon={<Wallet className="h-4 w-4" />} />
      </div>
      {s.spentFromSavings > 0 && (
        <div className="mt-3 rounded-2xl bg-savings-soft px-4 py-2 text-sm font-semibold text-savings-dark">
          🐷 {t("dashboard.fromSavingsNote", { amount: formatMoney(s.spentFromSavings) })}
        </div>
      )}

      <Card className="mt-4">
        <CardTitle>{t("history.byCategory")}</CardTitle>
        {bars.length === 0 ? (
          <p className="text-sm text-ink-soft">{t("history.noVariable")}</p>
        ) : (
          <>
            <CategoryChart bars={bars} />
            <ul className="mt-3 divide-y divide-line">
              {bars.map((b) => (
                <li key={b.name} className="flex items-center gap-3 py-2 text-sm">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: b.color }} />
                  <span className="flex-1 font-bold">{b.name}</span>
                  <span className="text-xs text-ink-muted">{grand > 0 ? Math.round((b.total / grand) * 100) : 0} %</span>
                  <span className="w-24 text-right font-extrabold tnum">{formatMoney(b.total)}</span>
                </li>
              ))}
              <li className="flex items-center gap-3 py-2 text-sm">
                <span className="h-3 w-3 shrink-0" />
                <span className="flex-1 font-bold text-ink-soft">{t("common.total")}</span>
                <span className="w-24 text-right font-extrabold tnum">{formatMoney(grand)}</span>
              </li>
            </ul>
          </>
        )}
      </Card>

      <SectionTitle>{t("history.transactions")}</SectionTitle>
      {txs.length === 0 ? (
        <EmptyState icon="📭" title={t("history.noTransactions")} />
      ) : (
        <div className="flex flex-col gap-3">
          {byDay.map(([date, list]) => (
            <div key={date}>
              <div className="mb-1 px-1 text-xs font-bold text-ink-muted">{formatDate(date, lang)}</div>
              <div className="overflow-hidden rounded-3xl bg-card shadow-card">
                {list.map((tx) => {
                  const st = style(tx);
                  const meta = [
                    st.note,
                    tx.category_id ? categoryName(data.categories, tx.category_id) : null,
                    tx.account_id ? accountName(data.accounts, tx.account_id) : null,
                  ].filter(Boolean);
                  return (
                    <div key={tx.id} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-cream text-base">{st.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">{nameOf(tx)}</span>
                        {meta.length > 0 && <span className="block truncate text-xs text-ink-soft">{meta.join(" · ")}</span>}
                      </span>
                      <span className={`shrink-0 text-sm font-extrabold tnum ${st.cls}`}>
                        {st.sign} {formatMoney(tx.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
