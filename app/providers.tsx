"use client";

import type { ReactNode } from "react";
import { LanguageProvider } from "@/lib/i18n";
import { DataProvider } from "@/lib/store";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <DataProvider>{children}</DataProvider>
    </LanguageProvider>
  );
}
