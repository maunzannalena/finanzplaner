"use client";

import { useState, type FormEvent } from "react";
import type { SavingsTransaction } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n";
import { accountName, useData, useStore } from "@/lib/store";
import { amountToInput, formatMoney, parseAmount } from "@/lib/format";
import { currentMonthKey, todayISO } from "@/lib/dates";
import { savingsBalance } from "@/lib/calc";
import { Button } from "@/components/ui/Button";
import { AmountInput, Checkbox, Field, FormActions, Select, TextInput } from "@/components/ui/Field";
import { DeleteButton } from "@/components/ui/DeleteButton";

/** "Spend from savings": creates a withdrawal, optionally as a variable expense paid from savings. */
export function SpendFromSavingsForm({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const data = useData();
  const { addSavingsTx, addVariableExpense } = useStore();
  const balance = savingsBalance(data.savingsTransactions);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());
  const [asExpense, setAsExpense] = useState(true);
  const [categoryId, setCategoryId] = useState(data.categories[0]?.id ?? "");
  const spendable = data.accounts.filter((a) => a.id !== data.settings.savings_account_id);
  const [accountId, setAccountId] = useState(data.settings.savings_source_account_id ?? spendable[0]?.id ?? data.accounts[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const amt = parseAmount(amount);
    if (amt === null || amt <= 0) return setErr(t("form.errAmount"));
    if (!note.trim()) return setErr(t("form.errName"));
    if (!date) return setErr(t("form.errDate"));
    setBusy(true);
    if (asExpense) {
      await addVariableExpense({ name: note.trim(), amount: amt, category_id: categoryId || null, account_id: accountId || null, date, paid_from_savings: true });
    } else {
      await addSavingsTx({ type: "withdrawal", amount: amt, note: note.trim(), date, auto_month: null, expense_id: null, account_id: accountId || null });
    }
    setBusy(false);
    onClose();
  };

  const amt = parseAmount(amount);
  const savingsAccount = accountName(data.accounts, data.settings.savings_account_id);

  return (
    <form onSubmit={submit}>
      <div className="mb-4 rounded-2xl bg-savings-soft px-4 py-3 text-sm font-semibold text-savings-dark">
        {t("savings.available")}: <span className="font-extrabold tnum">{formatMoney(balance)}</span>
        {savingsAccount && <span className="block text-xs font-semibold opacity-80">{t("savings.fromSavingsAccount", { account: savingsAccount })}</span>}
      </div>
      <Field label={t("form.amount")} error={amt !== null && amt > balance ? t("savings.moreThanBalance") : undefined}>
        <AmountInput value={amount} onChange={setAmount} autoFocus />
      </Field>
      <Field label={t("savings.whatFor")}>
        <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("savings.whatForPlaceholder")} />
      </Field>
      <Field label={t("form.date")}>
        <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <Checkbox checked={asExpense} onChange={setAsExpense} label={t("savings.alsoAsExpense")} hint={t("savings.alsoAsExpenseHint")} />
      <div className="grid grid-cols-2 gap-3">
        {asExpense && (
          <Field label={t("form.category")}>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {data.categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
        )}
        <Field label={asExpense ? t("savings.paidFromAccount") : t("savings.toAccount")} hint={t("savings.toAccountHint")}>
          <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {data.accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
        </Field>
      </div>
      {err && <p className="mb-3 text-sm font-semibold text-danger">{err}</p>}
      <FormActions>
        <Button type="submit" loading={busy} variant="savings">{t("savings.spendAction")}</Button>
      </FormActions>
    </form>
  );
}

/** Manual deposit into savings. */
export function DepositForm({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const data = useData();
  const { addSavingsTx } = useStore();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());
  const [accountId, setAccountId] = useState(data.settings.savings_source_account_id ?? data.accounts[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const amt = parseAmount(amount);
    if (amt === null || amt <= 0) return setErr(t("form.errAmount"));
    if (!date) return setErr(t("form.errDate"));
    setBusy(true);
    await addSavingsTx({ type: "deposit", amount: amt, note: note.trim(), date, auto_month: null, expense_id: null, account_id: accountId || null });
    setBusy(false);
    onClose();
  };

  return (
    <form onSubmit={submit}>
      <Field label={t("form.amount")}>
        <AmountInput value={amount} onChange={setAmount} autoFocus />
      </Field>
      <Field label={t("form.note")} hint={t("form.optional")}>
        <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("savings.depositPlaceholder")} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("savings.fromAccount")}>
          <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {data.accounts.map((a) => (
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
        <Button type="submit" loading={busy} variant="savings">{t("savings.depositAction")}</Button>
      </FormActions>
    </form>
  );
}

/** Edit / delete an existing savings transaction. */
export function SavingsTxForm({ tx, onClose }: { tx: SavingsTransaction; onClose: () => void }) {
  const { t } = useI18n();
  const data = useData();
  const { updateSavingsTx, removeSavingsTx } = useStore();
  const [amount, setAmount] = useState(amountToInput(tx.amount));
  const [note, setNote] = useState(tx.note);
  const [date, setDate] = useState(tx.date);
  const [accountId, setAccountId] = useState(tx.account_id ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isCurrentAuto = tx.auto_month === currentMonthKey();
  const isLinked = tx.expense_id !== null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const amt = parseAmount(amount);
    if (amt === null || amt <= 0) return setErr(t("form.errAmount"));
    if (!date) return setErr(t("form.errDate"));
    setBusy(true);
    await updateSavingsTx(tx.id, { amount: amt, note: note.trim(), date, account_id: accountId || null });
    setBusy(false);
    onClose();
  };

  if (isCurrentAuto) {
    return (
      <div>
        <p className="mb-4 rounded-2xl bg-savings-soft px-4 py-3 text-sm text-savings-dark">{t("savings.autoLocked")}</p>
        <FormActions>
          <Button variant="secondary" onClick={onClose}>{t("common.close")}</Button>
        </FormActions>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      {isLinked && <p className="mb-4 rounded-2xl bg-cream px-4 py-3 text-xs text-ink-soft">{t("savings.linkedNote")}</p>}
      {tx.auto_month && <p className="mb-4 rounded-2xl bg-cream px-4 py-3 text-xs text-ink-soft">{t("savings.pastAutoNote")}</p>}
      <Field label={t("form.amount")}>
        <AmountInput value={amount} onChange={setAmount} disabled={isLinked} />
      </Field>
      <Field label={t("form.note")}>
        <TextInput value={note} onChange={(e) => setNote(e.target.value)} disabled={isLinked} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={tx.type === "deposit" ? t("savings.fromAccount") : t("savings.toAccount")}>
          <Select value={accountId} onChange={(e) => setAccountId(e.target.value)} disabled={isLinked}>
            <option value="">–</option>
            {data.accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
        </Field>
        <Field label={t("form.date")}>
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={isLinked} />
        </Field>
      </div>
      {err && <p className="mb-3 text-sm font-semibold text-danger">{err}</p>}
      <FormActions>
        <DeleteButton loading={busy} onConfirm={async () => { setBusy(true); await removeSavingsTx(tx.id); setBusy(false); onClose(); }} />
        {!isLinked && <Button type="submit" loading={busy} variant="savings">{t("common.save")}</Button>}
      </FormActions>
    </form>
  );
}
