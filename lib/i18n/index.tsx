"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import type { Language } from "@/lib/data/types";
import de from "./de.json";
import en from "./en.json";

export type TKey = keyof typeof de;

// Assigning `en` here makes TypeScript verify that every German key also exists in English.
const enDict: Record<TKey, string> = en;
const dicts: Record<Language, Record<TKey, string>> = { de, en: enDict };

export const LANG_STORAGE_KEY = "finanzplaner.lang";

export type TFn = (key: TKey, params?: Record<string, string | number>) => string;

interface I18nContext {
  lang: Language;
  setLang: (lang: Language) => void;
  t: TFn;
}

const Ctx = createContext<I18nContext | null>(null);

export function readStoredLanguage(): Language | null {
  try {
    const v = localStorage.getItem(LANG_STORAGE_KEY);
    return v === "de" || v === "en" ? v : null;
  } catch {
    return null;
  }
}

// Tiny external store around localStorage so the language can be read with
// useSyncExternalStore (server snapshot "de", client snapshot from storage).
let memoryLang: Language | null = null;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

const getSnapshot = (): Language => memoryLang ?? readStoredLanguage() ?? "de";
const getServerSnapshot = (): Language => "de";

function writeLanguage(l: Language) {
  memoryLang = l;
  try {
    localStorage.setItem(LANG_STORAGE_KEY, l);
  } catch {
    /* localStorage unavailable, keep in-memory only */
  }
  listeners.forEach((cb) => cb());
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Language) => writeLanguage(l), []);

  const t = useCallback<TFn>(
    (key, params) => {
      let s = dicts[lang][key] ?? dicts.de[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, String(v));
      }
      return s;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used inside LanguageProvider");
  return ctx;
}
