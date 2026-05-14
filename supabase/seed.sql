-- ============================================================
-- FITLAB COACH APP — Seed Data (tutti i clienti reali)
-- Esegui nel Supabase SQL Editor DOPO schema.sql
-- ============================================================

DO $$
DECLARE
  c_id UUID; m_id UUID; w_id UUID; d_id UUID;
  s_wu UUID; s_str UUID; s_acc UUID; s_wod UUID;
BEGIN

-- ================================================================
-- 1. THOMAS PASIAN | scad 21/11/2026 | Powerlifting 3x/sett.
-- ================================================================
INSERT INTO clients (name, surname, subscription_end, notes)
VALUES ('Thomas', 'Pasian', '2026-11-21', 'Powerlifting – squat, panca, stacco')
RETURNING id INTO c_id;
INSERT INTO training_months (client_id, label, year, month_num)
VALUES (c_id, 'Maggio 2026', 2026, 5) RETURNING id INTO m_id;

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 1, '2026-05-11', '2026-05-15') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Squat') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike', '1', '5 min', '', 'Ritmo facile', 1),
  (s_wu, 'Air Squat', '2', '10', '30"', '', 2),
  (s_wu, 'Glute Bridge', '2', '12', '30"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Back Squat', '5', '3', '3 min', 'RPE 8', 1),
  (s_str, 'Romanian Deadlift', '4', '6', '2 min', 'RPE 7', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Bulgarian Split Squat', '3', '8/lato', '75"', '', 1),
  (s_acc, 'Leg Curl', '3', '12', '60"', '', 2),
  (s_acc, 'Calf Raise', '3', '15', '45"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Dead Bug', '3', '10/lato', '30"', '', 1),
  (s_wod, 'Side Plank', '3', '30"', '30"', 'Per lato', 2),
  (s_wod, 'Plank', '3', '40"', '30"', '', 3);

INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Panca e Tirata') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Row', '1', '4 min', '', '', 1),
  (s_wu, 'Band Pull Apart', '2', '15', '30"', '', 2),
  (s_wu, 'Scapular Push-Up', '2', '10', '', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Bench Press bilanciere', '5', '3', '3 min', 'RPE 8', 1),
  (s_str, 'Strict Press bilanciere', '3', '5', '90"', 'RPE 7', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Lat Machine', '4', '10', '90"', '', 1),
  (s_acc, 'Pull-Up assistiti', '3', '6', '90"', 'Con elastico', 2),
  (s_acc, 'Triceps Pushdown', '3', '12', '60"', '', 3),
  (s_acc, 'DB Curl', '3', '12', '60"', '', 4);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Pallof Press', '3', '10/lato', '30"', 'Con elastico', 1),
  (s_wod, 'Plank', '3', '40"', '30"', '', 2);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 2, '2026-05-18', '2026-05-22') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Stacco') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike', '1', '5 min', '', '', 1),
  (s_wu, 'Hip Hinge Drill', '2', '10', '', '', 2),
  (s_wu, 'Glute Bridge', '2', '12', '', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Deadlift', '5', '3', '3 min', 'RPE 8.5', 1),
  (s_str, 'Front Squat', '3', '5', '2 min', 'RPE 7', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Hip Thrust bilanciere', '3', '10', '90"', '', 1),
  (s_acc, 'Leg Curl', '3', '12', '60"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Dead Bug', '3', '10/lato', '30"', '', 1),
  (s_wod, 'Side Plank', '3', '35"', '30"', 'Per lato', 2);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Push Press + Pull') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'SkiErg', '1', '4 min', '', '', 1),
  (s_wu, 'Shoulder CARs', '2', '5/lato', '', '', 2),
  (s_wu, 'Band Pull Apart', '2', '15', '', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Push Press bilanciere', '5', '4', '90"', 'RPE 7.5', 1),
  (s_str, 'Bench Press bilanciere', '4', '5', '90"', 'RPE 7.5', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Lat Machine', '4', '10', '90"', '', 1),
  (s_acc, 'Pulley rematore', '3', '10', '75"', '', 2),
  (s_acc, 'DB Shoulder Press', '3', '10', '75"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Plank', '3', '45"', '30"', '', 1),
  (s_wod, 'Dead Bug', '3', '10/lato', '30"', '', 2);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 3, '2026-05-25', '2026-05-29') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Squat Picco') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike', '1', '5 min', '', '', 1),
  (s_wu, 'Air Squat', '2', '10', '30"', '', 2),
  (s_wu, 'Monster Walk con elastico', '2', '12', '', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Back Squat', '4', '3', '3 min', 'RPE 9 – picco', 1),
  (s_str, 'Romanian Deadlift', '4', '5', '2 min', 'RPE 8', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Bulgarian Split Squat', '3', '8/lato', '75"', '', 1),
  (s_acc, 'Hip Thrust bilanciere', '3', '8', '90"', '', 2),
  (s_acc, 'Leg Curl', '3', '10', '60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Dead Bug', '3', '10/lato', '30"', '', 1),
  (s_wod, 'Side Plank', '3', '40"', '30"', 'Per lato', 2);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Panca Picco') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Row', '1', '4 min', '', '', 1),
  (s_wu, 'Scapular Push-Up', '2', '10', '', '', 2),
  (s_wu, 'Band Pull Apart', '2', '15', '', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Bench Press bilanciere', '4', '3', '3 min', 'RPE 9 – picco', 1),
  (s_str, 'Rematore bilanciere', '4', '8', '2 min', 'RPE 8', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Pull-Up assistiti', '5', '5', '90"', '', 1),
  (s_acc, 'Lat Machine', '3', '10', '75"', '', 2),
  (s_acc, 'Face Pull elastico', '3', '15', '45"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Plank su Fitball', '3', '40"', '30"', '', 1),
  (s_wod, 'Stir the Pot su Fitball', '3', '10', '30"', '', 2);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 4, '2026-06-01', '2026-06-05') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Scarico Squat') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike', '1', '5 min', '', '', 1),
  (s_wu, 'Air Squat', '2', '10', '30"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Back Squat', '3', '5', '90"', 'RPE 6.5 – scarico', 1),
  (s_str, 'Romanian Deadlift', '3', '8', '90"', 'RPE 6.5', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Leg Curl', '2', '12', '60"', '', 1),
  (s_acc, 'Calf Raise', '2', '15', '45"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Dead Bug', '2', '8/lato', '30"', '', 1),
  (s_wod, 'Side Plank', '2', '25"', '30"', 'Per lato', 2);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Scarico Upper') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Row', '1', '4 min', '', '', 1),
  (s_wu, 'Scapular Push-Up', '2', '10', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Bench Press bilanciere', '3', '5', '90"', 'RPE 6.5 – scarico', 1),
  (s_str, 'Strict Press', '2', '6', '90"', 'RPE 6', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Lat Machine', '3', '8', '75"', '', 1),
  (s_acc, 'Rematore manubri', '2', '10/lato', '75"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Plank', '2', '30"', '30"', '', 1),
  (s_wod, 'Dead Bug', '2', '8/lato', '30"', '', 2);

-- ================================================================
-- 2. ELENA BERTOCCHI | scad 15/05/2026 | Trail running + forza
-- ================================================================
INSERT INTO clients (name, surname, subscription_end, notes)
VALUES ('Elena', 'Bertocchi', '2026-05-15', 'Trail running e rinforzo – 2 sessioni/settimana')
RETURNING id INTO c_id;
INSERT INTO training_months (client_id, label, year, month_num)
VALUES (c_id, 'Aprile 2026', 2026, 4) RETURNING id INTO m_id;

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 1, '2026-04-07', '2026-04-11') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Upper + Core') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike o Row', '1', '5 min', '', 'RPE 5', 1),
  (s_wu, 'Band Pull Apart', '2', '15', '30"', '', 2),
  (s_wu, 'Scapular Push-Up', '2', '10', '', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Bench Press manubri', '4', '10', '75"', 'RPE 7', 1),
  (s_str, 'Lat Machine presa neutra', '4', '10', '75"', 'RPE 7', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'DB Shoulder Press', '3', '10', '60"', '', 1),
  (s_acc, 'Rematore manubrio singolo', '3', '10/lato', '60"', '', 2),
  (s_acc, 'Alzate laterali manubri', '3', '12', '45"', '', 3),
  (s_acc, 'Triceps Pushdown elastico', '3', '15', '45"', '', 4);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Dead Bug', '3', '10/lato', '30"', '', 1),
  (s_wod, 'Plank', '3', '35"', '30"', '', 2),
  (s_wod, 'Side Plank', '3', '25"', '30"', 'Per lato', 3);

INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Lower + Running') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Treadmill camminata veloce', '1', '5 min', '', '', 1),
  (s_wu, 'Glute Bridge', '2', '12', '30"', '', 2),
  (s_wu, 'Monster Walk elastico', '2', '12', '', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Goblet Squat', '4', '10', '75"', 'RPE 7', 1),
  (s_str, 'Romanian Deadlift manubri', '4', '10', '75"', 'RPE 7', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Step Up box', '3', '10/lato', '60"', '', 1),
  (s_acc, 'Affondi in camminata', '3', '10/lato', '60"', '', 2),
  (s_acc, 'Hip Thrust su panca', '3', '15', '60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Corsa treadmill o outdoor', '1', '20-25 min', '', 'Ritmo conversazionale', 1),
  (s_wod, 'Plank', '2', '30"', '30"', '', 2);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 2, '2026-04-14', '2026-04-18') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Upper') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Row', '1', '5 min', '', '', 1),
  (s_wu, 'Band Pull Apart', '2', '15', '', '', 2),
  (s_wu, 'Scapular Push-Up', '2', '10', '', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Bench Press manubri', '4', '8', '75"', 'RPE 7.5 – carico +', 1),
  (s_str, 'Lat Machine presa neutra', '4', '10', '75"', 'RPE 7.5', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'DB Shoulder Press', '3', '10', '60"', '', 1),
  (s_acc, 'Rematore manubrio singolo', '3', '10/lato', '60"', '', 2),
  (s_acc, 'Alzate laterali', '3', '12', '45"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Dead Bug', '3', '10/lato', '30"', '', 1),
  (s_wod, 'Plank', '3', '40"', '30"', '', 2);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Lower') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Treadmill', '1', '5 min', '', '', 1),
  (s_wu, 'Glute Bridge', '2', '12', '', '', 2),
  (s_wu, 'Monster Walk', '2', '12', '', 'Elastico', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Goblet Squat', '4', '10', '75"', 'RPE 7.5', 1),
  (s_str, 'Romanian Deadlift manubri', '4', '8', '75"', 'RPE 7.5', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Step Up box', '3', '10/lato', '60"', '', 1),
  (s_acc, 'Affondi in camminata', '3', '10/lato', '60"', '', 2),
  (s_acc, 'Hip Thrust', '3', '12', '60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Corsa treadmill', '1', '25 min', '', 'Ritmo medio', 1),
  (s_wod, 'Dead Bug', '2', '10/lato', '30"', '', 2);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 3, '2026-04-22', '2026-04-26') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Upper Intensificazione') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike', '1', '5 min', '', '', 1),
  (s_wu, 'Band Pull Apart', '2', '15', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Bench Press manubri', '5', '6', '90"', 'RPE 8', 1),
  (s_str, 'Lat Machine', '4', '8', '90"', 'RPE 8', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'DB Shoulder Press', '3', '8', '60"', '', 1),
  (s_acc, 'Rematore manubrio', '3', '10/lato', '60"', '', 2),
  (s_acc, 'Alzate laterali', '3', '15', '45"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Dead Bug', '3', '12/lato', '30"', '', 1),
  (s_wod, 'Plank', '3', '45"', '30"', '', 2);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Lower Intensificazione') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Treadmill con salita', '1', '6 min', '', 'RPE 5-6', 1),
  (s_wu, 'Glute Bridge', '2', '15', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Goblet Squat', '5', '8', '90"', 'RPE 8', 1),
  (s_str, 'Romanian Deadlift manubri', '4', '8', '90"', 'RPE 8', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Step Up box con manubri', '3', '10/lato', '60"', '', 1),
  (s_acc, 'Hip Thrust', '3', '12', '75"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Corsa outdoor o treadmill', '1', '30 min', '', 'Ritmo medio-sostenuto', 1);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 4, '2026-04-28', '2026-05-02') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Scarico Upper') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike', '1', '5 min', '', '', 1),
  (s_wu, 'Band Pull Apart', '2', '15', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Bench Press manubri', '3', '10', '75"', 'RPE 6.5 – scarico', 1),
  (s_str, 'Lat Machine', '3', '10', '75"', 'RPE 6.5', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'DB Shoulder Press', '2', '10', '60"', '', 1),
  (s_acc, 'Alzate laterali', '2', '12', '45"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Plank', '2', '30"', '30"', '', 1),
  (s_wod, 'Dead Bug', '2', '8/lato', '30"', '', 2);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Scarico Lower') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Treadmill', '1', '5 min', '', '', 1),
  (s_wu, 'Glute Bridge', '2', '12', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Goblet Squat', '3', '10', '75"', 'RPE 6.5 – scarico', 1),
  (s_str, 'Romanian Deadlift manubri', '3', '10', '75"', 'RPE 6.5', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Step Up box', '2', '10/lato', '60"', '', 1),
  (s_acc, 'Hip Thrust', '2', '15', '60"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Corsa leggera', '1', '20 min', '', 'Ritmo facile – scarico', 1);

-- ================================================================
-- 3. GIULIA AGOSTINETTO | scad 15/05/2026 | Forza + Condizionamento
-- ================================================================
INSERT INTO clients (name, surname, subscription_end, notes)
VALUES ('Giulia', 'Agostinetto', '2026-05-15', 'Forza + condizionamento – 2 sessioni/settimana')
RETURNING id INTO c_id;
INSERT INTO training_months (client_id, label, year, month_num)
VALUES (c_id, 'Aprile 2026', 2026, 4) RETURNING id INTO m_id;

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 1, '2026-04-07', '2026-04-11') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Squat + Condizionamento') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Cardio a scelta', '1', '4 min', '', 'Row o Bike o Treadmill', 1),
  (s_wu, 'Cossack Squat', '3', '6-8/lato', '', '', 2),
  (s_wu, 'Glute Bridge con manubrio', '2', '20', '30"', '', 3),
  (s_wu, 'Prono Plank', '2', '30"', '', '', 4);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Back Squat', '4', '8', '3 min', 'RPE 7-9 progressivo', 1),
  (s_str, 'Supinated Bent Over Row', '3', '8-10', '90"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'DB Reverse Curl', '3', '12-15', '45"', '', 1),
  (s_acc, 'DB Push Press', '3', '15', '60"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'DB Push Press', '18-15-12-9', 'reps', '', 'For time con Row 200m ogni giro', 1),
  (s_wod, 'Hanging Knee Tucks', '18-15-12-9', 'reps', '', '', 2),
  (s_wod, 'Row', '4', '200 mt', '', 'Dopo ogni round', 3);

INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Upper Body') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Row', '1', '3 min', '', '', 1),
  (s_wu, 'Dislocazioni con elastico', '2', '20', '', '', 2),
  (s_wu, 'Push-Up in ginocchio', '2', '10', '', '', 3),
  (s_wu, 'Affondi alternati', '2', '12', '', '', 4);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Incline DB Bench Press', '4', '12-10-8-max', '3 min', 'RPE 8 ogni set', 1),
  (s_str, 'Romanian Deadlift manubri', '3', '15-12-10', '60"', 'Carico crescente', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Supinated Grip Body Row', '3', '12', '2 min', 'Diretto in Gorilla Row', 1),
  (s_acc, 'KB Gorilla Row alternato', '3', '30"', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Sit-Up con Med Ball 6 kg', '3', '15', '30"', '', 1),
  (s_wod, 'Reverse Crunch', '3', '15', '30"', '', 2),
  (s_wod, 'Ab Rollout', '3', '8-10', '30"', '', 3);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 2, '2026-04-14', '2026-04-18') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Back Squat') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Cardio a scelta', '3', '90"', '', '', 1),
  (s_wu, 'Front Foot Elevated Split Squat', '3', '6-8/lato', '', '', 2),
  (s_wu, 'Clamshell Side Plank Hip Thrust', '3', '8-12/lato', '', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Back Squat', '4', '3', '3 min', 'RPE 7-9 progressivo', 1),
  (s_str, 'Barbell Bent Over Row', '3', '10-12', '90"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'DB Curl 1-1-4', '3', '12-15', '60"', '', 1);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Row calories', '10-20-30', 'cal', '', 'For time', 1),
  (s_wod, 'Sit-Up', '10-20-30', 'reps', '', '', 2),
  (s_wod, 'Push-Up', '10-20-30', 'reps', '', '', 3);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Upper Body') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Cardio', '1', '2 min', '', '', 1),
  (s_wu, 'Shoulder CARs', '2', '5/lato', '', '', 2),
  (s_wu, 'Band Pull Apart', '2', '15', '', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Strict Press bilanciere', '4', '6', '2 min', 'RPE 7', 1),
  (s_str, 'Incline DB Bench Press', '3', '10', '90"', 'RPE 7', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Lat Machine', '3', '10', '75"', '', 1),
  (s_acc, 'Face Pull elastico', '3', '15', '45"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Sit-Up con Med Ball', '3', '15', '30"', '', 1),
  (s_wod, 'Plank', '3', '40"', '30"', '', 2);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 3, '2026-04-22', '2026-04-26') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Lower Intensificazione') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Cardio', '1', '4 min', '', '', 1),
  (s_wu, 'Glute Bridge', '2', '15', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Back Squat', '4', '5', '3 min', 'RPE 8', 1),
  (s_str, 'Romanian Deadlift', '3', '12', '75"', 'RPE 7.5', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Step Up box', '3', '10/lato', '60"', '', 1),
  (s_acc, 'Hip Thrust', '3', '12', '75"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Sit-Up', '3', '15', '30"', '', 1),
  (s_wod, 'Plank', '3', '40"', '30"', '', 2);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Upper Intensificazione') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Row', '1', '4 min', '', '', 1),
  (s_wu, 'Scapular Push-Up', '2', '10', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Incline DB Bench Press', '4', '8', '2 min', 'RPE 8', 1),
  (s_str, 'Lat Machine', '4', '8', '90"', 'RPE 8', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'DB Shoulder Press', '3', '10', '60"', '', 1),
  (s_acc, 'Face Pull', '3', '15', '45"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Reverse Crunch', '3', '15', '30"', '', 1),
  (s_wod, 'Ab Rollout', '3', '10', '30"', '', 2);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 4, '2026-04-28', '2026-05-02') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Scarico') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Cardio', '1', '4 min', '', '', 1),
  (s_wu, 'Glute Bridge', '2', '12', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Back Squat', '3', '5', '90"', 'RPE 6.5 – scarico', 1),
  (s_str, 'Romanian Deadlift', '3', '10', '75"', 'RPE 6.5', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Hip Thrust', '2', '15', '60"', '', 1);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Plank', '2', '30"', '30"', '', 1),
  (s_wod, 'Side Plank', '2', '25"', '30"', 'Per lato', 2);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Scarico Upper') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike', '1', '4 min', '', '', 1),
  (s_wu, 'Band Pull Apart', '2', '15', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'DB Bench Press', '3', '10', '75"', 'RPE 6.5', 1),
  (s_str, 'Lat Machine', '3', '10', '75"', 'RPE 6.5', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Face Pull', '2', '15', '45"', '', 1);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Dead Bug', '2', '10/lato', '30"', '', 1),
  (s_wod, 'Plank', '2', '30"', '30"', '', 2);

-- ================================================================
-- 4. MATTEO SARTOR | scad 15/05/2026 | Pull/Push/Mix 3x/sett.
-- ================================================================
INSERT INTO clients (name, surname, subscription_end, notes)
VALUES ('Matteo', 'Sartor', '2026-05-15', 'Pull/Push/Mix – 3 sessioni/settimana')
RETURNING id INTO c_id;
INSERT INTO training_months (client_id, label, year, month_num)
VALUES (c_id, 'Aprile 2026', 2026, 4) RETURNING id INTO m_id;

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 1, '2026-04-07', '2026-04-11') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Pull Day') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Cardio a scelta', '2-3', '90"', '', 'Bike/Row/Ski', 1),
  (s_wu, 'DB Upright Row', '1', '15-20', '', '', 2),
  (s_wu, 'Hamstring March', '1', '24-30', '', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Hang Clean High Pull', '4', '5', '60"', 'RPE 7', 1),
  (s_str, 'Pull-Up neutro con zavorra', '4', '10', '60"', 'RPE 7 – con elastico se serve', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'DB B-Stance RDL dx', '3-4', '8', '30"', 'RPE 7', 1),
  (s_acc, 'Incline Chest Supported DB Row', '3-4', '12-15', '30"', 'RPE 7', 2),
  (s_acc, 'DB B-Stance RDL sx', '3-4', '8', '30"', 'RPE 7', 3),
  (s_acc, 'Incline Chest Support Rear Delt Swings', '3-4', '15-20', '30"', 'RPE 7', 4);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Weighted Sit-Up', '3', '15-20', '15-30"', '', 1);

INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Push Day') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Cardio a scelta', '3', '90"', '', '', 1),
  (s_wu, 'Half Kneeling Arnold Press', '1', '15-20', '', '', 2),
  (s_wu, 'Walking Lunge', '1', '30', '', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Incline Bench Press', '4', '5', '30"', 'RPE 7', 1),
  (s_str, 'DB Suitcase Reverse Lunge alternato', '4', '16', '60"', 'RPE 7', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Hip Thrust bilanciere', '3-4', '8', '30"', 'RPE 7 – fermo 10" ultima rep', 1),
  (s_acc, 'DB Bench Press', '3-4', '12-15', '60"', 'RPE 7', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Tuck Up in Dip Support', '3', '15-20', '15"', '', 1);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 2, '2026-04-14', '2026-04-18') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Pull Day') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Cardio a scelta', '3', '90"', '', '', 1),
  (s_wu, 'DB Curl to Press', '1', '15-20', '', '', 2),
  (s_wu, 'Goblet Pulse Cyclist Squat', '1', '20', '', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Cyclist Back Squat', '4', '5', '60"', 'RPE 7', 1),
  (s_str, 'Incline DB Twist Curl', '4', '12', '60"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'DB Suitcase Split Squat dx', '3', '8', '30"', 'RPE 7', 1),
  (s_acc, 'DB Spider Curl', '3', '12-15', '30"', '', 2),
  (s_acc, 'DB Suitcase Split Squat sx', '3', '8', '30"', 'RPE 7', 3),
  (s_acc, 'DB Overhead Tricep Extension', '3', '15-20', '30"', 'RPE 7', 4);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'KB Z Press singolo braccio', '3', '10-15', '30"', '', 1);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Push Day') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Cardio a scelta', '3', '90"', '', '', 1),
  (s_wu, 'Scapular Push-Up', '2', '10', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'DB Bench Press', '4', '8', '2 min', 'RPE 7.5', 1),
  (s_str, 'Lat Machine', '3', '10', '90"', 'RPE 7', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'DB Shoulder Press', '3', '10', '60"', '', 1),
  (s_acc, 'Face Pull elastico', '3', '15', '45"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Plank', '3', '40"', '30"', '', 1),
  (s_wod, 'Dead Bug', '3', '10/lato', '30"', '', 2);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 3, '2026-04-22', '2026-04-26') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Pull Day') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Cardio', '3', '90"', '', '', 1),
  (s_wu, 'Monster Walk', '2', '12', '', 'Elastico', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Deadlift', '4', '5', '2 min', 'RPE 8', 1),
  (s_str, 'Pull-Up con zavorra', '4', '8', '90"', 'RPE 8', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'DB B-Stance RDL', '3', '8/lato', '30"', 'RPE 8', 1),
  (s_acc, 'Chest Supported Row', '3', '10-12', '30"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Hollow Hold', '3', '25"', '30"', '', 1),
  (s_wod, 'Sit-Up con peso', '3', '15', '30"', '', 2);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Push Day') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Cardio', '3', '90"', '', '', 1),
  (s_wu, 'Band Pull Apart', '2', '15', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Incline Bench Press', '4', '5', '2 min', 'RPE 8', 1),
  (s_str, 'DB Suitcase Reverse Lunge', '4', '12/lato', '90"', 'RPE 8', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Hip Thrust bilanciere', '4', '8', '30"', 'RPE 8', 1),
  (s_acc, 'DB Shoulder Press', '3', '10', '60"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Plank', '3', '45"', '30"', '', 1),
  (s_wod, 'Dead Bug', '3', '12/lato', '30"', '', 2);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 4, '2026-04-28', '2026-05-02') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Scarico Pull') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Cardio', '2', '90"', '', '', 1),
  (s_wu, 'Glute Bridge', '2', '12', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Deadlift', '3', '5', '2 min', 'RPE 6.5 – scarico', 1),
  (s_str, 'Pull-Up', '3', '6', '90"', 'RPE 6.5', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'DB Row', '2', '10/lato', '60"', '', 1),
  (s_acc, 'Face Pull', '2', '15', '45"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Dead Bug', '2', '10/lato', '30"', '', 1),
  (s_wod, 'Plank', '2', '30"', '30"', '', 2);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Scarico Push') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Cardio', '2', '90"', '', '', 1),
  (s_wu, 'Scapular Push-Up', '2', '10', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Incline Bench Press', '3', '6', '90"', 'RPE 6.5 – scarico', 1),
  (s_str, 'DB Shoulder Press', '3', '10', '75"', 'RPE 6.5', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Hip Thrust', '2', '12', '60"', '', 1),
  (s_acc, 'Alzate laterali', '2', '15', '45"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Hollow Hold', '2', '20"', '30"', '', 1),
  (s_wod, 'Sit-Up', '2', '15', '30"', '', 2);

-- ================================================================
-- 5. LIDENY FACCHIN | scad 29/05/2026 | Full Body 3x/settimana
-- ================================================================
INSERT INTO clients (name, surname, subscription_end, notes)
VALUES ('Lideny', 'Facchin', '2026-05-29', 'Full body 3 sessioni/settimana + running')
RETURNING id INTO c_id;
INSERT INTO training_months (client_id, label, year, month_num)
VALUES (c_id, 'Maggio 2026', 2026, 5) RETURNING id INTO m_id;

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 1, '2026-05-11', '2026-05-15') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day A – Lower + Core') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike', '1', '5 min', '', 'Ritmo facile', 1),
  (s_wu, 'Glute Bridge', '2', '15', '30"', '', 2),
  (s_wu, 'Monster Walk elastico', '2', '12', '', '', 3),
  (s_wu, 'Squat a corpo libero', '2', '10', '', '', 4);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'KB Deadlift', '4', '12', '60"', '2 KB da 10 kg partenza', 1),
  (s_str, 'Affondi posteriori con manubri', '3', '10/gamba', '60"', '2 DB da 5 kg', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'DB Thruster (squat + spinta)', '3', '10', '75"', 'Leggero-medio', 1),
  (s_acc, 'Lat Machine presa triangolo', '3', '10', '60"', '', 2),
  (s_acc, 'Bench Press manubri', '3', '10', '60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Crunch', '2', '15', '30"', '', 1),
  (s_wod, 'Plank', '2', '25-30"', '30"', '', 2);

INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day B – Upper + Cardio') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike o Treadmill', '1', '5 min', '', '', 1),
  (s_wu, 'Band Pull Apart', '2', '12', '', '', 2),
  (s_wu, 'Monster Walk', '2', '10 passi A/I', '', '', 3),
  (s_wu, 'Pass Through con elastico', '1', '20', '', '', 4);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Alzate laterali + frontali manubri', '3', '12/12', '45-60"', '', 1),
  (s_str, 'Curl manubri alternato', '3', '12', '45"', '5 kg', 2),
  (s_str, 'Dip su panca', '3', '12', '60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Farmer Carry con 2 KB', '3', '20 m', '', '12-16 kg', 1),
  (s_acc, 'Overhead Carry 1 manubrio', '2', '20 m/lato', '', '5 kg', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Assault Bike o SkillMill', '1', '8-10 min', '', 'Ritmo tranquillo', 1);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 2, '2026-05-18', '2026-05-22') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day A – Lower + Core') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike', '1', '5 min', '', '', 1),
  (s_wu, 'Cat Cow', '1', '10', '', '', 2),
  (s_wu, 'Glute Bridge', '2', '12', '', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'KB Deadlift', '4', '12', '60"', 'Aumento carico da settimana 1', 1),
  (s_str, 'Affondi posteriori con manubri', '3', '10/gamba', '60"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'DB Thruster', '3', '10', '75"', '', 1),
  (s_acc, 'Lat Machine', '3', '10', '60"', '', 2),
  (s_acc, 'Bench Press manubri', '3', '10', '60"', 'Carico +', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Crunch', '2', '15', '30"', '', 1),
  (s_wod, 'Plank', '2', '30"', '30"', '', 2);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day B – Upper + Cardio') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike', '1', '5 min', '', '', 1),
  (s_wu, 'Spiderman Stretch', '1', '20', '', '', 2),
  (s_wu, 'Band Pull Apart', '2', '20', '', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Alzate laterali + frontali', '3', '12/12', '45-60"', '', 1),
  (s_str, 'Curl manubri alternato', '3', '12', '45"', '', 2),
  (s_str, 'Dip su panca', '3', '12', '60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Farmer Carry 2 KB', '3', '20 m', '', '', 1),
  (s_acc, 'SIT ups con palla 4 kg', '3', '10', '30"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Assault Bike o SkillMill', '1', '8-10 min', '', 'Ritmo tranquillo', 1);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 3, '2026-05-25', '2026-05-29') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day A – Lower') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike + salita', '1', '7 min', '', '', 1),
  (s_wu, 'Glute Bridge', '2', '15', '', '', 2),
  (s_wu, 'Air Squat', '2', '10', '', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'KB Deadlift', '4', '12', '60"', 'Carico massimo tecnico', 1),
  (s_str, 'Affondi posteriori', '3', '10/gamba', '60"', 'Aumento carico', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'DB Thruster', '3', '10', '75"', '', 1),
  (s_acc, 'Lat Machine', '3', '10', '60"', '', 2),
  (s_acc, 'Bench Press manubri', '3', '10', '60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Prono Plank', '2', '25"', '30"', '', 1),
  (s_wod, 'Bird Dog con pesetto 2 kg', '3', '10/10', '30"', '', 2);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day B – Upper') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike', '1', '5 min', '', '', 1),
  (s_wu, 'Shoulder Circle + Plank', '2', '20', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Alzate laterali + frontali', '3', '12/12', '45-60"', '', 1),
  (s_str, 'Curl manubri alternato', '3', '12', '45"', '', 2),
  (s_str, 'Dip su panca', '3', '12', '60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Farmer Carry 2 KB', '3', '20 m', '', '', 1),
  (s_acc, 'Overhead Carry', '2', '20 m/lato', '', '5 kg', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Assault Bike o SkillMill', '1', '8-10 min', '', 'Ritmo tranquillo', 1);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 4, '2026-06-01', '2026-06-05') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day A – Scarico Lower') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike', '1', '5 min', '', '', 1),
  (s_wu, 'Glute Bridge', '2', '10', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'KB Deadlift', '3', '10', '60"', 'Scarico -15%', 1),
  (s_str, 'Affondi posteriori', '2', '8/gamba', '60"', 'Scarico', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Lat Machine', '2', '10', '60"', '', 1),
  (s_acc, 'Bench Press manubri', '2', '10', '60"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Plank', '2', '25"', '30"', '', 1),
  (s_wod, 'Dead Bug', '2', '6/lato', '30"', '', 2);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day B – Scarico Upper') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike', '1', '5 min', '', '', 1),
  (s_wu, 'Band Pull Apart', '2', '12', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Alzate laterali + frontali', '2', '12/12', '45"', 'Scarico', 1),
  (s_str, 'Curl manubri', '2', '12', '45"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Farmer Carry', '2', '20 m', '', 'Scarico', 1);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Assault Bike', '1', '8 min', '', 'Ritmo facile', 1);

-- ================================================================
-- 6. ARIEL | scad 05/06/2026 | Home Gym 3+1 days/week
-- ================================================================
INSERT INTO clients (name, surname, subscription_end, notes)
VALUES ('Ariel', '', '2026-06-05', 'Home gym – 4 settimane dal 18/05')
RETURNING id INTO c_id;
INSERT INTO training_months (client_id, label, year, month_num)
VALUES (c_id, 'Maggio 2026', 2026, 5) RETURNING id INTO m_id;

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 1, '2026-05-18', '2026-05-22') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Lower Body') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Camminata o skipping', '1', '5 min', '', '', 1),
  (s_wu, 'Glute Bridge', '2', '15', '30"', '', 2),
  (s_wu, 'Squat a corpo libero', '2', '10', '', '', 3),
  (s_wu, 'Affondi alternati', '2', '8/lato', '', '', 4);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Goblet Squat con KB o DB', '4', '12', '75"', 'RPE 7', 1),
  (s_str, 'Romanian Deadlift manubri', '3', '12', '75"', 'RPE 7', 2),
  (s_str, 'Affondi posteriori con manubri', '3', '10/lato', '60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Hip Thrust su panca', '3', '15', '60"', '', 1),
  (s_acc, 'Step Up su sedia o box', '3', '10/lato', '60"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Plank', '3', '30"', '30"', '', 1),
  (s_wod, 'Dead Bug', '3', '8/lato', '30"', '', 2),
  (s_wod, 'Side Plank', '2', '20"', '30"', 'Per lato', 3);

INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Upper Body') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Jumping Jack o skipping', '1', '3 min', '', '', 1),
  (s_wu, 'Arm Circle', '2', '10/lato', '', '', 2),
  (s_wu, 'Push-Up inclinati su sedia', '2', '10', '', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Push-Up', '4', '8-10', '75"', 'Standard o inclinati', 1),
  (s_str, 'DB Row singolo braccio', '4', '10/lato', '75"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'DB Shoulder Press', '3', '12', '60"', '', 1),
  (s_acc, 'DB Curl', '3', '12', '45"', '', 2),
  (s_acc, 'Triceps Dip su sedia', '3', '10', '60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Mountain Climber lento', '3', '20', '30"', '', 1),
  (s_wod, 'Hollow Hold', '3', '20"', '30"', '', 2);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 2, '2026-05-25', '2026-05-29') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Lower Body') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Camminata veloce', '1', '5 min', '', '', 1),
  (s_wu, 'Glute Bridge', '2', '15', '', '', 2),
  (s_wu, 'Squat a corpo libero', '2', '12', '', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Goblet Squat', '4', '10', '75"', 'Carico + rispetto settimana 1', 1),
  (s_str, 'Romanian Deadlift', '4', '10', '75"', 'RPE 7.5', 2),
  (s_str, 'Affondi posteriori', '3', '10/lato', '60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Hip Thrust', '3', '12', '60"', '', 1),
  (s_acc, 'Step Up', '3', '10/lato', '60"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Plank', '3', '35"', '30"', '', 1),
  (s_wod, 'Dead Bug', '3', '10/lato', '30"', '', 2);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Upper Body') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Skipping', '1', '3 min', '', '', 1),
  (s_wu, 'Push-Up inclinati', '2', '10', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Push-Up', '4', '10', '75"', 'Carico + o variante piu difficile', 1),
  (s_str, 'DB Row', '4', '10/lato', '75"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'DB Shoulder Press', '3', '12', '60"', '', 1),
  (s_acc, 'DB Curl', '3', '12', '45"', '', 2),
  (s_acc, 'Triceps Dip', '3', '12', '60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Mountain Climber', '3', '20', '30"', '', 1),
  (s_wod, 'Hollow Hold', '3', '25"', '30"', '', 2);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 3, '2026-06-01', '2026-06-05') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Lower Intensificazione') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Camminata veloce', '1', '5 min', '', '', 1),
  (s_wu, 'Glute Bridge', '2', '15', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Goblet Squat', '5', '8', '90"', 'RPE 8', 1),
  (s_str, 'Romanian Deadlift', '4', '8', '90"', 'RPE 8', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Bulgarian Split Squat', '3', '8/lato', '75"', '', 1),
  (s_acc, 'Hip Thrust', '3', '12', '60"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Plank', '3', '40"', '30"', '', 1),
  (s_wod, 'Side Plank', '3', '25"', '30"', 'Per lato', 2);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Upper Intensificazione') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Skipping', '1', '3 min', '', '', 1),
  (s_wu, 'Arm Circle', '2', '10/lato', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Push-Up', '5', '8', '90"', 'RPE 8', 1),
  (s_str, 'DB Row', '4', '10/lato', '90"', 'RPE 8', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'DB Shoulder Press', '3', '10', '60"', '', 1),
  (s_acc, 'Triceps Dip', '3', '12', '60"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Mountain Climber lento', '3', '20', '30"', '', 1),
  (s_wod, 'Hollow Hold', '3', '30"', '30"', '', 2);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 4, '2026-06-08', '2026-06-12') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Scarico Lower') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Camminata', '1', '5 min', '', '', 1),
  (s_wu, 'Glute Bridge', '2', '12', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Goblet Squat', '3', '10', '75"', 'RPE 6.5 – scarico', 1),
  (s_str, 'Romanian Deadlift', '3', '10', '75"', 'RPE 6.5', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Hip Thrust', '2', '15', '60"', '', 1);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Plank', '2', '30"', '30"', '', 1),
  (s_wod, 'Dead Bug', '2', '8/lato', '30"', '', 2);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Scarico Upper') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Skipping', '1', '3 min', '', '', 1),
  (s_wu, 'Push-Up inclinati', '2', '8', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Push-Up', '3', '8', '75"', 'RPE 6.5 – scarico', 1),
  (s_str, 'DB Row', '3', '10/lato', '75"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'DB Shoulder Press', '2', '12', '60"', '', 1),
  (s_acc, 'DB Curl', '2', '12', '45"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Mountain Climber', '2', '20', '30"', '', 1),
  (s_wod, 'Hollow Hold', '2', '20"', '30"', '', 2);

-- ================================================================
-- 7. DIANA FOGOAROSI | scad 05/06/2026 | Full Body 3x/sett.
-- ================================================================
INSERT INTO clients (name, surname, subscription_end, notes)
VALUES ('Diana', 'Fogoarosi', '2026-06-05', 'Full body 3 sessioni/settimana – forza funzionale')
RETURNING id INTO c_id;
INSERT INTO training_months (client_id, label, year, month_num)
VALUES (c_id, 'Maggio 2026', 2026, 5) RETURNING id INTO m_id;

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 1, '2026-05-11', '2026-05-15') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Squat + Spinta') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike', '1', '6 min', '', '3 easy + 2 medium + 1 hard', 1),
  (s_wu, 'Air Squat', '2', '12', '30"', '', 2),
  (s_wu, 'KB Deadlift', '2', '10', '', '12 kg', 3),
  (s_wu, 'Seated Press', '2', '10', '', '5 kg', 4);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Goblet Squat KB', '3', '15', '90"', '12 kg partenza', 1),
  (s_str, 'DB Bench Press', '3', '10', '90"', '7.5+7.5 kg', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Foot Elevated Front Lunges', '2', '20', '90"', '2 DB 7.5 kg', 1),
  (s_acc, 'Step Up box 50 cm', '2', '8/lato', '60"', '1 KB controllato', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Row', '1', '1000 m', '', '500 easy + 300 medium + 200 sprint', 1),
  (s_wod, 'Plank', '2', '60"', '30"', '', 2),
  (s_wod, 'Sit-Up con Med Ball', '2', '20', '30"', '', 3);

INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Schiena + Braccia') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Row', '1', '4 min', '', '', 1),
  (s_wu, 'Pass Through con elastico', '1', '20', '', '', 2),
  (s_wu, 'Shoulder Tap dal Plank', '2', '20', '', 'Lenti e controllati', 3),
  (s_wu, 'Good Morning con disco 10 kg', '1', '15', '', '', 4);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'KB Gorilla Row', '3', '16', '90"', '', 1),
  (s_str, 'Floor Press con manubri', '3', '16', '90"', '7.5 kg partenza', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Hummer Curl + Press', '2', '16', '60"', '2 DB 5 kg', 1),
  (s_acc, 'Zanetti Press manubri', '2', '12', '60"', '2.5-5 kg', 2),
  (s_acc, 'Pull Over su panca', '3', '10', '60"', 'DB 7.5 kg', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Farmer Carry 2 KB', '3', '40 m', '60"', '12+12 kg', 1);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 2, '2026-05-18', '2026-05-22') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Front Squat') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike', '1', '3 min', '', '', 1),
  (s_wu, 'Jump Rope', '2', '60"', '', '', 2),
  (s_wu, 'Cossack Squat', '2', '12', '', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Front Squat', '5', '8', '2 min', 'RPE 7 – incremento 2.5/5 kg', 1),
  (s_str, 'Affondi in camminata con manubri', '4', '12', '90"', '2 DB 5-7.5 kg', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Step Up con manubrio', '3', '8/lato', '60"', '10 kg', 1),
  (s_acc, 'American Swing KB', '3', '16', '60"', '12 kg', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'AMRAP 8 min', '1', '', '', '80 Single Unders + 16 Step Up + 16 Swing', 1);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Schiena + Gambe Catena Post.') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Row', '1', '2 min', '', '', 1),
  (s_wu, 'Back Extension', '2', '20', '', '', 2),
  (s_wu, 'Medball Thruster', '2', '15', '', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Romanian DL KB', '3', '15', '90"', '2 KB 12 kg', 1),
  (s_str, 'Body Row con discesa lenta 3 sec', '3', '8', '90"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Alzate laterali manubri', '3', '20', '60"', '2.5 kg', 1),
  (s_acc, 'Distensioni tricipiti da seduto', '3', '8/braccio', '60"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Bike', '1', '5 min', '', 'Media resistenza', 1),
  (s_wod, 'KB Pass Through in quadrupedia', '3', '10', '30"', '', 2);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 3, '2026-05-25', '2026-05-29') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Lower Intensificazione') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike', '1', '5 min', '', '', 1),
  (s_wu, 'Air Squat', '2', '12', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Goblet Squat KB', '4', '12', '90"', 'RPE 8 – carico max tecnico', 1),
  (s_str, 'DB Bench Press', '4', '8', '90"', 'RPE 8', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Affondi in camminata', '3', '12/lato', '60"', '', 1),
  (s_acc, 'Step Up box', '3', '8/lato', '60"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Row', '1', '1000 m', '', 'Ritmo sostenuto', 1),
  (s_wod, 'Plank', '3', '60"', '30"', '', 2);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Schiena Intensificazione') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Row', '1', '4 min', '', '', 1),
  (s_wu, 'Band Pull Apart', '2', '15', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'KB Gorilla Row', '4', '12', '90"', 'RPE 8', 1),
  (s_str, 'Floor Press', '4', '10', '90"', 'RPE 8', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Pull Over su panca', '3', '10', '60"', '', 1),
  (s_acc, 'Farmer Carry 2 KB', '3', '40 m', '60"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Sit-Up con Med Ball', '3', '20', '30"', '', 1),
  (s_wod, 'Russian Twist con KB', '3', '20', '30"', '', 2);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 4, '2026-06-01', '2026-06-05') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Scarico') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike', '1', '5 min', '', '', 1),
  (s_wu, 'Air Squat', '2', '10', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Goblet Squat', '3', '12', '75"', 'Scarico -15%', 1),
  (s_str, 'DB Bench Press', '3', '10', '75"', 'Scarico', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Affondi', '2', '10/lato', '60"', '', 1);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Plank', '2', '45"', '30"', '', 1),
  (s_wod, 'Dead Bug', '2', '8/lato', '30"', '', 2);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Scarico Upper') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Row', '1', '3 min', '', '', 1),
  (s_wu, 'Shoulder Tap', '2', '20', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'KB Gorilla Row', '3', '12', '75"', 'Scarico', 1),
  (s_str, 'Floor Press', '3', '12', '75"', 'Scarico', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Alzate laterali', '2', '15', '45"', '', 1),
  (s_acc, 'Farmer Carry', '2', '30 m', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Bike easy', '1', '5 min', '', 'Defaticamento', 1);

-- ================================================================
-- 8. ESTER CARRER | scad 05/06/2026 | Forza bilanciere 2x/sett.
-- ================================================================
INSERT INTO clients (name, surname, subscription_end, notes)
VALUES ('Ester', 'Carrer', '2026-06-05', 'Forza con bilanciere – 2 sessioni/settimana')
RETURNING id INTO c_id;
INSERT INTO training_months (client_id, label, year, month_num)
VALUES (c_id, 'Maggio 2026', 2026, 5) RETURNING id INTO m_id;

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 1, '2026-05-11', '2026-05-15') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Lower Body + Core') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike', '1', '5 min', '', '', 1),
  (s_wu, 'Monster Walk', '2', '20+20', '', '', 2),
  (s_wu, 'Sumo Squat con KB', '2', '10', '', '', 3),
  (s_wu, 'Flutter Kicks', '2', '30', '', '', 4);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Back Squat', '4', '8', '90"', 'RPE 8', 1),
  (s_str, 'Hip Thrust con bilanciere', '4', '10', '90"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Affondi in camminata con manubri', '3', '10/gamba', '60"', '7.5 kg partenza', 1),
  (s_acc, 'Stacco Rumeno con manubri', '3', '10-12', '60"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Plank con peso (disco 5 kg)', '3', '30-45"', '30"', '', 1),
  (s_wod, 'Russian Twist con KB', '3', '12/lato', '30"', 'KB 16 kg', 2),
  (s_wod, 'Distensione tricipite da seduta', '3', '10/braccio', '30"', '', 3);

INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Upper Body + Core') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Row', '1', '2 min', '', '', 1),
  (s_wu, 'Band Face Pull', '2', '12', '', '', 2),
  (s_wu, 'Press con manubri', '2', '12', '', '', 3),
  (s_wu, 'Renegade Row lenti', '2', '6/lato', '', '', 4);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Military Press con bilanciere', '4', '8-6', '2 min', 'RPE 7-8', 1),
  (s_str, 'Rematore bilanciere', '4', '8-10', '90"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Panca piana con manubri', '4', '8-10', '90"', '', 1),
  (s_acc, 'Hammer Curl con manubri', '3', '10-12', '45"', '', 2),
  (s_acc, 'Ring Row', '3', '12', '60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Hollow Body Hold', '3', '30-45"', '30"', '', 1),
  (s_wod, 'Alzate gambe da terra o sbarra', '3', '15', '30"', '', 2);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 2, '2026-05-18', '2026-05-22') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Deadlift + Split Squat') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Cardio', '1', '2 min', '', '', 1),
  (s_wu, 'Good Morning con elastico', '2', '15', '', '', 2),
  (s_wu, 'Hamstring March con manubri', '2', '15', '', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Deadlift', '4', '6', '90-120"', 'RPE 7-8', 1),
  (s_str, 'Bulgarian Split Squat con manubri', '3', '8-10/lato', '60"', '7.5 kg partenza', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Ring Row', '4', '10', '90"', '', 1),
  (s_acc, 'Russian Swing KB', '3', '15', '45"', 'KB 12 kg', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Russian Twist con KB', '3', '12/lato', '30"', '', 1),
  (s_wod, 'Ab Rollout', '3', '8-10', '30"', '', 2);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Push Press + Upper') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Row', '1', '2 min', '', '', 1),
  (s_wu, 'Band Face Pull', '2', '12', '', '', 2),
  (s_wu, 'Glute Bridge', '2', '20', '', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Push Press con bilanciere', '4', '8-6', '2 min', 'RPE 7-8', 1),
  (s_str, 'Rematore manubrio singolo', '4', '10/lato', '90"', '10 kg partenza', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Panca inclinata con manubri', '4', '8-10', '90"', '', 1),
  (s_acc, 'Arnold Press da seduta', '3', '8/lato', '60"', '', 2),
  (s_acc, 'Tricipiti con elastico', '3', '30"', '45"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Hollow Body Hold', '3', '30-45"', '30"', '', 1),
  (s_wod, 'Knee Tuck alle parallele', '3', '15', '30"', '', 2);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 3, '2026-05-25', '2026-05-29') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Lower Intensificazione') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Treadmill + salita', '1', '5 min', '', '', 1),
  (s_wu, 'Monster Walk', '2', '20+20', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Affondi con bilanciere in back rack', '5', '12', '2 min', 'EMOM 10 min – ogni 2 min', 1),
  (s_str, 'Back Squat', '4', '6', '90"', 'RPE 8.5', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Hip Thrust bilanciere', '4', '8', '90"', 'RPE 8', 1),
  (s_acc, 'Stacco Rumeno manubri', '3', '10', '60"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Russian Twist KB', '3', '12/lato', '30"', '', 1),
  (s_wod, 'Plank con peso', '3', '40"', '30"', '', 2);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Upper Intensificazione') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Row', '1', '3 min', '', '', 1),
  (s_wu, 'Band Pull Apart', '2', '15', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Military Press', '4', '6', '2 min', 'RPE 8', 1),
  (s_str, 'Rematore bilanciere', '4', '8', '90"', 'RPE 8', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Panca piana DB', '4', '8', '90"', 'RPE 8', 1),
  (s_acc, 'Hammer Curl', '3', '10', '45"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Hollow Body Hold', '3', '40"', '30"', '', 1),
  (s_wod, 'Leg Raise', '3', '15', '30"', '', 2);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 4, '2026-06-01', '2026-06-05') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Scarico Lower') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike', '1', '5 min', '', '', 1),
  (s_wu, 'Monster Walk', '2', '15+15', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Back Squat', '3', '5', '90"', 'RPE 6.5 – scarico', 1),
  (s_str, 'Hip Thrust', '3', '10', '75"', 'Scarico', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Affondi leggeri', '2', '10/lato', '60"', '', 1),
  (s_acc, 'Stacco Rumeno', '2', '12', '60"', 'Scarico', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Plank', '2', '30"', '30"', '', 1),
  (s_wod, 'Russian Twist', '2', '10/lato', '30"', '', 2);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Scarico Upper') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Row', '1', '2 min', '', '', 1),
  (s_wu, 'Band Face Pull', '2', '12', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Military Press', '3', '6', '90"', 'RPE 6.5 – scarico', 1),
  (s_str, 'Rematore bilanciere', '3', '10', '75"', 'Scarico', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Panca piana DB', '2', '10', '75"', '', 1),
  (s_acc, 'Ring Row', '2', '12', '60"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Hollow Hold', '2', '25"', '30"', '', 1),
  (s_wod, 'Leg Raise', '2', '12', '30"', '', 2);

-- ================================================================
-- 9. IVAN MOMESSO | scad 05/06/2026 | Schiena + Mobilità 3x/sett.
-- ================================================================
INSERT INTO clients (name, surname, subscription_end, notes)
VALUES ('Ivan', 'Momesso', '2026-06-05', 'Rinforzo schiena e mobilita – 3 sessioni/settimana')
RETURNING id INTO c_id;
INSERT INTO training_months (client_id, label, year, month_num)
VALUES (c_id, 'Maggio 2026', 2026, 5) RETURNING id INTO m_id;

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 1, '2026-05-11', '2026-05-15') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Lower + Core') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike o Treadmill', '1', '5 min', '', 'Ritmo facile', 1),
  (s_wu, 'Cat Cow', '2', '10', '', '', 2),
  (s_wu, 'Glute Bridge', '2', '12', '30"', '', 3),
  (s_wu, 'World Greatest Stretch', '2', '5/lato', '', '', 4);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Goblet Squat', '4', '10', '75"', 'RPE 7', 1),
  (s_str, 'Romanian Deadlift manubri', '3', '10', '75"', 'RPE 7', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Hip Thrust', '3', '12', '75"', '', 1),
  (s_acc, 'Affondi posteriori', '3', '8/lato', '60"', '', 2),
  (s_acc, 'Back Extension', '3', '15', '60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Dead Bug', '3', '8/lato', '30"', '', 1),
  (s_wod, 'Side Plank', '3', '25"', '30"', 'Per lato', 2),
  (s_wod, 'Bird Dog', '3', '10/lato', '30"', '', 3);

INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Upper + Schiena') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Row', '1', '4 min', '', '', 1),
  (s_wu, 'Band Pull Apart', '2', '15', '', '', 2),
  (s_wu, 'Thoracic Rotation', '2', '8/lato', '', 'In quadrupedia', 3),
  (s_wu, 'Scapular Push-Up', '2', '10', '', '', 4);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Lat Machine presa triangolo', '4', '10', '90"', '', 1),
  (s_str, 'Chest Press con manubri', '3', '10', '75"', 'RPE 7', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Pulley rematore', '3', '12', '75"', '', 1),
  (s_acc, 'DB Shoulder Press', '3', '10', '60"', '', 2),
  (s_acc, 'Face Pull elastico', '3', '15', '45"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Pallof Press', '3', '10/lato', '30"', '', 1),
  (s_wod, 'Plank', '3', '35"', '30"', '', 2);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 2, '2026-05-18', '2026-05-22') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Lower + Core') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike', '1', '5 min', '', '', 1),
  (s_wu, 'Cat Cow', '2', '10', '', '', 2),
  (s_wu, 'Monster Walk', '2', '12', '', 'Elastico', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Goblet Squat', '4', '10', '75"', 'Carico + rispetto s1', 1),
  (s_str, 'Romanian Deadlift', '4', '8', '75"', 'RPE 7.5', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Hip Thrust', '3', '12', '75"', '', 1),
  (s_acc, 'Back Extension', '3', '15', '60"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Dead Bug', '3', '10/lato', '30"', '', 1),
  (s_wod, 'Side Plank', '3', '30"', '30"', 'Per lato', 2);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Upper + Schiena') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Row', '1', '4 min', '', '', 1),
  (s_wu, 'Thoracic Rotation', '2', '8/lato', '', '', 2),
  (s_wu, 'Band Pull Apart', '2', '15', '', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Lat Machine', '4', '10', '90"', '', 1),
  (s_str, 'Chest Press manubri', '4', '10', '75"', 'RPE 7.5', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Pulley rematore', '3', '12', '75"', '', 1),
  (s_acc, 'Face Pull elastico', '3', '15', '45"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Plank', '3', '40"', '30"', '', 1),
  (s_wod, 'Bird Dog', '3', '10/lato', '30"', '', 2);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 3, '2026-05-25', '2026-05-29') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Lower Intensificazione') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike', '1', '5 min', '', '', 1),
  (s_wu, 'Cat Cow', '2', '10', '', '', 2),
  (s_wu, 'Glute Bridge', '2', '15', '', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Goblet Squat', '5', '8', '90"', 'RPE 8', 1),
  (s_str, 'Romanian Deadlift', '4', '8', '90"', 'RPE 8', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Hip Thrust', '3', '10', '90"', '', 1),
  (s_acc, 'Back Extension', '3', '15', '60"', '', 2),
  (s_acc, 'Affondi posteriori', '3', '8/lato', '60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Dead Bug', '3', '10/lato', '30"', '', 1),
  (s_wod, 'Side Plank', '3', '35"', '30"', 'Per lato', 2);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Upper Intensificazione') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Row', '1', '4 min', '', '', 1),
  (s_wu, 'Scapular Push-Up', '2', '10', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Lat Machine', '4', '8', '90"', 'RPE 8', 1),
  (s_str, 'Chest Press manubri', '4', '8', '90"', 'RPE 8', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Pulley', '3', '10', '75"', '', 1),
  (s_acc, 'Face Pull', '3', '15', '45"', '', 2),
  (s_acc, 'DB Shoulder Press', '3', '8', '60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Plank su Fitball', '3', '40"', '30"', '', 1),
  (s_wod, 'Dead Bug', '3', '10/lato', '30"', '', 2);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 4, '2026-06-01', '2026-06-05') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Scarico Lower') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike', '1', '5 min', '', '', 1),
  (s_wu, 'Cat Cow', '2', '8', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Goblet Squat', '3', '10', '75"', 'Scarico -15%', 1),
  (s_str, 'Romanian Deadlift', '3', '10', '75"', 'Scarico', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Back Extension', '2', '15', '60"', '', 1),
  (s_acc, 'Hip Thrust', '2', '15', '60"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Dead Bug', '2', '8/lato', '30"', '', 1),
  (s_wod, 'Side Plank', '2', '25"', '30"', 'Per lato', 2);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Scarico Upper') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Row', '1', '3 min', '', '', 1),
  (s_wu, 'Band Pull Apart', '2', '15', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Lat Machine', '3', '10', '75"', 'Scarico', 1),
  (s_str, 'Chest Press manubri', '3', '10', '75"', 'Scarico', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Pulley', '2', '12', '60"', '', 1),
  (s_acc, 'Face Pull', '2', '15', '45"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Plank', '2', '30"', '30"', '', 1),
  (s_wod, 'Bird Dog', '2', '8/lato', '30"', '', 2);

-- ================================================================
-- 10. JESSICA ORMENESE | scad 05/06/2026 | Lower/Upper 2x/sett.
-- ================================================================
INSERT INTO clients (name, surname, subscription_end, notes)
VALUES ('Jessica', 'Ormenese', '2026-06-05', 'Lower/Upper split – 2 sessioni/settimana')
RETURNING id INTO c_id;
INSERT INTO training_months (client_id, label, year, month_num)
VALUES (c_id, 'Maggio 2026', 2026, 5) RETURNING id INTO m_id;

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 1, '2026-05-11', '2026-05-15') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Lower Body') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Row', '1', '3 min', '', '', 1),
  (s_wu, 'Air Squat + Reach', '2', '10', '', '', 2),
  (s_wu, 'Glute Bridge', '2', '8', '', '', 3),
  (s_wu, 'Reverse Lunge', '2', '8/lato', '', '', 4),
  (s_wu, '90/90 Hip Switch', '2', '8/lato', '', '', 5),
  (s_wu, 'Monster Walk', '2', '10', '', 'Con elastico', 6);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Front Squat', '1+3', '5', '75-90"', '1x5 RPE 7.5 poi 3x5 RPE 7', 1),
  (s_str, 'Bulgarian Split Squat manubri', '3', '10/lato', '45-60"', '', 2),
  (s_str, 'Romanian Deadlift manubri', '3', '10', '45-60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Dead Bug', '3', '12', '30"', '', 1),
  (s_acc, 'Knee To Chest', '3', '10', '30"', '', 2),
  (s_acc, 'Side Plank', '3', '30"', '30"', 'Per lato', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'AMRAP 5 min', '1', '', '', 'KB Swing 8 + Box Step Up 8 + Sit Up 6', 1);

INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Upper Body') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike', '1', '3 min', '', '', 1),
  (s_wu, 'Band Pull Apart', '2', '10', '', '', 2),
  (s_wu, 'Push-Up inclinati', '2', '8', '', '', 3),
  (s_wu, 'Scapular Push-Up', '2', '10', '', '', 4),
  (s_wu, 'Dislocazioni con banda', '2', '12', '', '', 5);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Bench Press – EMOM 10 min', '10', '4', '', '4 reps ogni minuto – carico medio', 1),
  (s_str, 'Strict Pull-Up', '3', '8', '45-60"', '', 2),
  (s_str, 'DB Shoulder Press', '3', '10', '45-60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Russian Twist', '3', '12', '30"', '', 1),
  (s_acc, 'Leg Raise', '3', '10', '30"', '', 2),
  (s_acc, 'Plank prono', '3', '60"', '30"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'FOR TIME', '2', '', '', '10 Cal Row + 10 Push-Up + 10 DB Snatch dx / poi sx', 1);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 2, '2026-05-18', '2026-05-22') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Lower Body') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike', '1', '3 min', '', '', 1),
  (s_wu, 'Goblet Squat', '2', '10', '', '', 2),
  (s_wu, 'Step Up', '2', '8/lato', '', '', 3),
  (s_wu, 'Glute Bridge', '2', '10', '', '', 4),
  (s_wu, 'Cossack Squat controllato', '2', '6/lato', '', '', 5);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Deadlift – EMOM 10 min', '10', '4', '', '4 reps ogni minuto – carico medio tecnico', 1),
  (s_str, 'Walking Lunge 2 manubri 10 kg', '3', '12/lato', '45-60"', '', 2),
  (s_str, 'Leg Curl', '3', '12', '45-60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Reverse Crunch', '3', '12', '30"', '', 1),
  (s_acc, 'Pallof Press', '3', '12', '30"', '', 2),
  (s_acc, 'Mountain Climber lento', '3', '20', '30"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'EMOM 5 min', '1', '', '', 'Min 1: 12 KB Swing / Min 2: 8 Burpee Step Back', 1);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Upper Body') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Row', '1', '3 min', '', '', 1),
  (s_wu, 'PVC Pass Through', '2', '10', '', '', 2),
  (s_wu, 'Cat Cow + T-Spine Reach', '2', '8', '', '', 3),
  (s_wu, 'Scapular Push-Up', '2', '10', '', '', 4),
  (s_wu, 'Face Pull elastico', '2', '10', '', '', 5);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Strict Press – Top Set + Back Off', '1+3', '5', '75-90"', '1x5 RPE 7.5 poi 3x5 RPE 7', 1),
  (s_str, 'Pulley Machine', '3', '10', '45-60"', '', 2),
  (s_str, 'Incline DB Bench Press', '3', '10', '45-60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Toe Touch', '3', '10', '30"', '', 1),
  (s_acc, 'Russian Twist', '3', '12', '30"', '', 2),
  (s_acc, 'Hollow Hold', '3', '30"', '30"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'AMRAP 5 min', '1', '', '', '6 Push Press + 8 KB Gorilla Row + 10 Cal Bike', 1);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 3, '2026-05-25', '2026-05-29') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Lower Intensificazione') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike', '1', '3 min', '', '', 1),
  (s_wu, 'Air Squat', '2', '10', '', '', 2),
  (s_wu, 'Deep Squat Hold', '2', '30"', '', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Back Squat', '4', '4', '90"', 'RPE 8 – dopo ogni serie 3 Box Jump', 1),
  (s_str, 'DB Reverse Lunge', '3', '8/lato', '60"', '', 2),
  (s_str, 'Hip Thrust', '3', '10', '60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Fitball Crunch', '3', '12', '30"', '', 1),
  (s_acc, 'Knee Tuck', '3', '10', '30"', '', 2),
  (s_acc, 'Plank su Fitball', '3', '30"', '30"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'FOR TIME x3 giri', '3', '', '', '20 mt Farm Carry 2KB 20 + 10 Step Up + 8 Burpee', 1);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Upper Intensificazione') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Row', '1', '3 min', '', '', 1),
  (s_wu, 'Wall Slide', '2', '10', '', '', 2),
  (s_wu, 'Scapular Push-Up', '2', '10', '', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Push Press – EMOM 10 min', '10', '2', '', '2 Push Press ogni minuto – carico medio/impegnativo', 1),
  (s_str, 'Lat Machine presa stretta', '3', '10', '45-60"', '', 2),
  (s_str, 'DB Bench Press', '3', '10', '45-60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Russian Twist', '3', '12', '30"', '', 1),
  (s_acc, 'Leg Raise', '3', '10', '30"', '', 2),
  (s_acc, 'Hollow Hold', '3', '20"', '30"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'AMRAP 5 min', '1', '', '', '1 min SkillMill + 10 DB Renegade Row + 8 DB Snatch alternati', 1);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 4, '2026-06-01', '2026-06-05') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Lower Scarico') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike', '1', '3 min', '', '', 1),
  (s_wu, 'Goblet Squat', '2', '10', '', '', 2),
  (s_wu, 'Glute Bridge', '2', '10', '', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Front Squat', '3', '5', '75"', 'RPE 6 – fluido e veloce', 1),
  (s_str, 'Goblet Squat', '3', '10', '45"', '', 2),
  (s_str, 'Step Up manubri', '3', '10/lato', '45"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Fitball Crunch', '4', '10', '30"', '', 1),
  (s_acc, 'Dead Bug', '4', '10', '30"', '', 2),
  (s_acc, 'Plank su Fitball', '4', '20"', '30"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Cardio LISS', '1', '8 min', '', 'Bike o SkillMill inclinato – facile', 1);
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Upper Scarico') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Row', '1', '3 min', '', '', 1),
  (s_wu, 'Band Pull Apart', '2', '10', '', '', 2),
  (s_wu, 'Thoracic Extension su Roller', '2', '10', '', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Bench Press tecnica', '3', '5', '75"', 'RPE 6 – scarico', 1),
  (s_str, 'Pulley Machine', '3', '12', '45"', '', 2),
  (s_str, 'DB Shoulder Press', '3', '10', '45"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Russian Twist', '3', '12', '30"', '', 1),
  (s_acc, 'Knee Tuck', '3', '10', '30"', '', 2),
  (s_acc, 'Hollow Hold', '3', '20"', '30"', '', 3),
  (s_acc, 'Fitball Roll Out', '3', '12', '30"', '', 4);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Cardio LISS', '1', '8 min', '', 'Bike – facile', 1);


-- ================================================================
-- 11. LISA FABRIS | scad 05/06/2026 | Lower + Upper 2x/sett. Home
-- ================================================================
INSERT INTO clients (name, surname, subscription_end, notes)
VALUES ('Lisa', 'Fabris', '2026-06-05', 'Home gym – Lower + Upper 2x/settimana')
RETURNING id INTO c_id;
INSERT INTO training_months (client_id, label, year, month_num)
VALUES (c_id, 'Maggio 2026', 2026, 5) RETURNING id INTO m_id;

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 1, '2026-05-11', '2026-05-15') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Lower Body') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike o Row', '1', '5 min', '', '', 1),
  (s_wu, 'Hip CAR in quadrupedia', '2', '10/10', '30"', '', 2),
  (s_wu, 'Shoulder CARs con disco', '2', '8', '30"', '', 3),
  (s_wu, 'Glute Bridge', '2', '15', '30"', '', 4),
  (s_wu, 'Bodyweight Squat lento', '2', '10', '30"', '', 5);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Back Squat bilanciere', '4', '6', '90"', 'Partenza 15 kg RPE 6 – max 20 kg', 1),
  (s_str, 'Sumo Deadlift', '3', '6', '90"', 'Partenza 35 kg RPE 7 – incremento graduale', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Box Step Up con manubri', '3', '10+10', '60"', '5 kg per lato', 1),
  (s_acc, 'Leg Curl machine', '3', '12', '60"', '', 2),
  (s_acc, 'Leg Extension machine', '3', '12', '60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Plank', '3', '40"', '30"', '', 1),
  (s_wod, 'Dead Bug con pesetto', '3', '12', '30"', '5 kg', 2),
  (s_wod, 'Bike o Tappeto', '1', '10 min', '', 'Ritmo moderato', 3);

INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Upper Body') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike o Row', '1', '5 min', '', '', 1),
  (s_wu, 'Hip CAR in quadrupedia', '2', '10/10', '30"', '', 2),
  (s_wu, 'Band Pull Apart', '2', '12', '30"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Bench Press bilanciere', '4', '6', '90"', 'RPE 7 – alternativa DB 4x10', 1),
  (s_str, 'Landmine Press bilanciere', '3', '8/lato', '75"', 'RPE 7', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Rematore singolo su panca', '3', '10/lato', '60"', 'Manubrio 10 kg', 1),
  (s_acc, 'Lat Machine presa neutra', '3', '10', '60"', 'RPE 7', 2),
  (s_acc, 'Shoulder Press manubri seduta', '3', '10', '60"', 'RPE 7', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Pallof Press', '3', '12/lato', '45"', '', 1),
  (s_wod, 'Farmer Carry 2 KB', '3', '30 m', '60"', '2 KB da 16 kg', 2),
  (s_wod, 'Bike o Ski Erg', '1', '10 min', '', '', 3);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 2, '2026-05-18', '2026-05-22') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Lower Body') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike o Row', '1', '5 min', '', '', 1),
  (s_wu, 'Hip CAR in quadrupedia', '2', '10/10', '30"', '', 2),
  (s_wu, 'Glute Bridge', '2', '15', '30"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Back Squat bilanciere', '4', '6', '90"', 'Aumenta 2-3 kg rispetto settimana 1', 1),
  (s_str, 'Sumo Deadlift', '3', '6', '90"', 'RPE 7 – incremento graduale', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Box Step Up con manubri', '3', '10+10', '60"', '', 1),
  (s_acc, 'Leg Curl machine', '3', '12', '60"', '', 2),
  (s_acc, 'Leg Extension machine', '3', '12', '60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Plank', '3', '45"', '30"', '', 1),
  (s_wod, 'Dead Bug con pesetto', '3', '12', '30"', '', 2),
  (s_wod, 'Bike', '1', '10 min', '', '', 3);

INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Upper Body') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike o Row', '1', '5 min', '', '', 1),
  (s_wu, 'Band Pull Apart', '2', '12', '30"', '', 2),
  (s_wu, 'Shoulder CAR con disco', '2', '8', '30"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Bench Press bilanciere', '4', '6', '90"', 'RPE 7 – aumenta 2 kg', 1),
  (s_str, 'Landmine Press bilanciere', '3', '8/lato', '75"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Rematore singolo su panca', '3', '10/lato', '60"', '', 1),
  (s_acc, 'Lat Machine presa neutra', '3', '10', '60"', '', 2),
  (s_acc, 'Shoulder Press manubri seduta', '3', '10', '60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Pallof Press', '3', '12/lato', '45"', '', 1),
  (s_wod, 'Farmer Carry 2 KB', '3', '30 m', '60"', '', 2),
  (s_wod, 'Bike o Ski Erg', '1', '10 min', '', '', 3);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 3, '2026-05-25', '2026-05-29') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Lower Body') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike o Row', '1', '5 min', '', '', 1),
  (s_wu, 'Hip CAR + Glute Bridge', '2', '10+15', '30"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Back Squat bilanciere', '4', '5', '90"', 'RPE 7 – incremento', 1),
  (s_str, 'Sumo Deadlift', '4', '5', '90"', 'RPE 7-8', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Box Step Up con manubri', '3', '10+10', '60"', '', 1),
  (s_acc, 'Leg Curl machine', '3', '12', '60"', '', 2),
  (s_acc, 'Leg Extension machine', '3', '12', '60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Plank', '3', '50"', '30"', '', 1),
  (s_wod, 'Dead Bug', '3', '12', '30"', '', 2),
  (s_wod, 'Bike', '1', '10 min', '', '', 3);

INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Upper Body') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Row o Bike', '1', '5 min', '', '', 1),
  (s_wu, 'Band Pull Apart', '2', '15', '30"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Bench Press bilanciere', '4', '5', '90"', 'RPE 7-8', 1),
  (s_str, 'Landmine Press bilanciere', '3', '8/lato', '75"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Rematore singolo su panca', '3', '10/lato', '60"', '', 1),
  (s_acc, 'Lat Machine presa neutra', '3', '10', '60"', '', 2),
  (s_acc, 'Shoulder Press manubri', '3', '10', '60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Pallof Press', '3', '12/lato', '45"', '', 1),
  (s_wod, 'Farmer Carry 2 KB', '3', '30 m', '60"', '', 2),
  (s_wod, 'Bike o Ski Erg', '1', '10 min', '', '', 3);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 4, '2026-06-01', '2026-06-05') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Lower Scarico') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike', '1', '5 min', '', '', 1),
  (s_wu, 'Glute Bridge', '2', '12', '30"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Back Squat bilanciere', '3', '6', '90"', 'Scarico -15% carico', 1),
  (s_str, 'Sumo Deadlift', '3', '6', '90"', 'Scarico tecnica', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Box Step Up', '2', '10+10', '60"', '', 1),
  (s_acc, 'Leg Curl machine', '2', '12', '60"', '', 2),
  (s_acc, 'Leg Extension machine', '2', '12', '60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Plank', '2', '40"', '30"', '', 1),
  (s_wod, 'Bike', '1', '8 min', '', '', 2);

INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Upper Scarico') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Row', '1', '5 min', '', '', 1),
  (s_wu, 'Band Pull Apart', '2', '12', '30"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Bench Press bilanciere', '3', '6', '90"', 'Scarico -15%', 1),
  (s_str, 'Landmine Press', '2', '8/lato', '75"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Lat Machine', '2', '10', '60"', '', 1),
  (s_acc, 'Shoulder Press manubri', '2', '10', '60"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Pallof Press', '2', '10/lato', '45"', '', 1),
  (s_wod, 'Bike', '1', '8 min', '', '', 2);

-- ================================================================
-- 12. LUCIA DE PIERI | scad 05/06/2026 | Full Body 1x/sett.
-- ================================================================
INSERT INTO clients (name, surname, subscription_end, notes)
VALUES ('Lucia', 'De Pieri', '2026-06-05', 'Full Body 1 sessione/settimana – circuiti')
RETURNING id INTO c_id;
INSERT INTO training_months (client_id, label, year, month_num)
VALUES (c_id, 'Maggio 2026', 2026, 5) RETURNING id INTO m_id;

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 1, '2026-05-11', '2026-05-15') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Sessione Full Body') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Skill Mill camminata', '1', '5 min', '', 'Ritmo facile → medio', 1),
  (s_wu, 'Pass Through con PVC', '2', '12', '', 'Braccia tese ampio', 2),
  (s_wu, 'Band Pull Apart', '2', '15', '', 'Scapole vicine spalle basse', 3),
  (s_wu, 'Monster Walk con miniband', '2', '12+12', '', 'Ginocchia morbide', 4),
  (s_wu, 'Squat corpo libero', '2', '10', '', 'Mobilita schiena neutra', 5);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Goblet Box Squat con KB', '3', '12', '75"', '', 1),
  (s_str, 'Romanian Deadlift DB', '3', '12', '75"', '', 2),
  (s_str, 'Affondi in camminata con manubri', '3', '10+10', '75"', '', 3),
  (s_str, 'Glute Bridge con elastico', '3', '15', '75"', '', 4),
  (s_str, 'Monster Walk laterale elastico', '3', '20+20', '75"', '', 5),
  (s_str, 'Dead Bug controllato', '3', '10+10', '75"', '', 6);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Seated DB Shoulder Press', '3', '10', '75"', '', 1),
  (s_acc, 'Ring Row', '3', '10', '75"', '', 2),
  (s_acc, 'Chest Press manubri su panca', '3', '12', '75"', '', 3),
  (s_acc, 'Curl manubri alternati', '3', '10+10', '75"', '', 4),
  (s_acc, 'Face Pull elastico', '3', '15', '75"', '', 5),
  (s_acc, 'Farmer Carry 1 KB', '3', '30 m', '75"', 'KB 16/20 kg', 6);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Assault Bike o Rower', '1', '5 min', '', 'Ritmo facile', 1),
  (s_wod, 'Child Pose', '2', '30-40"', '', 'Defaticamento', 2);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 2, '2026-05-18', '2026-05-22') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Sessione Full Body') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Skill Mill camminata', '1', '5 min', '', '', 1),
  (s_wu, 'Pass Through con PVC', '2', '12', '', '', 2),
  (s_wu, 'Band Pull Apart', '2', '15', '', '', 3),
  (s_wu, 'Monster Walk con miniband', '2', '12+12', '', '', 4);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Goblet Box Squat con KB', '4', '12', '75"', '1 round in piu rispetto sett 1', 1),
  (s_str, 'Romanian Deadlift DB', '4', '12', '75"', '', 2),
  (s_str, 'Affondi in camminata con manubri', '4', '10+10', '75"', 'Leggero aumento peso', 3),
  (s_str, 'Glute Bridge con elastico', '3', '15', '75"', '', 4),
  (s_str, 'Dead Bug controllato', '3', '10+10', '75"', '', 5);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Seated DB Shoulder Press', '3', '10', '75"', '', 1),
  (s_acc, 'Ring Row', '3', '10', '75"', '', 2),
  (s_acc, 'Chest Press manubri', '3', '12', '75"', '', 3),
  (s_acc, 'Face Pull elastico', '3', '15', '75"', '', 4),
  (s_acc, 'Farmer Carry 1 KB', '3', '30 m', '75"', '', 5);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Assault Bike o Rower', '1', '5 min', '', '', 1);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 3, '2026-05-25', '2026-05-29') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Sessione Full Body') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Skill Mill o Bike', '1', '5 min', '', '', 1),
  (s_wu, 'Pass Through + Band Pull Apart', '2', '12+15', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Goblet Box Squat con KB', '4', '12', '75"', '', 1),
  (s_str, 'Romanian Deadlift DB', '4', '12', '75"', '', 2),
  (s_str, 'Affondi in camminata con manubri', '4', '10+10', '75"', 'Aumenta ancora', 3),
  (s_str, 'Glute Bridge elastico', '3', '15', '75"', '', 4),
  (s_str, 'Dead Bug', '3', '10+10', '75"', '', 5);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Seated DB Shoulder Press', '3', '10', '75"', '', 1),
  (s_acc, 'Ring Row', '3', '10', '75"', '', 2),
  (s_acc, 'Chest Press manubri', '3', '12', '75"', '', 3),
  (s_acc, 'Face Pull elastico', '3', '15', '75"', '', 4),
  (s_acc, 'Farmer Carry 1 KB', '3', '30 m', '75"', '', 5);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Assault Bike o Rower', '1', '5 min', '', '', 1);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 4, '2026-06-01', '2026-06-05') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Sessione Full Body Scarico') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Camminata attiva', '1', '5 min', '', '', 1),
  (s_wu, 'Pass Through + Monster Walk', '2', '12+12', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Goblet Box Squat con KB', '3', '12', '75"', 'Scarico volume', 1),
  (s_str, 'Romanian Deadlift DB', '3', '12', '75"', '', 2),
  (s_str, 'Affondi in camminata', '3', '8+8', '75"', '', 3),
  (s_str, 'Glute Bridge', '3', '15', '60"', '', 4);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Shoulder Press manubri', '2', '10', '60"', '', 1),
  (s_acc, 'Ring Row', '2', '10', '60"', '', 2),
  (s_acc, 'Chest Press manubri', '2', '10', '60"', '', 3),
  (s_acc, 'Face Pull elastico', '2', '15', '60"', '', 4);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Rower o Bike', '1', '5 min', '', 'Defaticamento facile', 1);

-- ================================================================
-- 13. MATTEO ROSSATO | scad 05/06/2026 | Forza 2x/sett.
-- ================================================================
INSERT INTO clients (name, surname, subscription_end, notes)
VALUES ('Matteo', 'Rossato', '2026-06-05', 'Forza bilanciere + rinforzo ginocchio – 2x/settimana')
RETURNING id INTO c_id;
INSERT INTO training_months (client_id, label, year, month_num)
VALUES (c_id, 'Maggio 2026', 2026, 5) RETURNING id INTO m_id;

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 1, '2026-05-11', '2026-05-15') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Squat + Push') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike 3 min + mobilita', '1', '5 min', '', '', 1),
  (s_wu, 'Glute Bridge + Clamshell miniband', '2', '15+12/12', '', '', 2),
  (s_wu, 'Air Squat + Push-up su rialzo', '1', '10+10', '', '', 3),
  (s_wu, 'Box Step Up alternato', '1', '10/10', '', '', 4);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Box Squat con bilanciere 20 kg', '4', '6-8', '90"', 'RPE 7 – box come sicurezza ginocchio', 1),
  (s_str, 'Leg Extension range controllato', '3', '10-12', '60"', 'No lockout – flessione controllata', 2),
  (s_str, 'Chest Press manubri su panca inclinata', '4', '10', '90"', 'RPE 7-8', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Farmer Carry 2 KB 16 kg', '3', '40 m', '60"', '', 1),
  (s_acc, 'Sled Push su tappeto in salita', '3', '1 min', '60"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Dead Bug', '3', '10/10', '30"', '', 1),
  (s_wod, 'Plank', '3', '40"', '30"', '', 2),
  (s_wod, 'Side Plank hold', '3', '20"/lato', '30"', '', 3),
  (s_wod, 'Intervalli 30 Ski Erg + 30 Bike', '8', '30"+30"', '', 'Cardio leggero finale', 4);

INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Stacco + Spinta Verticale') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Ski Erg o Rower', '1', '3 min', '', '', 1),
  (s_wu, 'Mobilita toracica + ponte con estensione', '1', '8/lato', '', '', 2),
  (s_wu, 'Bird Dog', '2', '10/10', '', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Deadlift', '4', '8', '120"', 'RPE 7 – massima attivazione posteriori', 1),
  (s_str, 'Good Morning con bilanciere leggero', '3', '10', '90"', 'Focus catena posteriore', 2),
  (s_str, 'Overhead Press manubri', '4', '8', '90"', 'In piedi o seduto', 3),
  (s_str, 'Pull-up assistiti con elastico', '3', '10', '90"', '', 4);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Hollow Hold', '3', '20"', '30"', '', 1),
  (s_acc, 'Pallof Press con elastico', '3', '10/10', '30"', '', 2),
  (s_acc, 'Russian Twist', '3', '20', '30"', 'Controllato', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'EMOM 10 min – 30 Ski Erg + 30 Burpees parziali', '10', '30"+30"', '', '', 1);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 2, '2026-05-18', '2026-05-22') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Push Press + Panca Inclinata') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Rower + Ski 2 min ciascuno', '1', '4 min', '', '', 1),
  (s_wu, 'Push Up + Banded Face Pull', '2', '10+20', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Push Press', '4', '8', '90"', 'RPE 7-9 progressivo', 1),
  (s_str, 'Incline Bench Press manubri', '4', '8', '90"', 'Incrementa dal set 2 al 4', 2),
  (s_str, 'Seated DB Overhead Press', '4', '10', '90"', 'RPE 9', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Leg Extension range controllato', '3', '12', '60"', '', 1),
  (s_acc, 'Farmer Carry', '3', '40 m', '60"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Dead Bug', '3', '10/10', '30"', '', 1),
  (s_wod, 'Plank', '3', '40"', '30"', '', 2),
  (s_wod, 'Cardio leggero Bike o Ski', '1', '8 min', '', '', 3);

INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Stacco + Verticale') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Ski Erg o Rower', '1', '3 min', '', '', 1),
  (s_wu, 'Bird Dog + Scapular Pull', '2', '10/10', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Deadlift', '4', '8', '120"', 'RPE 7-8', 1),
  (s_str, 'Good Morning', '3', '10', '90"', '', 2),
  (s_str, 'Pull-up assistiti', '3', '10', '90"', '', 3),
  (s_str, 'Overhead Press manubri', '3', '8', '90"', '', 4);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Pallof Press', '3', '10/10', '30"', '', 1),
  (s_acc, 'Russian Twist', '3', '20', '30"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'EMOM 10 min – Ski + Burpees parziali', '10', '30"+30"', '', '', 1);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 3, '2026-05-25', '2026-05-29') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Forza') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike + mobilita', '1', '5 min', '', '', 1),
  (s_wu, 'Glute Bridge + Air Squat', '2', '12+10', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Box Squat con bilanciere', '4', '6', '90"', 'RPE 8 – incremento', 1),
  (s_str, 'Chest Press manubri inclinata', '4', '8', '90"', 'RPE 8', 2),
  (s_str, 'Leg Extension', '3', '12', '60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Farmer Carry', '3', '40 m', '60"', '', 1),
  (s_acc, 'Dead Bug', '3', '10/10', '30"', '', 2),
  (s_acc, 'Plank', '3', '45"', '30"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Cardio intervalli Ski + Bike', '8', '30"+30"', '', '', 1);

INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Stacco + Tirata') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Rower o Ski', '1', '3 min', '', '', 1),
  (s_wu, 'Bird Dog + mobilita', '2', '10/10', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Deadlift', '4', '6', '120"', 'RPE 8', 1),
  (s_str, 'Good Morning', '3', '10', '90"', '', 2),
  (s_str, 'Pull-up assistiti', '4', '8', '90"', '', 3),
  (s_str, 'Overhead Press', '3', '8', '90"', '', 4);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Hollow Hold', '3', '20"', '30"', '', 1),
  (s_acc, 'Russian Twist', '3', '20', '30"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'EMOM 10 min cardio', '10', '30"+30"', '', '', 1);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 4, '2026-06-01', '2026-06-05') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day 1 – Scarico') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike + mobilita ginocchio', '1', '5 min', '', '', 1);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Box Squat tecnica', '3', '6', '90"', 'Scarico -15%', 1),
  (s_str, 'Chest Press manubri', '3', '8', '90"', 'Scarico', 2),
  (s_str, 'Leg Extension', '2', '12', '60"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Dead Bug', '2', '10/10', '30"', '', 1),
  (s_acc, 'Plank', '2', '40"', '30"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Cardio leggero Bike', '1', '8 min', '', '', 1);

INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day 2 – Scarico Stacco') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Ski Erg o Rower', '1', '3 min', '', '', 1),
  (s_wu, 'Bird Dog', '2', '8/8', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Deadlift', '3', '6', '120"', 'Scarico tecnica', 1),
  (s_str, 'Pull-up assistiti', '2', '8', '90"', '', 2),
  (s_str, 'Overhead Press', '2', '8', '90"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Pallof Press', '2', '10/10', '30"', '', 1),
  (s_acc, 'Russian Twist', '2', '16', '30"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Cardio leggero', '1', '8 min', '', '', 1);

-- ================================================================
-- 14. MATTEO SCHIOPPALALBA | scad 05/06/2026 | Lower+Upper 2x/sett.
-- ================================================================
INSERT INTO clients (name, surname, subscription_end, notes)
VALUES ('Matteo', 'Schioppalalba', '2026-06-05', 'Forza + prevenzione calcio amatoriale – 2x/settimana')
RETURNING id INTO c_id;
INSERT INTO training_months (client_id, label, year, month_num)
VALUES (c_id, 'Maggio 2026', 2026, 5) RETURNING id INTO m_id;

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 1, '2026-05-11', '2026-05-15') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day A – Lower Body') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike o Skill Mill', '1', '3 min', '', 'Ritmo facile', 1),
  (s_wu, 'Affondo avanti + stretch flessore anca', '1', '6+6', '', 'Dinamico', 2),
  (s_wu, 'World Greatest Stretch', '1', '4+4', '', '', 3),
  (s_wu, 'Good Morning a corpo libero', '1', '10', '', '', 4),
  (s_wu, 'Glute Bridge', '1', '12', '', '', 5),
  (s_wu, 'Monster Walk elastico', '1', '10+10', '', '', 6);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Back Squat', '4', '6', '120"', 'RPE 6.5 – tecnica prima di tutto', 1),
  (s_str, 'Deadlift bilanciere', '3', '6', '120"', 'RPE 7', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Affondi camminati con manubri', '3', '8+8', '90"', '', 1),
  (s_acc, 'Box Step-Up', '3', '8+8', '90"', '', 2),
  (s_acc, 'Hip Thrust', '3', '10', '90"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Dead Bug', '3', '8+8', '30"', '', 1),
  (s_wod, 'Russian Twist', '3', '16', '30"', '', 2),
  (s_wod, 'Side Plank', '2', '30"/lato', '30"', '', 3);

INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day B – Upper Body') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Row o Bike', '1', '3 min', '', '', 1),
  (s_wu, 'Cat Cow', '1', '8', '', '', 2),
  (s_wu, 'Shoulder Pass-Through', '1', '12', '', '', 3),
  (s_wu, 'Band Pull Apart', '1', '15', '', '', 4);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Panca piana bilanciere', '4', '6', '120"', 'RPE 6.5', 1),
  (s_str, 'Press manubri in piedi', '3', '8', '90"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Rematore manubri', '3', '8', '90"', '', 1),
  (s_acc, 'Lat Machine', '3', '10', '90"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Sit-Up', '3', '12', '30"', '', 1),
  (s_wod, 'Mountain Climber lento', '3', '20', '30"', '', 2),
  (s_wod, 'Plank', '3', '40"', '30"', '', 3);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 2, '2026-05-18', '2026-05-22') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day A – Lower Body') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike o Skill Mill', '1', '3 min', '', '', 1),
  (s_wu, 'Mobilita dinamica', '1', '8 min', '', 'Stesso protocollo sett 1', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Deadlift bilanciere', '4', '5', '120"', 'RPE 7 – fondamentale settimana 2', 1),
  (s_str, 'Romanian Deadlift', '3', '8', '90"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Reverse Lunge front rack', '3', '8+8', '90"', '', 1),
  (s_acc, 'Box Step-Up', '3', '8+8', '90"', '', 2),
  (s_acc, 'Glute Bridge carico', '3', '12', '90"', '', 3);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Hanging Knee Raise', '3', '10', '30"', '', 1),
  (s_wod, 'Side Plank', '2', '35"/lato', '30"', '', 2);

INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day B – Upper Body') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Row', '1', '3 min', '', '', 1),
  (s_wu, 'Shoulder Pass-Through + Band Pull Apart', '2', '12+15', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Panca inclinata bilanciere', '4', '6', '120"', 'RPE 7', 1),
  (s_str, 'Press manubri seduto', '3', '8', '90"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'T-Bar Row', '3', '8', '90"', '', 1),
  (s_acc, 'Lat Machine presa neutra', '3', '10', '90"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Sit-Up', '3', '14', '30"', '', 1),
  (s_wod, 'Russian Twist', '3', '20', '30"', '', 2),
  (s_wod, 'Plank', '3', '45"', '30"', '', 3);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 3, '2026-05-25', '2026-05-29') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day A – Lower Body') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike', '1', '3 min', '', '', 1),
  (s_wu, 'Mobilita dinamica standard', '1', '8 min', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Back Squat', '4', '5', '120"', 'RPE 7.5', 1),
  (s_str, 'Deadlift bilanciere', '4', '5', '120"', 'RPE 7.5', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Affondi camminati', '3', '8+8', '90"', '', 1),
  (s_acc, 'Hip Thrust carico', '3', '10', '90"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Dead Bug', '3', '8+8', '30"', '', 1),
  (s_wod, 'Side Plank', '2', '35"/lato', '30"', '', 2),
  (s_wod, 'Plank', '3', '45"', '30"', '', 3);

INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day B – Upper Body') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Row', '1', '3 min', '', '', 1),
  (s_wu, 'Band Pull Apart + Cat Cow', '2', '15+8', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Panca piana bilanciere', '4', '5', '120"', 'RPE 7.5', 1),
  (s_str, 'Press manubri in piedi', '3', '8', '90"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Rematore manubri', '3', '8', '90"', '', 1),
  (s_acc, 'Lat Machine', '3', '10', '90"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Sit-Up', '3', '15', '30"', '', 1),
  (s_wod, 'Mountain Climber', '3', '20', '30"', '', 2),
  (s_wod, 'Plank', '3', '50"', '30"', '', 3);

INSERT INTO training_weeks (month_id, week_number, date_start, date_end)
VALUES (m_id, 4, '2026-06-01', '2026-06-05') RETURNING id INTO w_id;
INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 1, 'Day A – Scarico Lower') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Bike', '1', '3 min', '', '', 1),
  (s_wu, 'Mobilita standard', '1', '5 min', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Back Squat tecnica', '3', '5', '120"', 'Scarico -15%', 1),
  (s_str, 'Deadlift tecnica', '3', '5', '120"', 'Scarico', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Affondi camminati', '2', '8+8', '90"', '', 1),
  (s_acc, 'Hip Thrust', '2', '10', '90"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Dead Bug + Plank', '2', '8/8 + 35"', '30"', '', 1);

INSERT INTO training_days (week_id, day_number, label) VALUES (w_id, 2, 'Day B – Scarico Upper') RETURNING id INTO d_id;
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'warmup', 1) RETURNING id INTO s_wu;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wu, 'Row', '1', '3 min', '', '', 1),
  (s_wu, 'Band Pull Apart', '2', '12', '', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'strength', 2) RETURNING id INTO s_str;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_str, 'Panca piana tecnica', '3', '5', '120"', 'Scarico -15%', 1),
  (s_str, 'Press manubri', '2', '8', '90"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'accessories', 3) RETURNING id INTO s_acc;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_acc, 'Rematore manubri', '2', '8', '90"', '', 1),
  (s_acc, 'Lat Machine', '2', '10', '90"', '', 2);
INSERT INTO workout_sections (day_id, section_type, order_index) VALUES (d_id, 'workout', 4) RETURNING id INTO s_wod;
INSERT INTO exercises (section_id, name, sets, reps, rest_time, notes, order_index) VALUES
  (s_wod, 'Sit-Up + Plank', '2', '12 + 40"', '30"', '', 1);

END;
$$;
