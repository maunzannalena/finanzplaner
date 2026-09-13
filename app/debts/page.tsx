"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import type { Debt, DebtDirection } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n";
import { useData, useStore } from "@/lib/store";
import { sum } from "@/lib/calc";
import { formatDate, todayISO } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { PageHeader, SectionTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { ListRow } from "@/components/ui/ListRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { DebtForm } from "@/components/forms/DebtForm";

export default function DebtsPage() {
  const { t, lang } = useI18n();
  const data = useData();
  const { updateDebt } = useStore();
  const [modal, setModal] = useState<null | { row?: Debt; direction: DebtDirection }>(null);
  const today = todayISO();

  const section = (direction: DebtDirection) => {
    const rows = data.debts
      .filter((d) => d.direction === direction)
      .sort((a, b) => Number(a.paid) - Number(b.paid) || (a.due_date ?? "9999") .localeCompare(b.due_date ?? "9999"));
    const openTotal = sum(rows.filter((d) => !d.paid).map((d) => d.amount));
    const isOwe = direction === "ana_owes";
    const tone = isOwe ? "text-danger" : "text-income-dark";
    const soft = isOwe ? "bg-danger-soft" : "bg-income-soft";
    return (
      <>
        <SectionTitle
          right={
            <Button size="sm" variant={isOwe ? "primary" : "income"} onClick={() => setModal({ direction })}>
              <Plus className="h-4 w-4" /> {t("common.add")}
            </Button>
          }
        >
          {isOwe ? t("debts.iOwe") : t("debts.owedToMe")}
        </SectionTitle>
        <div className={`mb-3 flex items-center justify-between rounded-3xl px-5 py-4 ${soft}`}>
          <span className={`text-sm font-bold ${tone}`}>{t("debts.openTotal")}</span>
          <span className={`text-2xl font-extrabold ${tone}`}>{formatMoney(openTotal)}</span>
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={isOwe ? "🤝" : "💌"} title={t("debts.empty")} hint={isOwe ? t("debts.emptyOweHint") : t("debts.emptyOwedHint")} />
        ) : (
          <div className="flex flex-col gap-2">
            {rows.map((d) => {
              const overdue = !d.paid && d.due_date !== null && d.due_date < today;
              const metaParts = [
                d.note,
                d.due_date ? `${t("debts.due")} ${formatDate(d.due_date, lang)}` : null,
                d.installments ? t("debts.installmentsInfo", { n: d.installments, amount: formatMoney(d.amount / d.installments) }) : null,
              ].filter(Boolean);
              return (
                <ListRow
                  key={d.id}
                  icon={isOwe ? "🤝" : "💌"}
                  title={d.person}
                  meta={metaParts.join(" · ")}
                  amount={d.amount}
                  amountClass={d.paid ? "text-ink-muted" : tone}
                  muted={d.paid}
                  badge={overdue ? <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[10px] font-bold text-danger">{t("debts.overdue")}</span> : undefined}
                  onClick={() => setModal({ row: d, direction })}
                  right={
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={d.paid}
                      aria-label={t("debts.paid")}
                      onClick={() => void updateDebt(d.id, { paid: !d.paid })}
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 transition ${
                        d.paid ? "border-income-dark bg-income-dark text-white" : "border-line bg-card text-transparent hover:border-income-dark"
                      }`}
                    >
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </button>
                  }
                />
              );
            })}
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <PageHeader title={t("debts.title")} subtitle={t("debts.subtitle")} />
      {section("ana_owes")}
      {section("owed_to_ana")}
      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal?.row ? t("debts.edit") : t("debts.add")}>
        {modal && <DebtForm initial={modal.row} defaultDirection={modal.direction} onClose={() => setModal(null)} />}
      </Modal>
    </>
  );
}
