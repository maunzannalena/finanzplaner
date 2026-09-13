const eur = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Always German format: "1.234,56 €". */
export function formatMoney(n: number): string {
  return eur.format(round2(n));
}

/** Compact form for axis ticks: "1.200 €". */
export function formatMoneyShort(n: number): string {
  return `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 }).format(Math.round(n))} €`;
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Accepts "12,50", "1.234,56", "1234.56", "12" -> number. Returns null if invalid.
 */
export function parseAmount(raw: string): number | null {
  let s = raw.trim().replace(/\s|€/g, "");
  if (!s) return null;
  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if ((s.match(/\./g) ?? []).length > 1) {
    s = s.replace(/\./g, "");
  }
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return round2(n);
}

/** Number -> editable string in German style ("12,50"). */
export function amountToInput(n: number | null | undefined): string {
  if (n === null || n === undefined) return "";
  return round2(n).toFixed(2).replace(".", ",");
}

export function formatPercent(n: number): string {
  return `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 }).format(n)} %`;
}
