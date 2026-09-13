"use client";

import { useState } from "react";
import { PiggyBank } from "lucide-react";
import type { SavingsMode } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n";
import { useData, useStore } from "@/lib/store";
import { autoSavingsAmount, incomeForMonth } from "@/lib/calc";
import { currentMonthKey } from "@/lib/dates";
import { amountToInput, formatMoney, parseAmount } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field, Segmented, Select, inputClass } from "@/components/ui/Field";

export function SavingsSettingsCard() {
  const { settings } = useData();
  // Re-mount the form whenever the saved rule changes so local edits reset.
  return <SavingsRuleForm key={`${settings.savings_mode}-${settings.savings_value}-${settings.savings_source_account_id}-${settings.savings_account_id}`} />;
}

function SavingsRuleForm() {
  const { t } = useI18n();
  const data = useData();
  const { updateSettings } = useStore();
  const { settings } = data;
  const [mode, setMode] = useState<SavingsMode>(settings.savings_mode);
  const [value, setValue] = useState(settings.savings_mode === "percentage" ? String(settings.savings_value) : amountToInput(settings.savings_value));
  const [sourceId, setSourceId] = useState(settings.savings_source_account_id ?? "");
  const [savingsId, setSavingsId] = useState(settings.savings_account_id ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const parsed = parseAmount(value);
  const income = incomeForMonth(data, currentMonthKey()).total;
  const preview = parsed === null ? null : autoSavingsAmount({ ...settings, savings_mode: mode, savings_value: parsed }, income);
  const dirty =
    mode !== settings.savings_mode ||
    parsed !== settings.savings_value ||
    (sourceId || null) !== settings.savings_source_account_id ||
    (savingsId || null) !== settings.savings_account_id;
  const nameOf = (id: string) => data.accounts.find((a) => a.id === id)?.name ?? "–";

  const save = async () => {
    if (parsed === null || parsed < 0) return;
    setBusy(true);
    await updateSettings({ savings_mode: mode, savings_value: parsed, savings_source_account_id: sourceId || null, savings_account_id: savingsId || null });
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card>
      <CardTitle>
        <span className="flex items-center gap-2">
          <PiggyBank className="h-5 w-5 text-savings" /> {t("savings.ruleTitle")}
        </span>
      </CardTitle>
      <p className="mb-3 text-sm text-ink-soft">{t("savings.ruleHint")}</p>
      <div className="mb-4">
        <Segmented<SavingsMode>
          value={mode}
          onChange={(m) => {
            setMode(m);
            setValue(m === "percentage" ? "10" : "100,00");
          }}
          color="savings"
          options={[
            { value: "percentage", label: t("savings.modePercentage") },
            { value: "fixed", label: t("savings.modeFixed") },
          ]}
        />
      </div>
      <Field label={mode === "percentage" ? t("savings.percentOfIncome") : t("savings.fixedAmount")}>
        <div className="relative">
          <input type="text" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} className={`${inputClass} pr-10 text-lg font-bold tnum`} />
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-bold text-ink-muted">{mode === "percentage" ? "%" : "€"}</span>
        </div>
      </Field>
      <div className="grid gap-x-3 sm:grid-cols-2">
        <Field label={t("savings.sourceAccount")}>
          <Select value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
            <option value="">–</option>
            {data.accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
        </Field>
        <Field label={t("savings.savingsAccount")}>
          <Select value={savingsId} onChange={(e) => setSavingsId(e.target.value)}>
            <option value="">–</option>
            {data.accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="mb-4 rounded-2xl bg-savings-soft px-4 py-3 text-sm text-savings-dark">
        {preview === null ? (
          t("form.errAmount")
        ) : (
          <>
            {t("savings.previewThisMonth")}: <span className="font-extrabold tnum">{formatMoney(preview)}</span>
            {mode === "percentage" && <span className="opacity-80"> ({t("savings.previewIncome", { amount: formatMoney(income) })})</span>}
            {sourceId && savingsId && <span className="mt-1 block text-xs opacity-80">{t("savings.transferHint", { from: nameOf(sourceId), to: nameOf(savingsId) })}</span>}
          </>
        )}
      </div>
      <Button variant="savings" onClick={save} loading={busy} disabled={!dirty || parsed === null} full>
        {saved ? `✓ ${t("common.saved")}` : t("common.save")}
      </Button>
    </Card>
  );
}
