"use client";

import Link from "next/link";
import { ChevronRight, Database, Languages, Landmark, Tag } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useData, useStore } from "@/lib/store";
import { categoryColor } from "@/lib/palette";
import { accountBalance } from "@/lib/calc";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { Card, CardTitle, PageHeader } from "@/components/ui/Card";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { NameListManager } from "@/components/settings/NameListManager";
import { SavingsSettingsCard } from "@/components/settings/SavingsSettingsCard";

export default function SettingsPage() {
  const { t, lang } = useI18n();
  const data = useData();
  const store = useStore();

  return (
    <>
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />

      <div className="flex flex-col gap-4">
        <Card>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-ink-soft" /> {t("settings.language")}
            </span>
          </CardTitle>
          <p className="mb-3 text-sm text-ink-soft">{t("settings.languageHint")}</p>
          <LanguageToggle size="lg" />
        </Card>

        <Card>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-ink-soft" /> {t("settings.accounts")}
            </span>
          </CardTitle>
          <p className="mb-3 text-sm text-ink-soft">{t("settings.accountsHint")}</p>
          <ul className="flex flex-col gap-2">
            {data.accounts.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 rounded-2xl bg-cream/70 px-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate font-bold">{a.name}</span>
                  <span className="block text-xs text-ink-soft">{t("accounts.startingInfo", { amount: formatMoney(a.starting_balance), date: formatDate(a.balance_date, lang) })}</span>
                </span>
                <span className="shrink-0 font-extrabold tnum">{formatMoney(accountBalance(data, a.id))}</span>
              </li>
            ))}
          </ul>
          <Link href="/accounts" className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-[15px] font-bold text-ink shadow-card hover:bg-primary-hover">
            {t("settings.manageAccounts")} <ChevronRight className="h-4 w-4" />
          </Link>
        </Card>

        <Card>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-ink-soft" /> {t("settings.categories")}
            </span>
          </CardTitle>
          <p className="mb-3 text-sm text-ink-soft">{t("settings.categoriesHint")}</p>
          <NameListManager
            items={data.categories}
            onAdd={async (name) => { await store.addCategory(name); }}
            onRename={store.renameCategory}
            onRemove={store.removeCategory}
            placeholder={t("settings.categoryPlaceholder")}
            inUseMessage={t("settings.categoryInUse")}
            colorFor={categoryColor}
          />
        </Card>

        <SavingsSettingsCard />

        <Card>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Database className="h-5 w-5 text-ink-soft" /> {t("settings.data")}
            </span>
          </CardTitle>
          <p className="text-sm text-ink-soft">{store.mode === "mock" ? t("settings.dataDemo") : t("settings.dataSupabase")}</p>
        </Card>
      </div>
    </>
  );
}
