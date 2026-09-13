"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import type { ExpenseVariable } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n";
import { accountName, categoryName, useData } from "@/lib/store";
import { earliestMonthKey, monthSummary, sum, variableForMonth } from "@/lib/calc";
import { currentMonthKey, formatDateShort } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { categoryColor } from "@/lib/palette";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { ListRow } from "@/components/ui/ListRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { VariableExpenseForm } from "@/components/forms/VariableExpenseForm";

export default function VariableExpensesPage() {
  const { t, lang } = useI18n();
  const data = useData();
  const [month, setMonth] = useState(currentMonthKey());
  const [cat, setCat] = useState<string>("all");
  const [modal, setModal] = useState<null | { row?: ExpenseVariable }>(null);

  const all = useMemo(() => [...variableForMonth(data, month).all].sort((a, b) => (a.date < b.date ? 1 : -1)), [data, month]);
  const rows = cat === "all" ? all : all.filter((e) => e.category_id === cat);
  const total = sum(rows.map((e) => e.amount));
  const s = monthSummary(data, month);
  const usedCategoryIds = new Set(all.map((e) => e.category_id));

  return (
    <>
      <PageHeader
        title={t("variable.title")}
        subtitle={t("variable.subtitle")}
        action={
          <Button onClick={() => setModal({})}>
            <Plus className="h-4 w-4" /> {t("common.add")}
          </Button>
        }
      />

      <MonthPicker value={month} onChange={setMonth} min={earliestMonthKey(data)} />

      <div className="mt-3 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        <Chip active={cat === "all"} onClick={() => setCat("all")} label={t("common.allCategories")} />
        {data.categories.map((c, i) => (
          <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)} label={c.name} color={categoryColor(i)} dim={!usedCategoryIds.has(c.id)} />
        ))}
      </div>

      <Card className="mt-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-ink-soft">{cat === "all" ? t("variable.totalMonth") : t("variable.totalCategory", { name: categoryName(data.categories, cat) })}</div>
          <div className="mt-1 text-3xl font-extrabold text-primary-dark">{formatMoney(total)}</div>
        </div>
        {cat === "all" && (
          <div className="text-right text-xs font-semibold text-ink-soft">
            <div>{t("variable.fromBudget")}: <span className="tnum text-ink">{formatMoney(s.spent)}</span></div>
            {s.spentFromSavings > 0 && <div>🐷 {t("variable.fromSavings")}: <span className="tnum text-ink">{formatMoney(s.spentFromSavings)}</span></div>}
            <div className={s.remaining < 0 ? "text-danger" : "text-income-dark"}>{t("dashboard.remaining")}: <span className="tnum">{formatMoney(s.remaining)}</span></div>
          </div>
        )}
      </Card>

      <div className="mt-4 flex flex-col gap-2">
        {rows.length === 0 ? (
          <EmptyState icon="🛍️" title={t("variable.empty")} hint={t("variable.emptyHint")} action={<Button onClick={() => setModal({})}>{t("common.add")}</Button>} />
        ) : (
          rows.map((e) => {
            const idx = data.categories.findIndex((c) => c.id === e.category_id);
            return (
              <ListRow
                key={e.id}
                icon={
                  <span className="grid h-10 w-10 place-items-center rounded-2xl text-lg" style={{ background: `${categoryColor(idx)}22` }}>
                    {e.paid_from_savings ? "🐷" : "🛍️"}
                  </span>
                }
                title={e.name}
                meta={`${categoryName(data.categories, e.category_id) || t("common.noCategory")} · ${formatDateShort(e.date, lang)} · ${accountName(data.accounts, e.account_id)}`}
                amount={e.amount}
                amountClass={e.paid_from_savings ? "text-savings-dark" : "text-ink"}
                onClick={() => setModal({ row: e })}
              />
            );
          })
        )}
      </div>

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal?.row ? t("variable.edit") : t("variable.add")}>
        {modal && <VariableExpenseForm initial={modal.row} onClose={() => setModal(null)} defaults={{ date: month === currentMonthKey() ? undefined : `${month}-01` }} />}
      </Modal>
    </>
  );
}

function Chip({ active, onClick, label, color, dim }: { active: boolean; onClick: () => void; label: string; color?: string; dim?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-bold transition ${
        active ? "border-ink bg-ink text-cream" : "border-line bg-card text-ink-soft hover:text-ink"
      } ${dim && !active ? "opacity-60" : ""}`}
    >
      {color && <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />}
      {label}
    </button>
  );
}
