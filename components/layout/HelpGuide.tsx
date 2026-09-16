"use client";

import { useState } from "react";
import { CircleHelp, Lock } from "lucide-react";
import { useI18n, type TKey } from "@/lib/i18n";
import { Modal } from "@/components/ui/Modal";

interface Section {
  icon: string;
  title: TKey;
  text: TKey;
  /** Soft background of the icon badge, one per screen so the guide mirrors the app's colours. */
  tone: string;
}

const SECTIONS: Section[] = [
  { icon: "🏠", title: "help.dashboard.title", text: "help.dashboard.text", tone: "bg-primary-soft" },
  { icon: "💶", title: "help.income.title", text: "help.income.text", tone: "bg-income-soft" },
  { icon: "🧾", title: "help.fixed.title", text: "help.fixed.text", tone: "bg-fixed-soft" },
  { icon: "🛍️", title: "help.variable.title", text: "help.variable.text", tone: "bg-primary-soft" },
  { icon: "🤝", title: "help.debts.title", text: "help.debts.text", tone: "bg-danger-soft" },
  { icon: "🐷", title: "help.savings.title", text: "help.savings.text", tone: "bg-savings-soft" },
  { icon: "🏦", title: "help.accounts.title", text: "help.accounts.text", tone: "bg-cream" },
  { icon: "📅", title: "help.history.title", text: "help.history.text", tone: "bg-income-soft" },
  { icon: "⚙️", title: "help.settings.title", text: "help.settings.text", tone: "bg-cream" },
];

/** "?" button for the header; opens a short, friendly guide to every screen. */
export function HelpGuide() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("help.open")}
        title={t("help.open")}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-dark transition hover:bg-primary hover:text-ink"
      >
        <CircleHelp className="h-5 w-5" strokeWidth={2.25} />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t("help.title")} wide>
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-primary/40 bg-primary-soft px-4 py-3 text-sm font-semibold text-primary-dark">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{t("help.private")}</span>
        </div>

        <p className="mb-5 text-sm text-ink-soft">{t("help.intro")}</p>

        <div className="flex flex-col gap-3">
          {SECTIONS.map((s) => (
            <section key={s.title} className="flex gap-3 rounded-3xl bg-cream/70 p-4">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-xl ${s.tone}`} aria-hidden="true">
                {s.icon}
              </span>
              <div className="min-w-0">
                <h3 className="text-[15px] font-extrabold">{t(s.title)}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{t(s.text)}</p>
              </div>
            </section>
          ))}
        </div>
      </Modal>
    </>
  );
}
