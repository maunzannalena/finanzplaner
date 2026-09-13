"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { FixedRow } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n";
import { accountName, useData } from "@/lib/store";
import { currentFixedRows, incomeForMonth, sum } from "@/lib/calc";
import { currentMonthKey } from "@/lib/dates";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { Modal } from "@/components/ui/Modal";
import { ListRow } from "@/components/ui/ListRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { FixedRowForm } from "@/components/forms/FixedRowForm";
import { iconFor } from "@/lib/icons";

export default function FixedExpensesPage() {
  const { t } = useI18n();
  const data = useData();
  const [modal, setModal] = useState<null | { row?: FixedRow }>(null);
  const rows = currentFixedRows(data.expensesFixed).sort((a, b) => a.day_of_month - b.day_of_month);
  const total = sum(rows.filter((r) => r.active).map((r) => r.amount));
  const income = incomeForMonth(data, currentMonthKey()).total;
  const share = income > 0 ? Math.round((total / income) * 100) : null;

  return (
    <>
      <PageHeader
        title={t("fixed.title")}
        subtitle={t("fixed.subtitle")}
        action={
          <Button onClick={() => setModal({})}>
            <Plus className="h-4 w-4" /> {t("common.add")}
          </Button>
        }
      />

      <StatTile label={t("fixed.perMonth")} value={total} tone="fixed" big hint={share !== null ? t("fixed.shareOfIncome", { pct: share }) : undefined} />

      <div className="mt-4 flex flex-col gap-2">
        {rows.length === 0 ? (
          <EmptyState icon="🧾" title={t("fixed.empty")} hint={t("fixed.emptyHint")} action={<Button onClick={() => setModal({})}>{t("common.add")}</Button>} />
        ) : (
          rows.map((r) => (
            <ListRow
              key={r.id}
              icon={iconFor(r.name)}
              title={r.name}
              meta={`${t("common.dayOfMonth", { day: r.day_of_month })} · ${accountName(data.accounts, r.account_id)}`}
              amount={r.amount}
              amountClass="text-fixed-dark"
              muted={!r.active}
              badge={!r.active ? <span className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-bold text-ink-muted">{t("common.paused")}</span> : undefined}
              onClick={() => setModal({ row: r })}
            />
          ))
        )}
      </div>

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal?.row ? t("fixed.edit") : t("fixed.add")}>
        {modal && <FixedRowForm kind="expense" initial={modal.row} onClose={() => setModal(null)} />}
      </Modal>
    </>
  );
}
