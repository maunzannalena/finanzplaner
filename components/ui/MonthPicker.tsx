"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { addMonths, currentMonthKey, formatMonth, monthRange } from "@/lib/dates";
import { IconButton } from "./Button";

export function MonthPicker({ value, onChange, min, max = currentMonthKey(), allowFuture = false }: {
  value: string;
  onChange: (key: string) => void;
  min?: string;
  max?: string;
  allowFuture?: boolean;
}) {
  const { lang, t } = useI18n();
  const upper = allowFuture ? addMonths(currentMonthKey(), 12) : max;
  const lower = min && min < value ? min : value;
  const options = monthRange(lower, upper < value ? value : upper);
  const isCurrent = value === currentMonthKey();

  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl bg-card p-1.5 shadow-card">
      <IconButton onClick={() => onChange(addMonths(value, -1))} disabled={min !== undefined && value <= min} aria-label={t("common.previousMonth")}>
        <ChevronLeft className="h-5 w-5" />
      </IconButton>
      <div className="relative min-w-0 flex-1 text-center">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full cursor-pointer appearance-none bg-transparent text-center text-base font-extrabold text-ink focus:outline-none"
          aria-label={t("common.month")}
        >
          {options.map((k) => (
            <option key={k} value={k}>
              {formatMonth(k, lang)}
            </option>
          ))}
        </select>
        {isCurrent && <span className="pointer-events-none absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />}
      </div>
      <IconButton onClick={() => onChange(addMonths(value, 1))} disabled={value >= upper} aria-label={t("common.nextMonth")}>
        <ChevronRight className="h-5 w-5" />
      </IconButton>
    </div>
  );
}
