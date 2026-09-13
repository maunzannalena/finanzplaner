"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "income" | "savings" | "white" | "glass";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-ink hover:bg-primary-hover shadow-card",
  secondary: "bg-card text-ink border border-line hover:bg-cream",
  ghost: "bg-transparent text-ink-soft hover:bg-cream hover:text-ink",
  danger: "bg-danger-soft text-danger hover:bg-danger hover:text-white",
  income: "bg-income text-ink hover:bg-income-hover shadow-card",
  savings: "bg-savings text-ink hover:bg-savings-hover shadow-card",
  /* for use on the lavender savings cards */
  white: "bg-card text-savings-dark hover:bg-savings-soft shadow-card",
  glass: "bg-white/50 text-ink hover:bg-white/70",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-4 text-[15px] gap-2",
  lg: "h-13 px-5 text-base gap-2",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  full?: boolean;
  children?: ReactNode;
}

export function Button({ variant = "primary", size = "md", loading, full, className = "", children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-2xl font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${full ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}

export function IconButton({ className = "", children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`grid h-10 w-10 place-items-center rounded-full text-ink-soft transition hover:bg-cream hover:text-ink disabled:opacity-40 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
