"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { FixedRow, IncomeOnetime } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n";
import { accountName, useData } from "@/lib/store";
import { currentFixedRows, incomeForMonth, sum } from "@/lib/calc";
import { currentMonthKey, formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { PageHeader, SectionTitle } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { Modal } from "@/components/ui/Modal";
import { ListRow } from "@/components/ui/ListRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { FixedRowForm } from "@/components/forms/FixedRowForm";
import { OnetimeIncomeForm } from "@/components/forms/OnetimeIncomeForm";

type ModalState = null | { kind: "fixed"; row?: FixedRow } | { kind: "onetime"; row?: IncomeOnetime };

export default function IncomePage() {
  const { t, lang } = useI18n();
  const data = useData();
  const [modal, setModal] = useState<ModalState>(null);
  const key = currentMonthKey();
  const fixed = currentFixedRows(data.incomeFixed).sort((a, b) => a.day_of_month - b.day_of_month);
  const onetime = [...data.incomeOnetime].sort((a, b) => (a.date < b.date ? 1 : -1));
  const inc = incomeForMonth(data, key);
  const close = () => setModal(null);

  return (
    <>
      <PageHeader title={t("income.title")} subtitle={t("income.subtitle")} />

      <div className="grid grid-cols-2 gap-3">
        <StatTile label={t("income.monthlyFixed")} value={sum(fixed.filter((r) => r.active).map((r) => r.amount))} tone="income" />
        <StatTile label={t("income.thisMonthTotal")} value={inc.total} tone="neutral" hint={t("income.inclOnetime", { amount: formatMoney(inc.onetime) })} />
      </div>

      <SectionTitle
        right={
          <Button size="sm" variant="income" onClick={() => setModal({ kind: "fixed" })}>
            <Plus className="h-4 w-4" /> {t("common.add")}
          </Button>
        }
      >
        {t("income.fixed")}
      </SectionTitle>
      {fixed.length === 0 ? (
        <EmptyState icon="💶" title={t("income.emptyFixed")} hint={t("income.emptyFixedHint")} />
      ) : (
        <div className="flex flex-col gap-2">
          {fixed.map((r) => (
            <ListRow
              key={r.id}
              icon="🔁"
              title={r.name}
              meta={`${t("common.dayOfMonth", { day: r.day_of_month })} · ${accountName(data.accounts, r.account_id)}`}
              amount={r.amount}
              amountClass="text-income-dark"
              muted={!r.active}
              badge={!r.active ? <span className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-bold text-ink-muted">{t("common.paused")}</span> : undefined}
              onClick={() => setModal({ kind: "fixed", row: r })}
            />
          ))}
        </div>
      )}

      <SectionTitle
        right={
          <Button size="sm" variant="income" onClick={() => setModal({ kind: "onetime" })}>
            <Plus className="h-4 w-4" /> {t("common.add")}
          </Button>
        }
      >
        {t("income.onetime")}
      </SectionTitle>
      {onetime.length === 0 ? (
        <EmptyState icon="🎁" title={t("income.emptyOnetime")} hint={t("income.emptyOnetimeHint")} />
      ) : (
        <div className="flex flex-col gap-2">
          {onetime.map((r) => (
            <ListRow
              key={r.id}
              icon="🎁"
              title={r.name}
              meta={`${formatDate(r.date, lang)} · ${accountName(data.accounts, r.account_id)}`}
              amount={r.amount}
              amountClass="text-income-dark"
              onClick={() => setModal({ kind: "onetime", row: r })}
            />
          ))}
        </div>
      )}

      <Modal open={modal?.kind === "fixed"} onClose={close} title={modal?.row ? t("income.editFixed") : t("income.addFixed")}>
        {modal?.kind === "fixed" && <FixedRowForm kind="income" initial={modal.row} onClose={close} />}
      </Modal>
      <Modal open={modal?.kind === "onetime"} onClose={close} title={modal?.row ? t("income.editOnetime") : t("income.addOnetime")}>
        {modal?.kind === "onetime" && <OnetimeIncomeForm initial={modal.row} onClose={close} />}
      </Modal>
    </>
  );
}
