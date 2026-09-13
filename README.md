# Finanzplaner

Ein einfacher, visueller Finanzplaner für eine Person. Next.js (App Router) + TypeScript + Tailwind CSS, Daten in Supabase, Deployment auf Vercel. Deutsch ist Standard, Englisch per Schalter im Header.

## Schnellstart

```bash
npm install
npm run dev
```

Ohne Supabase-Konfiguration läuft die App im **Demo-Modus** mit Beispieldaten im Speicher (Phase 1). Änderungen gehen beim Neuladen verloren. Im Header steht dann „Demo“.

## Supabase anbinden (Phase 2)

1. Neues Supabase-Projekt anlegen.
2. Inhalt von [`supabase/schema.sql`](supabase/schema.sql) im SQL-Editor ausführen. Das legt alle Tabellen an und seedet nur die Stammdaten (Konten „Sparkasse“, „Revolut Personal“ und „Revolut Ahorro“ mit Startsaldo 0, Kategorien „Essen“ und „Freizeit“, eine Settings-Zeile mit Sparkasse als Quell- und Revolut Ahorro als Sparkonto). Keine erfundenen Beträge.
5. Nach dem ersten Start auf der Seite **Konten** für jedes Konto den echten Kontostand und das Datum eintragen, an dem er galt.
3. `.env.example` nach `.env.local` kopieren und die zwei Werte aus *Project Settings → API* eintragen:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

4. `npm run dev` neu starten. Die App erkennt die Variablen und nutzt ab sofort Supabase (im Header verschwindet „Demo“).

Die Umschaltung passiert in [`lib/data/index.ts`](lib/data/index.ts): sind beide Variablen gesetzt, wird [`lib/data/supabase.ts`](lib/data/supabase.ts) verwendet, sonst [`lib/data/mock.ts`](lib/data/mock.ts). Beide implementieren dieselbe `DataApi`-Schnittstelle aus [`lib/data/api.ts`](lib/data/api.ts).

## Deployment auf Vercel

1. Repo zu GitHub pushen (`git add -A && git commit -m "Finanzplaner" && git push`).
2. Projekt in Vercel importieren (Framework wird automatisch als Next.js erkannt).
3. Die zwei Umgebungsvariablen `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` eintragen.
4. Deploy. Es ist keine weitere Konfiguration nötig.

Die Seite hat keinen Login. `robots.txt` (aus [`app/robots.ts`](app/robots.ts)) verbietet allen Suchmaschinen die Indexierung, zusätzlich ist `noindex` als Meta-Tag gesetzt. Wer die URL kennt, kann die App benutzen.

## Wie die App rechnet

- **Frei verfügbar** = Einnahmen des Monats (feste + einmalige) − aktive Fixkosten − Rücklage des Monats.
- **Rücklage**: Die Sparregel (Prozent vom Einkommen oder fester Betrag) erzeugt pro Monat automatisch genau eine Einzahlung (`savings_transactions.auto_month = 'YYYY-MM'`). Sie wird für den laufenden Monat bei Änderungen an Regel oder Einnahmen nachgezogen; vergangene Monate bleiben unangetastet.
- **Aus Rücklagen bezahlt**: Eine variable Ausgabe mit gesetztem `paid_from_savings` erzeugt automatisch eine verknüpfte Entnahme (`savings_transactions.expense_id`). Solche Ausgaben zählen nicht gegen das Monatsbudget, sondern gegen die Rücklagen.
- **Fixkosten-Historie**: Feste Einnahmen und Fixkosten tragen `valid_from` / `valid_to`. Wird ein Betrag (oder Aktiv-Status) einer Zeile geändert, die schon in einem früheren Monat galt, schließt die App die alte Zeile zum Monatsende des Vormonats und legt eine neue ab dem laufenden Monat an. Der Verlauf vergangener Monate bleibt dadurch korrekt.
- **Kontostände**: Jedes Konto hat einen `starting_balance` und ein `balance_date` (Stand am Ende dieses Tages). Der aktuelle Stand = Startsaldo + alle Einnahmen auf dem Konto − alle Fixkosten und variablen Ausgaben vom Konto − Sparüberweisungen vom Konto + Sparüberweisungen aufs Konto, jeweils nur für Buchungen nach dem `balance_date` und bis heute (Fixkosten werden pro Monat materialisiert, zukünftige Tage zählen noch nicht). So lässt sich der Stand jederzeit mit der Bank-App vergleichen. Die Konten-Seite zeigt pro Konto den Verlauf mit Zwischenstand.
- **Sparen als echte Überweisung**: Die Sparregel hat ein Quellkonto (`settings.savings_source_account_id`, Standard Sparkasse) und ein Sparkonto (`settings.savings_account_id`, Standard Revolut Ahorro). Jede Einzahlung belastet das Quellkonto (`savings_transactions.account_id`) und schreibt dem Sparkonto gut; eine Entnahme belastet das Sparkonto und schreibt dem Konto gut, von dem die Ausgabe bezahlt wurde.
- **Währung** immer im deutschen Format (`1.234,56 €`), Datumsformat je nach Sprache (`13.09.2026` / `09/13/2026`).

## Struktur

```
app/                   Seiten (Übersicht, Einnahmen, Fixkosten, Ausgaben, Schulden, Sparen, Konten, Verlauf, Einstellungen)
components/            UI-Bausteine, Formulare, Charts (recharts), Einstellungs-Widgets
lib/data/              Datenmodell, DataApi-Interface, Mock- und Supabase-Implementierung, Seed
lib/store.tsx          Zentraler Client-Store mit der Geschäftslogik
lib/calc.ts            Reine Berechnungen (Monatsübersicht, Kategorien, Sparverlauf, Buchungsliste)
lib/i18n/              de.json / en.json + Provider (Sprache in localStorage)
supabase/schema.sql    Datenbankschema + Stammdaten-Seed
```
