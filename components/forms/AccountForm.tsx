"use client";

import { useState, type FormEvent } from "react";
import type { Account } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { amountToInput, parseAmount } from "@/lib/format";
import { todayISO } from "@/lib/dates";
import { Button } from "@/components/ui/Button";
import { AmountInput, Field, FormActions, TextInput } from "@/components/ui/Field";
import { DeleteButton } from "@/components/ui/DeleteButton";

export function AccountForm({ initial, onClose }: { initial?: Account; onClose: () => void }) {
  const { t } = useI18n();
  const { addAccount, updateAccount, removeAccount } = useStore();
  const [name, setName] = useState(initial?.name ?? "");
  const [balance, setBalance] = useState(amountToInput(initial?.starting_balance ?? 0));
  const [date, setDate] = useState(initial?.balance_date ?? todayISO());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const amt = parseAmount(balance);
    if (!name.trim()) return setErr(t("form.errName"));
    if (amt === null) return setErr(t("form.errAmount"));
    if (!date) return setErr(t("form.errDate"));
    setBusy(true);
    const row = { name: name.trim(), starting_balance: amt, balance_date: date };
    if (initial) await updateAccount(initial.id, row);
    else await addAccount(row);
    setBusy(false);
    onClose();
  };

  const remove = async () => {
    if (!initial) return;
    setBusy(true);
    const res = await removeAccount(initial.id);
    setBusy(false);
    if (!res.ok) return setErr(t("accounts.inUse"));
    onClose();
  };

  return (
    <form onSubmit={submit}>
      <Field label={t("form.name")}>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder={t("accounts.namePlaceholder")} autoFocus />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("accounts.startingBalance")}>
          <AmountInput value={balance} onChange={setBalance} />
        </Field>
        <Field label={t("accounts.balanceDate")}>
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      <p className="mb-4 rounded-2xl bg-cream px-4 py-3 text-xs text-ink-soft">{t("accounts.balanceDateHint")}</p>
      {err && <p className="mb-3 text-sm font-semibold text-danger">{err}</p>}
      <FormActions>
        {initial && <DeleteButton loading={busy} onConfirm={remove} />}
        <Button type="submit" loading={busy}>{t("common.save")}</Button>
      </FormActions>
    </form>
  );
}
