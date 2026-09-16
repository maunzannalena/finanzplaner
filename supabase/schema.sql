-- Finanzplaner – Supabase schema (Phase 2)
-- Run this once in the Supabase SQL editor of a fresh project.
--
-- The app has no login: it talks to these tables with the public anon key.
-- Row level security is enabled with a permissive policy for the anon role so
-- the Supabase dashboard does not flag the tables as "unrestricted" by
-- accident. Anyone who knows the app URL + anon key can read and write.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists accounts (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  -- real balance at the end of balance_date; the app computes everything after that day
  starting_balance  numeric(12,2) not null default 0,
  balance_date      date not null default current_date,
  created_at        timestamptz not null default now()
);

create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists settings (
  id            uuid primary key default gen_random_uuid(),
  savings_mode  text not null default 'percentage' check (savings_mode in ('percentage', 'fixed')),
  savings_value numeric(12,2) not null default 10,
  language      text not null default 'de' check (language in ('de', 'en')),
  -- monthly set-aside is transferred from savings_source_account_id to savings_account_id
  savings_source_account_id uuid references accounts(id) on delete set null,
  savings_account_id        uuid references accounts(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- Recurring rows carry valid_from / valid_to so that editing an amount only
-- affects future months: the app closes the old row at the end of last month
-- and inserts a new one starting this month.
create table if not exists income_fixed (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  amount        numeric(12,2) not null,
  account_id    uuid references accounts(id) on delete set null,
  day_of_month  int not null default 1 check (day_of_month between 1 and 31),
  active        boolean not null default true,
  valid_from    date not null default date_trunc('month', now())::date,
  valid_to      date,
  created_at    timestamptz not null default now()
);

create table if not exists income_onetime (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  amount      numeric(12,2) not null,
  account_id  uuid references accounts(id) on delete set null,
  date        date not null,
  created_at  timestamptz not null default now()
);

create table if not exists expenses_fixed (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  amount        numeric(12,2) not null,
  account_id    uuid references accounts(id) on delete set null,
  day_of_month  int not null default 1 check (day_of_month between 1 and 31),
  active        boolean not null default true,
  valid_from    date not null default date_trunc('month', now())::date,
  valid_to      date,
  created_at    timestamptz not null default now()
);

create table if not exists expenses_variable (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  category_id        uuid references categories(id) on delete set null,
  amount             numeric(12,2) not null,
  account_id         uuid references accounts(id) on delete set null,
  date               date not null,
  paid_from_savings  boolean not null default false,
  created_at         timestamptz not null default now()
);

create table if not exists debts (
  id            uuid primary key default gen_random_uuid(),
  direction     text not null check (direction in ('ana_owes', 'owed_to_ana')),
  person        text not null,
  amount        numeric(12,2) not null,
  note          text not null default '',
  due_date      date,
  installments  int check (installments is null or installments >= 1),
  -- installments already settled (partial payment); the app treats >= installments as fully paid
  paid_installments int not null default 0 check (paid_installments >= 0),
  paid          boolean not null default false,
  created_at    timestamptz not null default now()
);

-- Upgrade path for databases created before partial payments existed (safe to re-run).
alter table debts add column if not exists paid_installments int not null default 0 check (paid_installments >= 0);

create table if not exists savings_transactions (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('deposit', 'withdrawal')),
  amount      numeric(12,2) not null,
  note        text not null default '',
  date        date not null,
  -- 'YYYY-MM' on the automatic monthly deposit of that month (one per month)
  auto_month  text unique,
  -- set when the withdrawal belongs to a variable expense "paid from savings"
  expense_id  uuid unique references expenses_variable(id) on delete cascade,
  -- counter-account: deposits come from it, withdrawals go to it
  account_id  uuid references accounts(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists expenses_variable_date_idx on expenses_variable (date);
create index if not exists income_onetime_date_idx on income_onetime (date);
create index if not exists savings_transactions_date_idx on savings_transactions (date);

-- ---------------------------------------------------------------------------
-- Access: single user, no auth -> anon role may do everything
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array['accounts','categories','settings','income_fixed','income_onetime','expenses_fixed','expenses_variable','debts','savings_transactions']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "anon full access" on %I', t);
    execute format('create policy "anon full access" on %I for all to anon, authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Seed: only the reference data from the data model (no sample transactions)
-- ---------------------------------------------------------------------------

-- Starting balances stay 0 here: Anna enters the real balances in the app (Konten page).
insert into accounts (name)
select v from (values ('Sparkasse'), ('Revolut Privat'), ('Revolut Sparen')) as s(v)
where not exists (select 1 from accounts);

-- Databases seeded before the German account names existed (safe to re-run).
update accounts set name = 'Revolut Privat' where name = 'Revolut Personal';
update accounts set name = 'Revolut Sparen' where name = 'Revolut Ahorro';

insert into categories (name)
select v from (values ('Essen'), ('Freizeit')) as s(v)
where not exists (select 1 from categories);

insert into settings (savings_mode, savings_value, language, savings_source_account_id, savings_account_id)
select
  'percentage', 10, 'de',
  (select id from accounts where name = 'Sparkasse' limit 1),
  (select id from accounts where name = 'Revolut Sparen' limit 1)
where not exists (select 1 from settings);
