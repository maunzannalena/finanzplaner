"use client";

import { useState, type FormEvent } from "react";
import type { IncomeOnetime } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n";
import { useData, useStore } from "@/lib/store";
import { amountToInput, parseAmount } from "@/lib/format";
import { todayISO } from "@/lib/dates";
import { Button } from "@/components/ui/Button";
import { AmountInput, Field, FormActions, Select, TextInput } from "@/components/ui/Field";
import { DeleteButton } from "@/components/ui/DeleteButton";

export function OnetimeIncomeForm({ initial, onClose }: { initial?: IncomeOnetime; onClose: () => void }) {
  const { t } = useI18n();
  const { accounts } = useData();
  const { addOnetimeIncome, updateOnetimeIncome, removeOnetimeIncome } = useStore();
  const [name, setName] = useState(initial?.name ?? "");
  const [amount, setAmount] = useState(amountToInput(initial?.amount));
  const [accountId, setAccountId] = useState(initial?.account_id ?? accounts[0]?.id ?? "");
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const amt = parseAmount(amount);
    if (!name.trim()) return setErr(t("form.errName"));
    if (amt === null || amt <= 0) return setErr(t("form.errAmount"));
    if (!date) return setErr(t("form.errDate"));
    setBusy(true);
    const row = { name: name.trim(), amount: amt, account_id: accountId || null, date };
    if (initial) await updateOnetimeIncome(initial.id, row);
    else await addOnetimeIncome(row);
    setBusy(false);
    onClose();
  };

  return (
    <form onSubmit={submit}>
      <Field label={t("form.name")}>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder={t("income.onetimePlaceholder")} autoFocus />
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
        <Field label={t("form.date")}>
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      {err && <p className="mb-3 text-sm font-semibold text-danger">{err}</p>}
      <FormActions>
        {initial && <DeleteButton loading={busy} onConfirm={async () => { setBusy(true); await removeOnetimeIncome(initial.id); setBusy(false); onClose(); }} />}
        <Button type="submit" loading={busy} variant="income">{t("common.save")}</Button>
      </FormActions>
    </form>
  );
}
