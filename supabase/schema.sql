-- ============================================================
-- FITLAB COACH APP — Database Schema
-- Esegui questo script in: Supabase > SQL Editor > New query
-- ============================================================

-- Clienti
create table if not exists clients (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  name text not null,
  surname text not null,
  email text,
  phone text,
  notes text,
  subscription_end date
);

-- Mesi di allenamento
create table if not exists training_months (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  client_id uuid not null references clients(id) on delete cascade,
  label text not null,       -- es. "Gennaio 2026"
  year smallint not null,
  month_num smallint not null,  -- 1-12
  notes text
);

-- Settimane
create table if not exists training_weeks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  month_id uuid not null references training_months(id) on delete cascade,
  week_number smallint not null,  -- 1, 2, 3, 4
  date_start date,
  date_end date,
  notes text
);

-- Giorni
create table if not exists training_days (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  week_id uuid not null references training_weeks(id) on delete cascade,
  day_number smallint not null,  -- 1, 2, 3
  label text not null,           -- es. "Giorno 1"
  day_date date,
  notes text
);

-- Sezioni workout (Warm Up, Forza, Accessori, Workout)
create table if not exists workout_sections (
  id uuid default gen_random_uuid() primary key,
  day_id uuid not null references training_days(id) on delete cascade,
  section_type text not null check (
    section_type in ('warmup', 'strength', 'accessories', 'workout')
  ),
  order_index smallint not null default 0
);

-- Esercizi
create table if not exists exercises (
  id uuid default gen_random_uuid() primary key,
  section_id uuid not null references workout_sections(id) on delete cascade,
  name text not null,
  sets text,        -- es. "4"
  reps text,        -- es. "10-12"
  load text,        -- es. "20kg"
  rest_time text,   -- es. "90\""
  notes text,
  order_index smallint not null default 0
);

-- Indici per performance
create index if not exists idx_training_months_client on training_months(client_id);
create index if not exists idx_training_weeks_month on training_weeks(month_id);
create index if not exists idx_training_days_week on training_days(week_id);
create index if not exists idx_workout_sections_day on workout_sections(day_id);
create index if not exists idx_exercises_section on exercises(section_id);

-- ============================================================
-- SICUREZZA: Disabilita RLS (versione admin-only, no login)
-- Se in futuro aggiungi login clienti, abilita RLS e aggiungi policy
-- ============================================================
alter table clients disable row level security;
alter table training_months disable row level security;
alter table training_weeks disable row level security;
alter table training_days disable row level security;
alter table workout_sections disable row level security;
alter table exercises disable row level security;
