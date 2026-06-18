import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://wltgyvkgevrrgznxtkxc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs"
);

const SECTION_ORDER = ["warmup","strength","accessories","core","workout"];
const sec = (sections, type) => sections.find(s => s.section_type === type)?.id;

// ── Trova day IDs ──────────────────────────────────────────────
const WEEKS = {
  1: 'd04b51b6-462f-40e4-9f0f-855baebfbe7b',
  2: '95ac4095-df09-4af2-9fc6-2355471cd5a0',
  3: '07565b75-608d-4d26-b77d-909f83063383',
  4: '33203b19-d565-47ac-a579-1141eb0fcf7a',
};

const dayIds = {};
for (const [wk, wid] of Object.entries(WEEKS)) {
  const { data: days } = await supabase.from("training_days").select("id, day_number").eq("week_id", wid);
  for (const d of days) dayIds[`w${wk}d${d.day_number}`] = d.id;
}
console.log("Day IDs:", dayIds);

// ── Crea sezioni ──────────────────────────────────────────────
const sectionIds = {};
for (const [key, dayId] of Object.entries(dayIds)) {
  const { data: existing } = await supabase.from("workout_sections").select("id, section_type").eq("day_id", dayId);
  if (!existing?.length) {
    await supabase.from("workout_sections").insert(SECTION_ORDER.map((type, i) => ({ day_id: dayId, section_type: type, order_index: i })));
    const { data: created } = await supabase.from("workout_sections").select("id, section_type").eq("day_id", dayId);
    sectionIds[key] = created;
  } else {
    sectionIds[key] = existing;
  }
}

const S = {};
for (const [key, secs] of Object.entries(sectionIds)) {
  S[key] = { W: sec(secs,"warmup"), ST: sec(secs,"strength"), A: sec(secs,"accessories"), C: sec(secs,"core"), WK: sec(secs,"workout") };
}
console.log("Sections ready");

// ── Cancella esercizi esistenti ───────────────────────────────
const allSecs = Object.values(S).flatMap(s => Object.values(s)).filter(Boolean);
await supabase.from("exercises").delete().in("section_id", allSecs);
console.log("Esercizi esistenti cancellati");

// ── Helper ────────────────────────────────────────────────────
const ex = (section_id, name, sets, reps, load, rest_time, notes, order_index) =>
  ({ section_id, name, sets, reps, load, rest_time, notes, order_index });

// ── WARMUP COMUNI ─────────────────────────────────────────────
const wuBike = (sid, min = "4") => [
  ex(sid, "Assault Bike", null, `${min} min`, null, null, "#cardio#", 0),
  ex(sid, "Air Squat", "2", "10", null, null, "#mob#", 1),
  ex(sid, "Glute bridge", "2", "10", null, null, "#att#", 2),
  ex(sid, "Scapular Push Up", "2", "10", null, null, "#mob#", 3),
  ex(sid, "Band Pull Apart", "2", "15", null, null, "#att#", 4),
];
const wuRow = (sid, min = "4", lastEx = "Banded Row") => [
  ex(sid, "Rower", null, `${min} min`, null, null, "#cardio#", 0),
  ex(sid, "Bird Dog", "2", "10", null, null, "#mob#", 1),
  ex(sid, "Dead Bug", "2", "10", null, null, "#mob#", 2),
  ex(sid, "KB Romanian Deadlift", "2", "10", null, null, "#mob#", 3),
  ex(sid, lastEx, "2", "15", null, null, "#att#", 4),
];

// ── BENCH PRESS ONDA (nota solo sull'ultima riga) ────────────
const benchWave = (sid, p5, p3, p1, startIdx = 1) => [
  ex(sid, "Bench Press", "1", "5", `${p5}%`, "120 sec", "#upper#", startIdx),
  ex(sid, "Bench Press", "1", "3", `${p3}%`, "120 sec", "#upper#", startIdx + 1),
  ex(sid, "Bench Press", "1", "1", `${p1}%`, "120 sec", `#upper# 5@${p5}% · 3@${p3}% · 1@${p1}% — ONDA × 2`, startIdx + 2),
];

const rows = [

  // ══════════════════════════════════════════════════════════════
  // WEEK 1 DAY 1 – SQUAT + BENCH + PULL UP
  // ══════════════════════════════════════════════════════════════
  ...wuBike(S.w1d1.W),
  // Forza (2 righe separate: Top + Back Off)
  ex(S.w1d1.ST, "Back Squat", "1", "5", "80%",    "120 sec", "#lower#", 0),
  ex(S.w1d1.ST, "Back Squat", "3", "5", "72-75%", "120 sec", "#lower#", 1),
  ...benchWave(S.w1d1.ST, 75, 80, 85, 2),
  // Accessori
  ex(S.w1d1.A, "Pull Up",               "4", "6",     null,    "90 sec", null, 0),
  ex(S.w1d1.A, "Bulgarian Split Squat", "3", "8+8",   null,    "75 sec", null, 1),
  ex(S.w1d1.A, "DB Arnold Press",       "3", "10",    null,    "60 sec", null, 2),
  ex(S.w1d1.A, "Leg extention",         "3", "12-15", null,    "60 sec", null, 3),
  // Core
  ex(S.w1d1.C, "Hanging Knee Raise", "3", "10-12",    null, null, null, 0),
  ex(S.w1d1.C, "Side Plank",         "3", "40''/lato",null, null, null, 1),

  // ══════════════════════════════════════════════════════════════
  // WEEK 1 DAY 2 – DEADLIFT + PRESS + DIP
  // ══════════════════════════════════════════════════════════════
  ...wuRow(S.w1d2.W),
  // Forza
  ex(S.w1d2.ST, "Deadlift", "1", "5", "80%",    "120 sec", "#lower#", 0),
  ex(S.w1d2.ST, "Deadlift", "3", "5", "72-75%", "120 sec", "#lower#", 1),
  ex(S.w1d2.ST, "Strict Press Bilanciere", "5", "5", "75%", "90 sec", "#upper#", 2),
  // Accessori
  ex(S.w1d2.A, "Dip",                   "4", "6",  null, "90 sec", null, 0),
  ex(S.w1d2.A, "Lat Machine Presa Neutra", "3", "10", null, "75 sec", null, 1),
  ex(S.w1d2.A, "Pulley Machine",        "3", "10", null, "75 sec", null, 2),
  ex(S.w1d2.A, "Filly Press",           "3", "10", null, "60 sec", null, 3),
  ex(S.w1d2.A, "DB Lateral Raise",      "3", "15", null, "60 sec", null, 4),
  // Core
  ex(S.w1d2.C, "Ab Wheel Rollout",   "3", "10",      null, null, null, 0),
  ex(S.w1d2.C, "Farmer Carry Pesante","3", "30-40 MT",null, null, null, 1),

  // ══════════════════════════════════════════════════════════════
  // WEEK 2 DAY 1 – SQUAT + BENCH + PULL UP
  // ══════════════════════════════════════════════════════════════
  ...wuBike(S.w2d1.W),
  // Forza
  ex(S.w2d1.ST, "Back Squat", "1", "4", "85%",    "120 sec", "#lower#", 0),
  ex(S.w2d1.ST, "Back Squat", "4", "4", "77-80%", "120 sec", "#lower#", 1),
  ...benchWave(S.w2d1.ST, 77, 82, 87, 2),
  // Accessori
  ex(S.w2d1.A, "Pull Up",               "5", "5",     null,    "90 sec", null, 0),
  ex(S.w2d1.A, "Bulgarian Split Squat", "3", "8+8",   "RPE 8", "75 sec", null, 1),
  ex(S.w2d1.A, "DB Arnold Press",       "3", "10",    null,    "60 sec", null, 2),
  ex(S.w2d1.A, "Leg extention",         "3", "12-15", null,    "60 sec", null, 3),
  // Core
  ex(S.w2d1.C, "Hanging Knee Raise", "3", "12",       null, null, null, 0),
  ex(S.w2d1.C, "Side Plank",         "3", "45''/lato",null, null, null, 1),

  // ══════════════════════════════════════════════════════════════
  // WEEK 2 DAY 2 – DEADLIFT + PRESS + DIP
  // ══════════════════════════════════════════════════════════════
  ...wuRow(S.w2d2.W, "4", "Push Up"),
  // Forza
  ex(S.w2d2.ST, "Deadlift", "1", "4", "85%",    "150 sec", "#lower#", 0),
  ex(S.w2d2.ST, "Deadlift", "4", "4", "77-80%", "150 sec", "#lower#", 1),
  ex(S.w2d2.ST, "Strict Press Bilanciere", "5", "4", "80%", "90 sec", "#upper#", 2),
  // Accessori
  ex(S.w2d2.A, "Dip",                   "5", "5",     null, "90 sec", null, 0),
  ex(S.w2d2.A, "Lat Machine Presa Neutra","3","10",   null, "75 sec", null, 1),
  ex(S.w2d2.A, "Barbell Row",           "3", "10",    null, "75 sec", null, 2),
  ex(S.w2d2.A, "Filly Press",           "3", "10",    null, "60 sec", null, 3),
  ex(S.w2d2.A, "DB Lateral Raise",      "3", "15",    null, "60 sec", null, 4),
  ex(S.w2d2.A, "Leg curl",              "3", "12-15", null, "60 sec", null, 5),
  // Core
  ex(S.w2d2.C, "Ab Wheel Rollout",    "3", "10-12",   null, null, null, 0),
  ex(S.w2d2.C, "Farmer Carry Pesante","4", "30-40 MT",null, null, null, 1),

  // ══════════════════════════════════════════════════════════════
  // WEEK 3 DAY 1 – SQUAT + BENCH + PULL UP
  // ══════════════════════════════════════════════════════════════
  // Warmup con Jump Rope
  ex(S.w3d1.W, "Corda",          null, "2 min", null, null, "#cardio#", 0),
  ex(S.w3d1.W, "Air Squat",      "2",  "10",    null, null, "#mob#",    1),
  ex(S.w3d1.W, "Glute bridge",   "2",  "10",    null, null, "#att#",    2),
  ex(S.w3d1.W, "Scapular Push Up","2", "10",    null, null, "#mob#",    3),
  ex(S.w3d1.W, "Band Pull Apart","2",  "15",    null, null, "#att#",    4),
  // Forza
  ex(S.w3d1.ST, "Back Squat", "1", "3", "88-90%", "150 sec", "#lower#", 0),
  ex(S.w3d1.ST, "Back Squat", "4", "3", "80-82%", "150 sec", "#lower#", 1),
  ...benchWave(S.w3d1.ST, 80, 85, 90, 2),
  // Accessori
  ex(S.w3d1.A, "Pull Up Zavorrato",    "6", "4",     null,    "90 sec", "Se possibile leggera zavorra", 0),
  ex(S.w3d1.A, "Bulgarian Split Squat","3", "8+8",   "RPE 8.5","75 sec", null, 1),
  ex(S.w3d1.A, "DB Arnold Press",      "3", "10",    null,    "60 sec", null, 2),
  ex(S.w3d1.A, "Leg extention",        "3", "15",    null,    "60 sec", null, 3),
  // Core
  ex(S.w3d1.C, "Hanging Knee Raise", "3", "12",       null, null, null, 0),
  ex(S.w3d1.C, "Side Plank",         "3", "45''/lato",null, null, null, 1),

  // ══════════════════════════════════════════════════════════════
  // WEEK 3 DAY 2 – DEADLIFT + PRESS + DIP
  // ══════════════════════════════════════════════════════════════
  ...wuRow(S.w3d2.W),
  // Forza
  ex(S.w3d2.ST, "Deadlift", "1", "3", "88-90%", "150 sec", "#lower#", 0),
  ex(S.w3d2.ST, "Deadlift", "4", "3", "80-82%", "150 sec", "#lower#", 1),
  ex(S.w3d2.ST, "Strict Press Bilanciere", "5", "3", "85%", "90 sec", `#upper# Rec 90-120"`, 2),
  // Accessori
  ex(S.w3d2.A, "Dip",                   "6", "4",  null, "90 sec", "Se possibile leggera zavorra", 0),
  ex(S.w3d2.A, "Lat Machine Presa Neutra","3","10", null, "75 sec", null, 1),
  ex(S.w3d2.A, "Filly Press",           "3", "10", null, "60 sec", null, 2),
  ex(S.w3d2.A, "DB Lateral Raise",      "3", "15", null, "60 sec", null, 3),
  ex(S.w3d2.A, "Leg curl",              "3", "15", null, "60 sec", null, 4),
  // Core
  ex(S.w3d2.C, "Ab Wheel Rollout",    "3", "12",   null, null, null, 0),
  ex(S.w3d2.C, "Farmer Carry Pesante","4", "30 MT",null, null, null, 1),

  // ══════════════════════════════════════════════════════════════
  // WEEK 4 DAY 1 – SQUAT + BENCH + PULL UP (SCARICO)
  // ══════════════════════════════════════════════════════════════
  ...wuBike(S.w4d1.W, "5"),
  // Forza
  ex(S.w4d1.ST, "Back Squat",   "3", "5", "65-70%", "120 sec", "#lower#", 0),
  ex(S.w4d1.ST, "Bench Press",  "3", "5", "65-70%", "120 sec", "#upper#", 1),
  // Accessori
  ex(S.w4d1.A, "Pull Up",           "3", "6",   null, "75 sec", null, 0),
  ex(S.w4d1.A, "DB Reverse Lunge",  "2", "8+8", null, "60 sec", null, 1),
  ex(S.w4d1.A, "DB Arnold Press",   "2", "10",  null, "60 sec", null, 2),
  ex(S.w4d1.A, "Leg extention",     "2", "12",  null, "60 sec", null, 3),
  // Core
  ex(S.w4d1.C, "Hanging Knee Raise", "2", "10",       null, null, null, 0),
  ex(S.w4d1.C, "Side Plank",         "2", "30''/lato",null, null, null, 1),

  // ══════════════════════════════════════════════════════════════
  // WEEK 4 DAY 2 – DEADLIFT + PRESS + DIP (SCARICO)
  // ══════════════════════════════════════════════════════════════
  ...wuRow(S.w4d2.W, "5"),
  // Forza
  ex(S.w4d2.ST, "Deadlift",             "3", "5", "65-70%", "120 sec", "#lower#", 0),
  ex(S.w4d2.ST, "Strict Press Bilanciere","3","5", "65-70%",  "90 sec", "#upper#", 1),
  // Accessori
  ex(S.w4d2.A, "Dip",                   "3", "6",  null, "75 sec", null, 0),
  ex(S.w4d2.A, "Lat Machine Presa Neutra","2","10", null, "60 sec", null, 1),
  ex(S.w4d2.A, "Pulley Machine",        "2", "10", null, "60 sec", null, 2),
  ex(S.w4d2.A, "Filly Press",           "2", "10", null, "60 sec", null, 3),
  ex(S.w4d2.A, "DB Lateral Raise",      "2", "12", null, "60 sec", null, 4),
  ex(S.w4d2.A, "Leg curl",              "2", "12", null, "60 sec", null, 5),
  // Core
  ex(S.w4d2.C, "Ab Wheel Rollout","2", "10",   null, null, null, 0),
  ex(S.w4d2.C, "Farmer Carry",    "3", "30 MT",null, null, null, 1),
];

const { error } = await supabase.from("exercises").insert(rows);
if (error) console.error("❌ ERRORE:", error.message);
else console.log(`✅ Riccardo giugno inserito! (${rows.length} esercizi su 8 giorni)`);
