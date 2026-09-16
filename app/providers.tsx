"use client";

import type { ReactNode } from "react";
import { LanguageProvider } from "@/lib/i18n";
import { DataProvider } from "@/lib/store";
import { OnboardingProvider } from "@/lib/onboarding";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <DataProvider>
        <OnboardingProvider>{children}</OnboardingProvider>
      </DataProvider>
    </LanguageProvider>
  );
}
