"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useData } from "@/lib/store";
import { useOnboarding } from "@/lib/onboarding";
import { currentFixedRows } from "@/lib/calc";
import { Button } from "@/components/ui/Button";
import { useStartOnboarding } from "./OnboardingButton";

/**
 * Dashboard nudge for a brand-new setup: shown until the walkthrough was
 * completed or dismissed on this device, and only while nothing recurring
 * has been entered yet (so it disappears by itself once Anna has started).
 */
export function WelcomeCard() {
  const { t } = useI18n();
  const data = useData();
  const { state, dismissWelcome } = useOnboarding();
  const go = useStartOnboarding();

  const fresh = currentFixedRows(data.incomeFixed).length === 0 && currentFixedRows(data.expensesFixed).length === 0;
  if (!fresh || state.completed || state.dismissed || state.active) return null;

  return (
    <div className="mb-4 rounded-3xl bg-primary-soft p-5 shadow-card">
      <div className="flex items-center gap-2 text-base font-extrabold text-primary-dark">
        <Sparkles className="h-5 w-5" /> {t("onboarding.welcome.title")}
      </div>
      <p className="mt-1 text-sm text-ink-soft">{t("onboarding.welcome.text")}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => go(0)}>
          {t("onboarding.start")} <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" onClick={dismissWelcome}>
          {t("onboarding.welcome.later")}
        </Button>
      </div>
    </div>
  );
}
