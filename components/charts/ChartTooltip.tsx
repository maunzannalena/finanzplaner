"use client";

import { formatMoney } from "@/lib/format";

interface Item {
  name?: string | number;
  value?: number | string | ReadonlyArray<number | string>;
  color?: string;
  dataKey?: string | number;
}

/** Shared tooltip body for recharts (used as an element: `content={<ChartTooltip />}`). */
export function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: ReadonlyArray<Item>; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-line bg-card px-3 py-2 text-xs shadow-float">
      {label !== undefined && <div className="mb-1 font-extrabold text-ink">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-ink-soft">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} />
          <span>{p.name}</span>
          <span className="ml-auto font-bold text-ink tnum">{formatMoney(Number(p.value ?? 0))}</span>
        </div>
      ))}
    </div>
  );
}
