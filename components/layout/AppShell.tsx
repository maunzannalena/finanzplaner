"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  CalendarDays,
  Ellipsis,
  HandCoins,
  House,
  Landmark,
  LoaderCircle,
  PiggyBank,
  Receipt,
  Settings,
  ShoppingBag,
  TrendingUp,
  TriangleAlert,
  X,
} from "lucide-react";
import { useI18n, type TKey } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { LanguageToggle } from "./LanguageToggle";

type IconType = typeof House;

interface NavItem {
  href: string;
  key: TKey;
  icon: IconType;
}

export const NAV: NavItem[] = [
  { href: "/", key: "nav.dashboard", icon: House },
  { href: "/income", key: "nav.income", icon: TrendingUp },
  { href: "/fixed-expenses", key: "nav.fixed", icon: Receipt },
  { href: "/expenses", key: "nav.variable", icon: ShoppingBag },
  { href: "/debts", key: "nav.debts", icon: HandCoins },
  { href: "/savings", key: "nav.savings", icon: PiggyBank },
  { href: "/accounts", key: "nav.accounts", icon: Landmark },
  { href: "/history", key: "nav.history", icon: CalendarDays },
  { href: "/settings", key: "nav.settings", icon: Settings },
];

const MOBILE_PRIMARY = ["/", "/income", "/expenses", "/savings"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { loading, error, data, clearError, mode } = useStore();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const current = NAV.find((n) => isActive(n.href));
  const primary = NAV.filter((n) => MOBILE_PRIMARY.includes(n.href));
  const secondary = NAV.filter((n) => !MOBILE_PRIMARY.includes(n.href));
  const moreActive = secondary.some((n) => isActive(n.href));

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-card/70 px-4 py-6 md:flex">
        <Link href="/" className="mb-8 flex items-center gap-3 px-2">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-xl shadow-card">🪙</span>
          <span className="text-lg font-extrabold tracking-tight">Finanzplaner</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, key, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[15px] font-bold transition ${
                isActive(href) ? "bg-primary-soft text-primary-dark" : "text-ink-soft hover:bg-cream hover:text-ink"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={2.25} />
              {t(key)}
            </Link>
          ))}
        </nav>
        <div className="mt-auto px-2 pt-6 text-xs text-ink-muted">
          {mode === "mock" ? t("shell.demoHint") : t("shell.connected")}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-line bg-cream/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-base md:hidden">🪙</span>
              <span className="truncate text-base font-extrabold md:text-lg">
                <span className="md:hidden">Finanzplaner</span>
                <span className="hidden md:inline">{current ? t(current.key) : "Finanzplaner"}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              {mode === "mock" && (
                <span className="hidden rounded-full bg-warn-soft px-2.5 py-1 text-xs font-bold text-warn sm:inline">{t("shell.demo")}</span>
              )}
              <LanguageToggle />
            </div>
          </div>
        </header>

        {/* Error banner */}
        {error && (
          <div className="mx-auto mt-3 flex w-full max-w-3xl items-start gap-3 px-4">
            <div className="flex w-full items-start gap-3 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-bold">{t("shell.errorTitle")}</div>
                <div className="break-words">{error}</div>
              </div>
              <button type="button" onClick={clearError} aria-label={t("common.close")} className="rounded-full p-1 hover:bg-danger/10">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-5 pb-28 md:pb-12">
          {loading || !data ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-ink-muted">
              {loading ? <LoaderCircle className="h-8 w-8 animate-spin text-primary" /> : <TriangleAlert className="h-8 w-8 text-danger" />}
              <span className="text-sm font-semibold">{loading ? t("shell.loading") : t("shell.loadFailed")}</span>
            </div>
          ) : (
            <div key={pathname} className="animate-rise">
              {children}
            </div>
          )}
        </main>

        {/* Bottom navigation (mobile) */}
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
          <div className="mx-auto grid max-w-3xl grid-cols-5">
            {primary.map(({ href, key, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold ${isActive(href) ? "text-primary-dark" : "text-ink-muted"}`}
              >
                <span className={`grid h-8 w-12 place-items-center rounded-full ${isActive(href) ? "bg-primary-soft" : ""}`}>
                  <Icon className="h-5 w-5" strokeWidth={2.25} />
                </span>
                {t(key)}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold ${moreActive || moreOpen ? "text-primary-dark" : "text-ink-muted"}`}
            >
              <span className={`grid h-8 w-12 place-items-center rounded-full ${moreActive || moreOpen ? "bg-primary-soft" : ""}`}>
                <Ellipsis className="h-5 w-5" strokeWidth={2.25} />
              </span>
              {t("nav.more")}
            </button>
          </div>
        </nav>

        {/* "More" sheet (mobile) */}
        {moreOpen && (
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMoreOpen(false)}>
            <div className="absolute inset-0 bg-ink/30" />
            <div
              className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-float animate-rise"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-line" />
              <div className="grid grid-cols-2 gap-3">
                {secondary.map(({ href, key, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl border border-line px-4 py-4 font-bold ${
                      isActive(href) ? "bg-primary-soft text-primary-dark" : "bg-cream text-ink"
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.25} />
                    {t(key)}
                  </Link>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between px-1 text-xs text-ink-muted">
                <span>{mode === "mock" ? t("shell.demoHint") : t("shell.connected")}</span>
                <LanguageToggle />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
