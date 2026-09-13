"use client";

import { useState, type FormEvent } from "react";
import type { Debt, DebtDirection } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { amountToInput, formatMoney, parseAmount } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { AmountInput, Checkbox, Field, FormActions, Segmented, TextInput } from "@/components/ui/Field";
import { DeleteButton } from "@/components/ui/DeleteButton";

export function DebtForm({ initial, onClose, defaultDirection = "ana_owes" }: { initial?: Debt; onClose: () => void; defaultDirection?: DebtDirection }) {
  const { t } = useI18n();
  const { addDebt, updateDebt, removeDebt } = useStore();
  const [direction, setDirection] = useState<DebtDirection>(initial?.direction ?? defaultDirection);
  const [person, setPerson] = useState(initial?.person ?? "");
  const [amount, setAmount] = useState(amountToInput(initial?.amount));
  const [note, setNote] = useState(initial?.note ?? "");
  const [dueDate, setDueDate] = useState(initial?.due_date ?? "");
  const [installments, setInstallments] = useState(initial?.installments ? String(initial.installments) : "");
  const [paid, setPaid] = useState(initial?.paid ?? false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const amt = parseAmount(amount);
  const inst = installments.trim() ? Number(installments) : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!person.trim()) return setErr(t("form.errPerson"));
    if (amt === null || amt <= 0) return setErr(t("form.errAmount"));
    if (inst !== null && (!Number.isInteger(inst) || inst < 1)) return setErr(t("form.errInstallments"));
    setBusy(true);
    const row = { direction, person: person.trim(), amount: amt, note: note.trim(), due_date: dueDate || null, installments: inst, paid };
    if (initial) await updateDebt(initial.id, row);
    else await addDebt(row);
    setBusy(false);
    onClose();
  };

  return (
    <form onSubmit={submit}>
      <div className="mb-4">
        <Segmented<DebtDirection>
          value={direction}
          onChange={setDirection}
          color="ink"
          options={[
            { value: "ana_owes", label: t("debts.iOwe") },
            { value: "owed_to_ana", label: t("debts.owedToMe") },
          ]}
        />
      </div>
      <Field label={t("form.person")}>
        <TextInput value={person} onChange={(e) => setPerson(e.target.value)} placeholder={t("debts.personPlaceholder")} autoFocus />
      </Field>
      <Field label={t("form.amount")}>
        <AmountInput value={amount} onChange={setAmount} />
      </Field>
      <Field label={t("form.note")}>
        <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("debts.notePlaceholder")} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("form.dueDate")}>
          <TextInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <Field
          label={t("form.installments")}
          hint={inst && amt ? t("debts.perInstallment", { amount: formatMoney(amt / inst) }) : t("form.optional")}
        >
          <TextInput type="number" inputMode="numeric" min={1} value={installments} onChange={(e) => setInstallments(e.target.value)} placeholder="–" />
        </Field>
      </div>
      <Checkbox checked={paid} onChange={setPaid} label={`✅ ${t("debts.paid")}`} />
      {err && <p className="mb-3 text-sm font-semibold text-danger">{err}</p>}
      <FormActions>
        {initial && <DeleteButton loading={busy} onConfirm={async () => { setBusy(true); await removeDebt(initial.id); setBusy(false); onClose(); }} />}
        <Button type="submit" loading={busy}>{t("common.save")}</Button>
      </FormActions>
    </form>
  );
}
