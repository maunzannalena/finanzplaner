"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SavingsPoint } from "@/lib/calc";
import { useI18n } from "@/lib/i18n";
import { formatMonthShort } from "@/lib/dates";
import { formatMoneyShort } from "@/lib/format";
import { SAVINGS_CHART } from "@/lib/palette";
import { ChartTooltip } from "./ChartTooltip";

export function SavingsChart({ series }: { series: SavingsPoint[] }) {
  const { t, lang } = useI18n();
  const data = series.map((p) => ({ ...p, label: formatMonthShort(p.key, lang) }));
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2} barCategoryGap="28%" margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#f3e2ea" />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "#f3e2ea" }} tick={{ fontSize: 11, fill: "#a8969f" }} />
          <YAxis tickLine={false} axisLine={false} width={56} tick={{ fontSize: 11, fill: "#a8969f" }} tickFormatter={(v: number) => formatMoneyShort(v)} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(59,42,51,0.05)" }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, fontWeight: 700, color: "#77626d" }} />
          <Bar dataKey="deposits" name={t("savings.deposits")} fill={SAVINGS_CHART.deposits} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
          <Bar dataKey="withdrawals" name={t("savings.withdrawals")} fill={SAVINGS_CHART.withdrawals} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
