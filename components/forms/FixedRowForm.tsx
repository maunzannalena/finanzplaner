"use client";

import { useState, type FormEvent } from "react";
import type { FixedRow } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n";
import { useData, useStore, type FixedKind } from "@/lib/store";
import { amountToInput, parseAmount } from "@/lib/format";
import { currentMonthKey, monthStart } from "@/lib/dates";
import { Button } from "@/components/ui/Button";
import { AmountInput, Checkbox, Field, FormActions, Select, TextInput } from "@/components/ui/Field";
import { DeleteButton } from "@/components/ui/DeleteButton";

export function FixedRowForm({ kind, initial, onClose }: { kind: FixedKind; initial?: FixedRow; onClose: () => void }) {
  const { t } = useI18n();
  const { accounts } = useData();
  const { addFixed, updateFixed, removeFixed } = useStore();
  const [name, setName] = useState(initial?.name ?? "");
  const [amount, setAmount] = useState(amountToInput(initial?.amount));
  const [accountId, setAccountId] = useState(initial?.account_id ?? accounts[0]?.id ?? "");
  const [day, setDay] = useState(String(initial?.day_of_month ?? 1));
  const [active, setActive] = useState(initial?.active ?? true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const amt = parseAmount(amount);
    const d = Number(day);
    if (!name.trim()) return setErr(t("form.errName"));
    if (amt === null || amt <= 0) return setErr(t("form.errAmount"));
    if (!Number.isInteger(d) || d < 1 || d > 31) return setErr(t("form.errDay"));
    setBusy(true);
    const row = { name: name.trim(), amount: amt, account_id: accountId || null, day_of_month: d, active };
    if (initial) await updateFixed(kind, initial.id, row);
    else await addFixed(kind, row);
    setBusy(false);
    onClose();
  };

  return (
    <form onSubmit={submit}>
      <Field label={t("form.name")}>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === "income" ? t("income.namePlaceholder") : t("fixed.namePlaceholder")} autoFocus />
      </Field>
      <Field label={t("form.amount")}>
        <AmountInput value={amount} onChange={setAmount} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("form.account")}>
          <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
        </Field>
        <Field label={t("form.dayOfMonth")}>
          <TextInput type="number" inputMode="numeric" min={1} max={31} value={day} onChange={(e) => setDay(e.target.value)} />
        </Field>
      </div>
      <Checkbox checked={active} onChange={setActive} label={t("form.active")} hint={t("form.activeHint")} />
      {initial && initial.valid_from < monthStart(currentMonthKey()) && (
        <p className="mb-4 rounded-2xl bg-cream px-4 py-3 text-xs text-ink-soft">{t("fixed.historyNote")}</p>
      )}
      {err && <p className="mb-3 text-sm font-semibold text-danger">{err}</p>}
      <FormActions>
        {initial && <DeleteButton loading={busy} onConfirm={async () => { setBusy(true); await removeFixed(kind, initial.id); setBusy(false); onClose(); }} />}
        <Button type="submit" loading={busy} variant={kind === "income" ? "income" : "primary"}>{t("common.save")}</Button>
      </FormActions>
    </form>
  );
}
