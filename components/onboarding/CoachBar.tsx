"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useOnboarding } from "@/lib/onboarding";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useStepStatus } from "./useStepStatus";

/** Sticky guide shown under the header while the setup walkthrough is active. */
export function CoachBar() {
  const { data } = useStore();
  const { state } = useOnboarding();
  if (!state.active || !data) return null;
  return <CoachBarInner />;
}

function CoachBarInner() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const { state, steps, current, next, prev, pause, finish } = useOnboarding();
  const status = useStepStatus();
  const [done, setDone] = useState(false);
  if (!current) return null;

  const idx = state.step;
  const last = idx === steps.length - 1;
  const onPage = pathname === current.href;
  const st = status(current);

  const goNext = () => {
    if (last) {
      setDone(true);
      return;
    }
    next();
    router.push(steps[idx + 1].href);
  };
  const goPrev = () => {
    prev();
    router.push(steps[Math.max(idx - 1, 0)].href);
  };
  const closeDone = () => {
    setDone(false);
    finish();
    router.push("/");
  };

  return (
    <>
      <section
        aria-label={t("onboarding.title")}
        className="sticky top-14 z-20 mb-4 rounded-3xl border border-primary/40 bg-card p-4 shadow-float"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-soft text-xl" aria-hidden="true">
            {current.icon}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wide text-primary-dark">
              {t("onboarding.stepOf", { n: idx + 1, total: steps.length })}
              {current.optional && ` · ${t("onboarding.optional")}`}
            </div>
            <h2 className="text-base font-extrabold leading-tight">{t(current.title)}</h2>
          </div>
          <button type="button" onClick={pause} aria-label={t("onboarding.pause")} title={t("onboarding.pause")} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-cream">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t(current.text)}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className={`flex items-center gap-1.5 text-xs font-semibold ${st.done ? "text-income-dark" : "text-ink-muted"}`}>
            {st.done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            {st.label}
          </span>
          <span className="flex items-center gap-2">
            {idx > 0 && (
              <Button size="sm" variant="ghost" onClick={goPrev}>
                <ArrowLeft className="h-4 w-4" /> {t("onboarding.back")}
              </Button>
            )}
            {!onPage ? (
              <Button size="sm" variant="secondary" onClick={() => router.push(current.href)}>
                {t("onboarding.goThere")} <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={goNext}>
                {last ? t("onboarding.finish") : t("onboarding.next")} {last ? "🎉" : <ArrowRight className="h-4 w-4" />}
              </Button>
            )}
          </span>
        </div>
      </section>

      <Modal open={done} onClose={closeDone} title={t("onboarding.done.title")}>
        <p className="mb-5 text-sm leading-relaxed text-ink-soft">{t("onboarding.done.text")}</p>
        <Button full onClick={closeDone}>
          {t("onboarding.done.button")} <ArrowRight className="h-4 w-4" />
        </Button>
      </Modal>
    </>
  );
}
