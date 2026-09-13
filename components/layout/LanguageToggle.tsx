"use client";

import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { Language } from "@/lib/data/types";

export function LanguageToggle({ size = "sm" }: { size?: "sm" | "lg" }) {
  const { lang, setLang } = useI18n();
  const { data, updateSettings } = useStore();

  const choose = (l: Language) => {
    if (l === lang) return;
    setLang(l);
    if (data) void updateSettings({ language: l });
  };

  const btn = (l: Language, label: string) => (
    <button
      key={l}
      type="button"
      onClick={() => choose(l)}
      aria-pressed={lang === l}
      className={`rounded-full font-bold transition ${size === "lg" ? "px-5 py-2.5 text-base" : "px-3 py-1.5 text-xs"} ${
        lang === l ? "bg-ink text-cream shadow" : "text-ink-soft hover:text-ink"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="inline-flex items-center rounded-full border border-line bg-card p-0.5" role="group" aria-label="Sprache / Language">
      {btn("de", "DE")}
      {btn("en", "EN")}
    </div>
  );
}
