"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { formatMoney } from "@/lib/format";

/** A tappable list row: icon, title, meta line, amount, optional extra control on the right. */
export function ListRow({ icon, title, meta, amount, amountClass = "", onClick, right, muted, badge }: {
  icon?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  amount?: number;
  amountClass?: string;
  onClick?: () => void;
  right?: ReactNode;
  muted?: boolean;
  badge?: ReactNode;
}) {
  const content = (
    <>
      {icon && <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cream text-lg">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={`truncate font-bold ${muted ? "line-through" : ""}`}>{title}</span>
          {badge}
        </span>
        {meta && <span className="line-clamp-2 text-xs text-ink-soft">{meta}</span>}
      </span>
      {amount !== undefined && <span className={`shrink-0 text-base font-extrabold tnum ${amountClass}`}>{formatMoney(amount)}</span>}
      {onClick && !right && <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />}
    </>
  );
  const rowClass = `flex w-full items-center gap-3 rounded-2xl bg-card shadow-card ${muted ? "opacity-60" : ""}`;

  if (!onClick) {
    return (
      <div className={`${rowClass} px-4 py-3`}>
        {content}
        {right}
      </div>
    );
  }
  return (
    <div className={`${rowClass} ${right ? "pr-3" : ""}`}>
      <button type="button" onClick={onClick} className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-cream/70 active:scale-[0.995]">
        {content}
      </button>
      {right}
    </div>
  );
}
