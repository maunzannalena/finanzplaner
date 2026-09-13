"use client";

import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, PiggyBank } from "lucide-react";
import type { SavingsTransaction } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n";
import { accountName, useData } from "@/lib/store";
import { accountBalance, savingsBalance, savingsSeries } from "@/lib/calc";
import { useIsNarrow } from "@/lib/useIsNarrow";
import { formatDate, formatMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, PageHeader, SectionTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { ListRow } from "@/components/ui/ListRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { SavingsChart } from "@/components/charts/SavingsChart";
import { SavingsSettingsCard } from "@/components/settings/SavingsSettingsCard";
import { DepositForm, SavingsTxForm, SpendFromSavingsForm } from "@/components/forms/SavingsForms";

type ModalState = null | { kind: "deposit" } | { kind: "spend" } | { kind: "edit"; tx: SavingsTransaction };

export default function SavingsPage() {
  const { t, lang } = useI18n();
  const data = useData();
  const [modal, setModal] = useState<ModalState>(null);
  const narrow = useIsNarrow();
  const balance = savingsBalance(data.savingsTransactions);
  const series = savingsSeries(data, narrow ? 6 : 12);
  const deposits = data.savingsTransactions.filter((x) => x.type === "deposit").reduce((a, x) => a + x.amount, 0);
  const txs = [...data.savingsTransactions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, 40);
  const savingsAccount = data.accounts.find((a) => a.id === data.settings.savings_account_id);

  const meta = (tx: SavingsTransaction) => {
    const acc = accountName(data.accounts, tx.account_id);
    if (!acc) return formatDate(tx.date, lang);
    return `${formatDate(tx.date, lang)} · ${tx.type === "deposit" ? t("savings.fromAccountShort", { account: acc }) : t("savings.toAccountShort", { account: acc })}`;
  };

  const label = (tx: SavingsTransaction) => {
    if (tx.auto_month) return t("savings.autoDeposit", { month: formatMonth(tx.auto_month, lang) });
    if (tx.expense_id) return `${t("savings.expense")}: ${tx.note}`;
    return tx.note || (tx.type === "deposit" ? t("savings.deposit") : t("savings.withdrawal"));
  };

  return (
    <>
      <PageHeader title={t("savings.title")} subtitle={t("savings.subtitle")} />

      <Card className="bg-savings text-ink">
        <div className="flex items-center gap-2 text-sm font-bold text-savings-dark">
          <PiggyBank className="h-5 w-5" /> {t("savings.balance")}
        </div>
        <div className="mt-2 text-5xl font-extrabold leading-none">{formatMoney(balance)}</div>
        <div className="mt-2 text-xs font-semibold text-savings-dark">{t("savings.totalDeposited", { amount: formatMoney(deposits) })}</div>
        {savingsAccount && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/50 px-3 py-1 text-xs font-bold text-savings-dark">
            🏦 {t("savings.accountBalance", { account: savingsAccount.name })}: <span className="tnum">{formatMoney(accountBalance(data, savingsAccount.id))}</span>
          </div>
        )}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button variant="glass" onClick={() => setModal({ kind: "deposit" })}>
            <ArrowDownToLine className="h-4 w-4" /> {t("savings.depositAction")}
          </Button>
          <Button variant="white" onClick={() => setModal({ kind: "spend" })}>
            <ArrowUpFromLine className="h-4 w-4" /> {t("savings.spendAction")}
          </Button>
        </div>
      </Card>

      <div className="mt-4">
        <SavingsSettingsCard />
      </div>

      <Card className="mt-4">
        <CardTitle>{t("savings.chartTitle")}</CardTitle>
        <SavingsChart series={series} />
      </Card>

      <SectionTitle>{t("savings.transactions")}</SectionTitle>
      {txs.length === 0 ? (
        <EmptyState icon="🐷" title={t("savings.emptyTx")} />
      ) : (
        <div className="flex flex-col gap-2">
          {txs.map((tx) => (
            <ListRow
              key={tx.id}
              icon={tx.type === "deposit" ? "⬇️" : "⬆️"}
              title={label(tx)}
              meta={meta(tx)}
              amount={tx.amount}
              amountClass={tx.type === "deposit" ? "text-savings-dark" : "text-primary-dark"}
              badge={tx.auto_month ? <span className="rounded-full bg-savings-soft px-2 py-0.5 text-[10px] font-bold text-savings-dark">{t("savings.auto")}</span> : undefined}
              onClick={() => setModal({ kind: "edit", tx })}
            />
          ))}
        </div>
      )}

      <Modal open={modal?.kind === "deposit"} onClose={() => setModal(null)} title={t("savings.depositAction")}>
        <DepositForm onClose={() => setModal(null)} />
      </Modal>
      <Modal open={modal?.kind === "spend"} onClose={() => setModal(null)} title={t("savings.spendAction")}>
        <SpendFromSavingsForm onClose={() => setModal(null)} />
      </Modal>
      <Modal open={modal?.kind === "edit"} onClose={() => setModal(null)} title={t("savings.editTx")}>
        {modal?.kind === "edit" && <SavingsTxForm tx={modal.tx} onClose={() => setModal(null)} />}
      </Modal>
    </>
  );
}
