"use client";

import { useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { useData, accountName } from "@/lib/store";
import { stepProgress, type OnboardingStep } from "@/lib/onboarding";
import { formatMoney } from "@/lib/format";

/** Live one-line status for a setup step, e.g. "2 von 3 Konten mit Startsaldo". */
export function useStepStatus() {
  const { t } = useI18n();
  const data = useData();

  return useCallback(
    (step: OnboardingStep): { label: string; done: boolean } => {
      const p = stepProgress(data, step.key);
      switch (step.key) {
        case "accounts":
          return { label: t("onboarding.step.accounts.status", { n: p.count, total: p.total ?? 0 }), done: p.done };
        case "income":
          return { label: t("onboarding.step.income.status", { n: p.count }), done: p.done };
        case "fixed":
          return { label: t("onboarding.step.fixed.status", { n: p.count }), done: p.done };
        case "debts":
          return { label: t("onboarding.step.debts.status", { n: p.count }), done: p.done };
        case "savings": {
          const s = data.settings;
          const rule =
            s.savings_mode === "percentage"
              ? t("onboarding.rulePercent", { pct: s.savings_value })
              : t("onboarding.ruleFixed", { amount: formatMoney(s.savings_value) });
          const from = accountName(data.accounts, s.savings_source_account_id) || "–";
          const to = accountName(data.accounts, s.savings_account_id) || "–";
          return { label: t("onboarding.step.savings.status", { rule, from, to }), done: p.done };
        }
      }
    },
    [data, t],
  );
}
