-- ============================================================
-- FITLAB COACH APP — Giorni chiusi alle prenotazioni
-- Esegui questo script in: Supabase > SQL Editor > New query
-- ============================================================

-- Giorni in cui i clienti NON possono spostare/prenotare un allenamento.
-- Gli allenamenti già fissati in quella data restano validi:
-- il blocco vale solo per NUOVE prenotazioni fatte dal cliente.
-- La coach (vista coach) può sempre prenotare, anche nei giorni chiusi.
create table if not exists closed_days (
  day_date date primary key,
  reason text,
  created_at timestamptz default now() not null
);

-- Chiusura di Ferragosto 2026
insert into closed_days (day_date, reason)
values ('2026-08-14', 'Chiusura Ferragosto')
on conflict (day_date) do nothing;
