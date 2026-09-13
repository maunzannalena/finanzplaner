"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, HandCoins, Landmark, PiggyBank, Plus, Receipt, TrendingUp, TriangleAlert, Wallet } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useData } from "@/lib/store";
import { accountBalance, monthSummary, savingsBalance, sum, variableForMonth } from "@/lib/calc";
import { currentMonthKey, formatDateShort, formatMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { categoryName } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, PageHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { Modal } from "@/components/ui/Modal";
import { ListRow } from "@/components/ui/ListRow";
import { VariableExpenseForm } from "@/components/forms/VariableExpenseForm";
import { SpendFromSavingsForm } from "@/components/forms/SavingsForms";

export default function DashboardPage() {
  const { t, lang } = useI18n();
  const data = useData();
  const key = currentMonthKey();
  const s = monthSummary(data, key);
  const balance = savingsBalance(data.savingsTransactions);
  const [modal, setModal] = useState<null | "expense" | "spend">(null);

  const pct = s.free > 0 ? Math.min(100, (s.spent / s.free) * 100) : s.spent > 0 ? 100 : 0;
  const tone = s.over ? "danger" : pct >= 80 ? "warn" : "good";
  const bar = { good: "bg-good", warn: "bg-warn", danger: "bg-danger" }[tone];
  const track = { good: "bg-good-soft", warn: "bg-warn-soft", danger: "bg-danger-soft" }[tone];
  const text = { good: "text-income-dark", warn: "text-warn", danger: "text-danger" }[tone];

  const recent = [...variableForMonth(data, key).all].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5);
  const open = data.debts.filter((d) => !d.paid);
  const iOwe = sum(open.filter((d) => d.direction === "ana_owes").map((d) => d.amount));
  const owedToMe = sum(open.filter((d) => d.direction === "owed_to_ana").map((d) => d.amount));

  return (
    <>
      <PageHeader title={t("dashboard.greeting")} subtitle={formatMonth(key, lang)} />

      <div className="grid grid-cols-2 gap-3">
        <StatTile label={t("dashboard.income")} value={s.income} tone="income" icon={<TrendingUp className="h-4 w-4" />} />
        <StatTile label={t("dashboard.fixedExpenses")} value={s.fixedExpenses} tone="fixed" icon={<Receipt className="h-4 w-4" />} />
        <StatTile label={t("dashboard.setAside")} value={s.saved} tone="savings" icon={<PiggyBank className="h-4 w-4" />} />
        <StatTile label={t("dashboard.free")} value={s.free} tone="primary" icon={<Wallet className="h-4 w-4" />} hint={t("dashboard.freeHint")} />
      </div>

      <div className="mt-5 mb-2 flex items-center justify-between px-1">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-muted">{t("dashboard.accounts")}</h2>
        <Link href="/accounts" className="flex items-center gap-1 text-sm font-bold text-primary-dark">
          {t("common.details")} <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
        {data.accounts.map((a) => {
          const b = accountBalance(data, a.id);
          const isSavings = a.id === data.settings.savings_account_id;
          return (
            <Link
              key={a.id}
              href="/accounts"
              className={`flex items-center justify-between gap-2 rounded-2xl px-4 py-3 shadow-card transition hover:bg-cream/70 sm:flex-col sm:items-start sm:gap-1 ${isSavings ? "bg-savings-soft" : "bg-card"}`}
            >
              <span className="flex min-w-0 items-center gap-2 text-sm font-bold text-ink-soft">
                <Landmark className="h-4 w-4 shrink-0" />
                <span className="truncate">{a.name}</span>
              </span>
              <span className={`shrink-0 text-lg font-extrabold tnum ${b < 0 ? "text-danger" : isSavings ? "text-savings-dark" : "text-ink"}`}>{formatMoney(b)}</span>
            </Link>
          );
        })}
      </div>

      {s.over && (
        <div className="mt-4 flex items-start gap-3 rounded-3xl border border-danger/30 bg-danger-soft px-4 py-3 text-danger">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <div className="font-extrabold">{t("dashboard.overTitle")}</div>
            <div className="text-sm">{t("dashboard.overText", { amount: formatMoney(s.spent - s.free) })}</div>
          </div>
        </div>
      )}

      <Card className="mt-4">
        <CardTitle
          action={
            <Button size="sm" onClick={() => setModal("expense")}>
              <Plus className="h-4 w-4" /> {t("dashboard.addExpense")}
            </Button>
          }
        >
          {t("dashboard.spentTitle")}
        </CardTitle>
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className={`text-3xl font-extrabold leading-none ${text}`}>{formatMoney(s.spent)}</div>
            <div className="mt-1 text-sm text-ink-soft">{t("dashboard.ofFree", { amount: formatMoney(s.free) })}</div>
          </div>
          <div className="text-right">
            <div className={`text-lg font-extrabold ${text}`}>{s.remaining >= 0 ? formatMoney(s.remaining) : `− ${formatMoney(-s.remaining)}`}</div>
            <div className="text-xs text-ink-soft">{s.remaining >= 0 ? t("dashboard.remaining") : t("dashboard.overBy")}</div>
          </div>
        </div>
        <div className={`mt-3 h-4 w-full overflow-hidden rounded-full ${track}`} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs font-semibold text-ink-soft">
          <span>{Math.round(pct)} %</span>
          <span className={`flex items-center gap-1 ${text}`}>
            {tone === "good" && `✅ ${t("dashboard.statusGood")}`}
            {tone === "warn" && `⚠️ ${t("dashboard.statusWarn")}`}
            {tone === "danger" && `🚨 ${t("dashboard.statusOver")}`}
          </span>
        </div>
        {s.spentFromSavings > 0 && (
          <div className="mt-3 rounded-2xl bg-savings-soft px-3 py-2 text-xs font-semibold text-savings-dark">
            🐷 {t("dashboard.fromSavingsNote", { amount: formatMoney(s.spentFromSavings) })}
          </div>
        )}
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card className="bg-savings text-ink">
          <div className="flex items-center gap-2 text-sm font-bold text-savings-dark">
            <PiggyBank className="h-4 w-4" /> {t("dashboard.savingsTotal")}
          </div>
          <div className="mt-2 text-4xl font-extrabold leading-none">{formatMoney(balance)}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="white" onClick={() => setModal("spend")}>
              {t("savings.spendAction")}
            </Button>
            <Link href="/savings" className="inline-flex h-9 items-center gap-1 rounded-2xl px-3 text-sm font-bold text-savings-dark hover:bg-white/40">
              {t("common.details")} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </Card>

        <Card>
          <CardTitle
            action={
              <Link href="/debts" className="flex items-center gap-1 text-sm font-bold text-primary-dark">
                {t("common.all")} <ChevronRight className="h-4 w-4" />
              </Link>
            }
          >
            <span className="flex items-center gap-2">
              <HandCoins className="h-5 w-5 text-ink-soft" /> {t("dashboard.openDebts")}
            </span>
          </CardTitle>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-danger-soft p-3">
              <div className="text-xs font-bold text-danger">{t("debts.iOwe")}</div>
              <div className="mt-1 text-xl font-extrabold text-danger">{formatMoney(iOwe)}</div>
            </div>
            <div className="rounded-2xl bg-income-soft p-3">
              <div className="text-xs font-bold text-income-dark">{t("debts.owedToMe")}</div>
              <div className="mt-1 text-xl font-extrabold text-income-dark">{formatMoney(owedToMe)}</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 mb-2 flex items-center justify-between px-1">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-muted">{t("dashboard.recent")}</h2>
        <Link href="/expenses" className="flex items-center gap-1 text-sm font-bold text-primary-dark">
          {t("common.all")} <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      {recent.length === 0 ? (
        <p className="px-1 text-sm text-ink-soft">{t("dashboard.noExpenses")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {recent.map((e) => (
            <ListRow
              key={e.id}
              icon={e.paid_from_savings ? "🐷" : "🛍️"}
              title={e.name}
              meta={`${categoryName(data.categories, e.category_id) || t("common.noCategory")} · ${formatDateShort(e.date, lang)}`}
              amount={e.amount}
              amountClass="text-ink"
            />
          ))}
        </div>
      )}

      <Modal open={modal === "expense"} onClose={() => setModal(null)} title={t("variable.add")}>
        <VariableExpenseForm onClose={() => setModal(null)} />
      </Modal>
      <Modal open={modal === "spend"} onClose={() => setModal(null)} title={t("savings.spendAction")}>
        <SpendFromSavingsForm onClose={() => setModal(null)} />
      </Modal>
    </>
  );
}
