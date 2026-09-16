"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useOnboarding } from "@/lib/onboarding";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useStepStatus } from "./useStepStatus";

/** Header entry point for the guided setup: opens the overview of the five steps. */
export function OnboardingButton() {
  const { t } = useI18n();
  const { data } = useStore();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!data}
        aria-label={t("onboarding.button")}
        title={t("onboarding.button")}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-2.5 text-xs font-bold text-ink shadow-card transition hover:bg-primary-hover disabled:opacity-50 sm:px-3"
      >
        <Sparkles className="h-4 w-4" strokeWidth={2.25} />
        <span className="hidden sm:inline">{t("onboarding.button")}</span>
      </button>
      <Modal open={open && !!data} onClose={() => setOpen(false)} title={t("onboarding.title")}>
        {data && <OnboardingOverview onClose={() => setOpen(false)} />}
      </Modal>
    </>
  );
}

/** Also used by the welcome card: starts (or resumes) the walkthrough and jumps to its page. */
export function useStartOnboarding() {
  const router = useRouter();
  const { steps, start } = useOnboarding();
  return (step = 0) => {
    start(step);
    router.push(steps[step].href);
  };
}

function OnboardingOverview({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const { state, steps } = useOnboarding();
  const status = useStepStatus();
  const go = useStartOnboarding();
  // Paused mid-way (finish() resets the step to 0, so a completed run is not resumable).
  const resumable = state.step > 0;

  const launch = (step: number) => {
    onClose();
    go(step);
  };

  return (
    <div>
      <p className="mb-4 text-sm text-ink-soft">{t("onboarding.intro")}</p>
      <ol className="flex flex-col gap-2">
        {steps.map((s, i) => {
          const st = status(s);
          return (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => launch(i)}
                className="flex w-full items-center gap-3 rounded-2xl bg-cream/70 px-3 py-3 text-left transition hover:bg-primary-soft"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-card text-lg" aria-hidden="true">
                  {s.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-extrabold">
                    <span className="text-ink-muted">{i + 1}.</span>
                    <span className="truncate">{t(s.title)}</span>
                    {s.optional && <span className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-bold text-ink-muted">{t("onboarding.optional")}</span>}
                  </span>
                  <span className="block truncate text-xs text-ink-soft">{st.label}</span>
                </span>
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 ${
                    st.done ? "border-income-dark bg-income-dark text-white" : "border-line bg-card text-transparent"
                  }`}
                  aria-label={st.done ? "✓" : ""}
                >
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {resumable && (
          <Button variant="ghost" onClick={() => launch(0)}>
            {t("onboarding.restart")}
          </Button>
        )}
        <Button onClick={() => launch(resumable ? state.step : 0)}>
          {resumable ? t("onboarding.resume", { n: state.step + 1 }) : t("onboarding.start")} →
        </Button>
      </div>
    </div>
  );
}
