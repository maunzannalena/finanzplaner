"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { Check } from "lucide-react";

export const inputClass =
  "w-full rounded-2xl border border-line bg-cream/60 px-4 py-3 text-base text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50";

export function Field({ label, hint, children, error }: { label: ReactNode; hint?: ReactNode; children: ReactNode; error?: ReactNode }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-sm font-bold text-ink-soft">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-semibold text-danger">{error}</span>}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function AmountInput({ value, onChange, ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0,00"
        {...rest}
        className={`${inputClass} pr-10 text-lg font-bold tnum`}
      />
      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-base font-bold text-ink-muted">€</span>
    </div>
  );
}

export function Select({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={`${inputClass} appearance-none pr-10 ${props.className ?? ""}`}>
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-ink-muted">▾</span>
    </div>
  );
}

export function Checkbox({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; hint?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`mb-4 flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
        checked ? "border-savings bg-savings-soft" : "border-line bg-cream/60"
      }`}
      aria-pressed={checked}
    >
      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 ${checked ? "border-savings-dark bg-savings-dark text-white" : "border-ink-muted bg-card"}`}>
        {checked && <Check className="h-4 w-4" strokeWidth={3} />}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold">{label}</span>
        {hint && <span className="block text-xs text-ink-soft">{hint}</span>}
      </span>
    </button>
  );
}

/** Segmented control, e.g. for a 2-way mode toggle. */
export function Segmented<T extends string>({ value, onChange, options, color = "primary" }: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
  color?: "primary" | "savings" | "ink";
}) {
  const active = { primary: "bg-primary text-ink", savings: "bg-savings text-ink", ink: "bg-ink text-cream" }[color];
  return (
    <div className="grid w-full auto-cols-fr grid-flow-col rounded-2xl border border-line bg-cream/60 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`rounded-xl px-3 py-2.5 text-sm font-bold transition ${value === o.value ? `${active} shadow` : "text-ink-soft hover:text-ink"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function FormActions({ children }: { children: ReactNode }) {
  return <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{children}</div>;
}
