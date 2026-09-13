"use client";

import { useState, type FormEvent } from "react";
import type { ExpenseVariable } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n";
import { useData, useStore } from "@/lib/store";
import { amountToInput, parseAmount } from "@/lib/format";
import { todayISO } from "@/lib/dates";
import { Button } from "@/components/ui/Button";
import { AmountInput, Checkbox, Field, FormActions, Select, TextInput } from "@/components/ui/Field";
import { DeleteButton } from "@/components/ui/DeleteButton";

const NEW = "__new__";

export function VariableExpenseForm({ initial, onClose, defaults }: {
  initial?: ExpenseVariable;
  onClose: () => void;
  defaults?: Partial<Pick<ExpenseVariable, "paid_from_savings" | "date">>;
}) {
  const { t } = useI18n();
  const { accounts, categories } = useData();
  const { addVariableExpense, updateVariableExpense, removeVariableExpense, addCategory } = useStore();
  const [name, setName] = useState(initial?.name ?? "");
  const [amount, setAmount] = useState(amountToInput(initial?.amount));
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? categories[0]?.id ?? NEW);
  const [newCategory, setNewCategory] = useState("");
  const [accountId, setAccountId] = useState(initial?.account_id ?? accounts[0]?.id ?? "");
  const [date, setDate] = useState(initial?.date ?? defaults?.date ?? todayISO());
  const [fromSavings, setFromSavings] = useState(initial?.paid_from_savings ?? defaults?.paid_from_savings ?? false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const amt = parseAmount(amount);
    if (!name.trim()) return setErr(t("form.errName"));
    if (amt === null || amt <= 0) return setErr(t("form.errAmount"));
    if (!date) return setErr(t("form.errDate"));
    if (categoryId === NEW && !newCategory.trim()) return setErr(t("form.errCategory"));
    setBusy(true);
    let catId: string | null = categoryId === NEW ? null : categoryId;
    if (categoryId === NEW) {
      // Create the category first, then use it.
      const created = await addCategory(newCategory.trim());
      if (!created) return setBusy(false);
      catId = created.id;
    }
    const row = { name: name.trim(), amount: amt, category_id: catId, account_id: accountId || null, date, paid_from_savings: fromSavings };
    if (initial) await updateVariableExpense(initial.id, row);
    else await addVariableExpense(row);
    setBusy(false);
    onClose();
  };

  return (
    <form onSubmit={submit}>
      <Field label={t("form.name")}>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder={t("variable.namePlaceholder")} autoFocus />
      </Field>
      <Field label={t("form.amount")}>
        <AmountInput value={amount} onChange={setAmount} />
      </Field>
      <Field label={t("form.category")}>
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
          <option value={NEW}>＋ {t("variable.newCategory")}</option>
        </Select>
      </Field>
      {categoryId === NEW && (
        <Field label={t("variable.newCategoryName")}>
          <TextInput value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder={t("settings.categoryPlaceholder")} />
        </Field>
      )}
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
      <Checkbox checked={fromSavings} onChange={setFromSavings} label={`🐷 ${t("variable.paidFromSavings")}`} hint={t("variable.paidFromSavingsHint")} />
      {err && <p className="mb-3 text-sm font-semibold text-danger">{err}</p>}
      <FormActions>
        {initial && <DeleteButton loading={busy} onConfirm={async () => { setBusy(true); await removeVariableExpense(initial.id); setBusy(false); onClose(); }} />}
        <Button type="submit" loading={busy}>{t("common.save")}</Button>
      </FormActions>
    </form>
  );
}
