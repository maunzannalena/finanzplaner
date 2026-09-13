"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Landmark, Pencil, Plus } from "lucide-react";
import type { Account } from "@/lib/data/types";
import { useI18n, type TKey } from "@/lib/i18n";
import { accountName, useData } from "@/lib/store";
import { accountBalance, accountLog, type Movement } from "@/lib/calc";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { Button, IconButton } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { AccountForm } from "@/components/forms/AccountForm";

const PREVIEW = 8;

const KIND_ICON: Record<Movement["kind"], string> = {
  income_fixed: "🔁",
  income_onetime: "🎁",
  expense_fixed: "🧾",
  expense_variable: "🛍️",
  savings_out: "🐷",
  savings_in: "⬇️",
  withdrawal_out: "⬆️",
  withdrawal_in: "🐷",
};

const KIND_LABEL: Partial<Record<Movement["kind"], TKey>> = {
  savings_out: "accounts.kind.savings_out",
  savings_in: "accounts.kind.savings_in",
  withdrawal_out: "accounts.kind.withdrawal_out",
  withdrawal_in: "accounts.kind.withdrawal_in",
};

export default function AccountsPage() {
  const { t } = useI18n();
  const data = useData();
  const [modal, setModal] = useState<null | { row?: Account }>(null);

  return (
    <>
      <PageHeader
        title={t("accounts.title")}
        subtitle={t("accounts.subtitle")}
        action={
          <Button onClick={() => setModal({})}>
            <Plus className="h-4 w-4" /> {t("common.add")}
          </Button>
        }
      />

      {data.accounts.length === 0 ? (
        <EmptyState icon="🏦" title={t("accounts.empty")} action={<Button onClick={() => setModal({})}>{t("common.add")}</Button>} />
      ) : (
        <div className="flex flex-col gap-4">
          {data.accounts.map((a) => (
            <AccountCard key={a.id} account={a} onEdit={() => setModal({ row: a })} />
          ))}
        </div>
      )}

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal?.row ? t("accounts.edit") : t("accounts.add")}>
        {modal && <AccountForm initial={modal.row} onClose={() => setModal(null)} />}
      </Modal>
    </>
  );
}

function AccountCard({ account, onEdit }: { account: Account; onEdit: () => void }) {
  const { t, lang } = useI18n();
  const data = useData();
  const [expanded, setExpanded] = useState(false);
  const balance = accountBalance(data, account.id);
  const log = accountLog(data, account.id);
  const shown = expanded ? log : log.slice(0, PREVIEW);
  const isSavings = account.id === data.settings.savings_account_id;

  const title = (m: Movement) => {
    const key = KIND_LABEL[m.kind];
    if (m.auto) return t("savings.autoDepositShort");
    if (key) return m.name ? `${t(key)}: ${m.name}` : t(key);
    return m.name;
  };

  return (
    <Card className={isSavings ? "bg-savings-soft" : ""}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-bold text-ink-soft">
            <Landmark className="h-4 w-4" />
            <span className="truncate">{account.name}</span>
            {isSavings && <span className="rounded-full bg-savings px-2 py-0.5 text-[10px] font-bold text-savings-dark">{t("accounts.savingsBadge")}</span>}
          </div>
          <div className={`mt-1 text-3xl font-extrabold leading-none tnum ${balance < 0 ? "text-danger" : isSavings ? "text-savings-dark" : "text-ink"}`}>{formatMoney(balance)}</div>
          <div className="mt-1.5 text-xs text-ink-soft">{t("accounts.startingInfo", { amount: formatMoney(account.starting_balance), date: formatDate(account.balance_date, lang) })}</div>
        </div>
        <IconButton onClick={onEdit} aria-label={t("accounts.edit")} className="bg-card">
          <Pencil className="h-4 w-4" />
        </IconButton>
      </div>

      <div className="mt-4 text-xs font-extrabold uppercase tracking-wide text-ink-muted">{t("accounts.log")}</div>
      {log.length === 0 ? (
        <p className="mt-1 text-sm text-ink-soft">{t("accounts.noMovements")}</p>
      ) : (
        <ul className="mt-1 divide-y divide-line">
          {shown.map(({ movement: m, balanceAfter }) => (
            <li key={m.id} className="flex items-center gap-3 py-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-card text-sm">{KIND_ICON[m.kind]}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{title(m)}</span>
                <span className="block text-xs text-ink-soft">
                  {formatDate(m.date, lang)}
                  {m.counterparty && ` · ${accountName(data.accounts, m.counterparty)}`}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className={`block text-sm font-extrabold tnum ${m.amount >= 0 ? "text-income-dark" : "text-ink"}`}>
                  {m.amount >= 0 ? "+" : "−"} {formatMoney(Math.abs(m.amount))}
                </span>
                <span className="block text-[11px] text-ink-muted tnum">{t("accounts.balanceAfter")} {formatMoney(balanceAfter)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {log.length > PREVIEW && (
        <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-2 flex items-center gap-1 text-sm font-bold text-primary-dark">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {expanded ? t("accounts.showLess") : t("accounts.showAll", { n: log.length })}
        </button>
      )}
    </Card>
  );
}
