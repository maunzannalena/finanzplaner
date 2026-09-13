"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/format";
import { ChartTooltip } from "./ChartTooltip";

export interface CategoryBar {
  name: string;
  total: number;
  color: string;
}

/** Horizontal bars: one per category, color follows the category, value labelled directly. */
export function CategoryChart({ bars }: { bars: CategoryBar[] }) {
  const height = Math.max(120, bars.length * 40 + 16);
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bars} layout="vertical" margin={{ top: 4, right: 84, left: 4, bottom: 4 }} barCategoryGap="30%">
          <XAxis type="number" hide domain={[0, "dataMax"]} />
          <YAxis type="category" dataKey="name" width={96} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#3b2a33", fontWeight: 700 }} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(59,42,51,0.05)" }} />
          <Bar dataKey="total" name="" radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
            {bars.map((b) => (
              <Cell key={b.name} fill={b.color} />
            ))}
            <LabelList dataKey="total" position="right" formatter={(v) => formatMoney(Number(v))} style={{ fontSize: 12, fontWeight: 700, fill: "#3b2a33" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
