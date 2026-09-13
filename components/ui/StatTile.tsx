import type { ReactNode } from "react";
import { formatMoney } from "@/lib/format";

type Tone = "income" | "fixed" | "savings" | "primary" | "neutral" | "danger" | "good";

const tones: Record<Tone, { bg: string; text: string; icon: string }> = {
  income: { bg: "bg-income-soft", text: "text-income-dark", icon: "bg-card text-income-dark" },
  fixed: { bg: "bg-fixed-soft", text: "text-fixed-dark", icon: "bg-card text-fixed-dark" },
  savings: { bg: "bg-savings-soft", text: "text-savings-dark", icon: "bg-card text-savings-dark" },
  primary: { bg: "bg-primary-soft", text: "text-primary-dark", icon: "bg-card text-primary-dark" },
  neutral: { bg: "bg-card", text: "text-ink", icon: "bg-cream text-ink" },
  danger: { bg: "bg-danger-soft", text: "text-danger", icon: "bg-card text-danger" },
  good: { bg: "bg-good-soft", text: "text-income-dark", icon: "bg-card text-income-dark" },
};

export function StatTile({ label, value, tone = "neutral", icon, hint, big }: {
  label: ReactNode;
  value: number;
  tone?: Tone;
  icon?: ReactNode;
  hint?: ReactNode;
  big?: boolean;
}) {
  const c = tones[tone];
  return (
    <div className={`rounded-3xl p-4 shadow-card ${c.bg}`}>
      <div className="flex items-center gap-2">
        {icon && <span className={`grid h-8 w-8 place-items-center rounded-xl ${c.icon}`}>{icon}</span>}
        <span className={`text-sm font-bold ${c.text} opacity-80`}>{label}</span>
      </div>
      <div className={`mt-2 font-extrabold leading-none ${c.text} ${big ? "text-3xl md:text-4xl" : "text-2xl md:text-[28px]"}`}>{formatMoney(value)}</div>
      {hint && <div className={`mt-1.5 text-xs font-semibold ${c.text} opacity-70`}>{hint}</div>}
    </div>
  );
}
