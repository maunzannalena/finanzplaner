import type { Language } from "@/lib/data/types";

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Local-time YYYY-MM-DD. */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** "YYYY-MM" for a YYYY-MM-DD string. */
export function monthKeyOf(iso: string): string {
  return iso.slice(0, 7);
}

export function currentMonthKey(): string {
  return monthKeyOf(todayISO());
}

export function monthStart(key: string): string {
  return `${key}-01`;
}

export function daysInMonth(key: string): number {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

export function monthEnd(key: string): string {
  return `${key}-${pad2(daysInMonth(key))}`;
}

export function addMonths(key: string, n: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

export function prevMonthEnd(key: string): string {
  return monthEnd(addMonths(key, -1));
}

export function isInMonth(iso: string, key: string): boolean {
  return iso.startsWith(key);
}

/** Date for a recurring item in a given month (day clamped to month length). */
export function dayInMonth(key: string, day: number): string {
  const d = Math.min(Math.max(1, Math.round(day || 1)), daysInMonth(key));
  return `${key}-${pad2(d)}`;
}

/** Month keys from `from` up to and including `to`, ascending. */
export function monthRange(from: string, to: string): string[] {
  const out: string[] = [];
  let k = from;
  while (k <= to) {
    out.push(k);
    k = addMonths(k, 1);
  }
  return out;
}

export function lastNMonths(n: number, endKey = currentMonthKey()): string[] {
  return monthRange(addMonths(endKey, -(n - 1)), endKey);
}

function localeOf(lang: Language) {
  return lang === "de" ? "de-DE" : "en-US";
}

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d || 1);
}

/** DD.MM.YYYY in German, MM/DD/YYYY in English. */
export function formatDate(iso: string | null | undefined, lang: Language): string {
  if (!iso) return "";
  const d = parseISO(iso);
  return new Intl.DateTimeFormat(localeOf(lang), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/** "12. Sep." / "Sep 12" */
export function formatDateShort(iso: string, lang: Language): string {
  const d = parseISO(iso);
  return new Intl.DateTimeFormat(localeOf(lang), { day: "numeric", month: "short" }).format(d);
}

/** "September 2026" */
export function formatMonth(key: string, lang: Language): string {
  const d = parseISO(monthStart(key));
  return new Intl.DateTimeFormat(localeOf(lang), { month: "long", year: "numeric" }).format(d);
}

/** "Sep 26" */
export function formatMonthShort(key: string, lang: Language): string {
  const d = parseISO(monthStart(key));
  return new Intl.DateTimeFormat(localeOf(lang), { month: "short", year: "2-digit" }).format(d);
}
