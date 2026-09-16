"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import type { AppData } from "@/lib/data/types";
import { currentFixedRows, debtIsSettled } from "@/lib/calc";
import type { TKey } from "@/lib/i18n";

/**
 * Guided first-time setup: walks Anna page by page (accounts → income → fixed
 * costs → debts → savings rule). Progress lives in localStorage so she can
 * pause on the phone and continue later; it never touches the database.
 */

export type OnboardingStepKey = "accounts" | "income" | "fixed" | "debts" | "savings";

export interface OnboardingStep {
  key: OnboardingStepKey;
  href: string;
  icon: string;
  title: TKey;
  text: TKey;
  optional?: boolean;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  { key: "accounts", href: "/accounts", icon: "🏦", title: "onboarding.step.accounts.title", text: "onboarding.step.accounts.text" },
  { key: "income", href: "/income", icon: "💶", title: "onboarding.step.income.title", text: "onboarding.step.income.text" },
  { key: "fixed", href: "/fixed-expenses", icon: "🧾", title: "onboarding.step.fixed.title", text: "onboarding.step.fixed.text" },
  { key: "debts", href: "/debts", icon: "🤝", title: "onboarding.step.debts.title", text: "onboarding.step.debts.text", optional: true },
  { key: "savings", href: "/savings", icon: "🐷", title: "onboarding.step.savings.title", text: "onboarding.step.savings.text" },
];

/** What the data says about a step: how much is filled in, and whether it looks done. */
export function stepProgress(data: AppData, key: OnboardingStepKey): { count: number; total?: number; done: boolean } {
  switch (key) {
    case "accounts": {
      const total = data.accounts.length;
      const count = data.accounts.filter((a) => a.starting_balance !== 0).length;
      return { count, total, done: total > 0 && count === total };
    }
    case "income": {
      const count = currentFixedRows(data.incomeFixed).length;
      return { count, done: count > 0 };
    }
    case "fixed": {
      const count = currentFixedRows(data.expensesFixed).length;
      return { count, done: count > 0 };
    }
    case "debts": {
      const count = data.debts.filter((d) => !debtIsSettled(d)).length;
      return { count, done: count > 0 };
    }
    case "savings":
      return { count: 1, done: data.settings.savings_value > 0 && data.settings.savings_account_id !== null };
  }
}

// ---------------------------------------------------------------------------
// Persistent state (localStorage) exposed through useSyncExternalStore, like the
// language store, so server and first client render agree ("not active").
// ---------------------------------------------------------------------------

export interface OnboardingState {
  /** The coach bar is showing and `step` is the current step index. */
  active: boolean;
  step: number;
  /** Walked through to the end at least once on this device. */
  completed: boolean;
  /** "Later" on the welcome card: hide it on this device. */
  dismissed: boolean;
}

const STORAGE_KEY = "finanzplaner.onboarding";
const DEFAULT_STATE: OnboardingState = { active: false, step: 0, completed: false, dismissed: false };

let memory: OnboardingState | null = null;
const listeners = new Set<() => void>();

function readStored(): OnboardingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    const step = Math.min(Math.max(0, Number(parsed.step) || 0), ONBOARDING_STEPS.length - 1);
    return { ...DEFAULT_STATE, ...parsed, step };
  } catch {
    return DEFAULT_STATE;
  }
}

const getSnapshot = (): OnboardingState => (memory ??= readStored());
const getServerSnapshot = (): OnboardingState => DEFAULT_STATE;

function write(next: OnboardingState) {
  memory = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* private mode etc.: keep in memory only */
  }
  listeners.forEach((cb) => cb());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

interface OnboardingContext {
  state: OnboardingState;
  steps: OnboardingStep[];
  current: OnboardingStep | null;
  start: (step?: number) => void;
  next: () => void;
  prev: () => void;
  pause: () => void;
  finish: () => void;
  dismissWelcome: () => void;
}

const Ctx = createContext<OnboardingContext | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const start = useCallback((step = 0) => write({ ...getSnapshot(), active: true, step }), []);
  const next = useCallback(() => {
    const s = getSnapshot();
    write({ ...s, step: Math.min(s.step + 1, ONBOARDING_STEPS.length - 1) });
  }, []);
  const prev = useCallback(() => {
    const s = getSnapshot();
    write({ ...s, step: Math.max(s.step - 1, 0) });
  }, []);
  const pause = useCallback(() => write({ ...getSnapshot(), active: false }), []);
  const finish = useCallback(() => write({ ...getSnapshot(), active: false, step: 0, completed: true, dismissed: true }), []);
  const dismissWelcome = useCallback(() => write({ ...getSnapshot(), dismissed: true }), []);

  const value = useMemo<OnboardingContext>(
    () => ({
      state,
      steps: ONBOARDING_STEPS,
      current: state.active ? ONBOARDING_STEPS[state.step] : null,
      start,
      next,
      prev,
      pause,
      finish,
      dismissWelcome,
    }),
    [state, start, next, prev, pause, finish, dismissWelcome],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOnboarding(): OnboardingContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOnboarding must be used inside OnboardingProvider");
  return ctx;
}
