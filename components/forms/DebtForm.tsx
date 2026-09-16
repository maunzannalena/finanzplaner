"use client";

import { useState, type FormEvent } from "react";
import { Minus, Plus } from "lucide-react";
import type { Debt, DebtDirection } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { amountToInput, formatMoney, parseAmount, round2 } from "@/lib/format";
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
  const [paidInstallments, setPaidInstallments] = useState(initial?.paid_installments ?? 0);
  const [paid, setPaid] = useState(initial?.paid ?? false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const amt = parseAmount(amount);
  const inst = installments.trim() ? Number(installments) : null;
  const instValid = inst !== null && Number.isInteger(inst) && inst >= 1;
  // Keep the stepper inside 0..installments even when the installment count is edited afterwards.
  const paidInst = instValid ? Math.min(paidInstallments, inst) : 0;
  const openAmount = amt !== null && instValid ? round2(amt - (amt * paidInst) / inst) : amt;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!person.trim()) return setErr(t("form.errPerson"));
    if (amt === null || amt <= 0) return setErr(t("form.errAmount"));
    if (inst !== null && !instValid) return setErr(t("form.errInstallments"));
    setBusy(true);
    // Paying the last installment settles the debt; unticking "paid" keeps the installment progress.
    const settled = paid || (instValid && paidInst >= inst);
    const row = { direction, person: person.trim(), amount: amt, note: note.trim(), due_date: dueDate || null, installments: inst, paid_installments: paidInst, paid: settled };
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
      {instValid && !paid && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-line bg-cream/60 px-4 py-3">
          <span className="min-w-0">
            <span className="block text-sm font-bold">{t("debts.paidInstallments")}</span>
            <span className="block text-xs text-ink-soft">
              {t("debts.installmentsProgress", { paid: paidInst, n: inst })}
              {openAmount !== null && paidInst < inst && ` · ${t("debts.stillOpen", { amount: formatMoney(openAmount) })}`}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setPaidInstallments(Math.max(0, paidInst - 1))}
              disabled={paidInst <= 0}
              aria-label="−"
              className="grid h-9 w-9 place-items-center rounded-full bg-card text-ink-soft shadow-card transition hover:text-ink disabled:opacity-40"
            >
              <Minus className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <span className="w-8 text-center text-base font-extrabold tnum">{paidInst}</span>
            <button
              type="button"
              onClick={() => setPaidInstallments(Math.min(inst, paidInst + 1))}
              disabled={paidInst >= inst}
              aria-label="+"
              className="grid h-9 w-9 place-items-center rounded-full bg-income text-ink shadow-card transition hover:bg-income-hover disabled:opacity-40"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </span>
        </div>
      )}
      <Checkbox checked={paid} onChange={setPaid} label={`✅ ${t("debts.paid")}`} />
      {err && <p className="mb-3 text-sm font-semibold text-danger">{err}</p>}
      <FormActions>
        {initial && <DeleteButton loading={busy} onConfirm={async () => { setBusy(true); await removeDebt(initial.id); setBusy(false); onClose(); }} />}
        <Button type="submit" loading={busy}>{t("common.save")}</Button>
      </FormActions>
    </form>
  );
}
