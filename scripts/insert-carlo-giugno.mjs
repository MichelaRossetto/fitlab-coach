import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://wltgyvkgevrrgznxtkxc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs"
);

const MONTH_ID = "0e85d649-ba0d-4a0b-8824-a8393b94dcad";
const SECTION_ORDER = ["warmup","strength","accessories","core","workout"];
const sec = (secs, type) => secs.find(s => s.section_type === type)?.id;
const ex = (sid, name, sets, reps, load, rest, notes, idx) =>
  ({ section_id: sid, name, sets, reps, load, rest_time: rest, notes, order_index: idx });

// ── Recupera tutti i day_id ────────────────────────────────────
const { data: weeks } = await supabase.from("training_weeks").select("id, week_number").eq("month_id", MONTH_ID).order("week_number");
const dayMap = {};
for (const w of weeks) {
  const { data: days } = await supabase.from("training_days").select("id, day_number").eq("week_id", w.id);
  for (const d of days) dayMap[`w${w.week_number}d${d.day_number}`] = d.id;
}
console.log("Days:", dayMap);

// ── Crea sezioni + leggi IDs ───────────────────────────────────
const S = {};
for (const [key, dayId] of Object.entries(dayMap)) {
  const { data: existing } = await supabase.from("workout_sections").select("id, section_type").eq("day_id", dayId);
  let secs = existing;
  if (!existing?.length) {
    await supabase.from("workout_sections").insert(SECTION_ORDER.map((t, i) => ({ day_id: dayId, section_type: t, order_index: i })));
    const { data: created } = await supabase.from("workout_sections").select("id, section_type").eq("day_id", dayId);
    secs = created;
  }
  S[key] = { W: sec(secs,"warmup"), ST: sec(secs,"strength"), A: sec(secs,"accessories"), C: sec(secs,"core"), WK: sec(secs,"workout") };
}

// ── Cancella esistenti + imposta subtype workout ───────────────
const allSecs = Object.values(S).flatMap(s => Object.values(s)).filter(Boolean);
await supabase.from("exercises").delete().in("section_id", allSecs);

await supabase.from("workout_sections").update({ section_subtype: "emom", cap_time: "6" }).eq("id", S.w1d1.WK);
await supabase.from("workout_sections").update({ section_subtype: "emom", cap_time: "9" }).eq("id", S.w2d1.WK);
await supabase.from("workout_sections").update({ section_subtype: "amrap", cap_time: "6" }).eq("id", S.w2d2.WK);
await supabase.from("workout_sections").update({ section_subtype: "emom", cap_time: "6" }).eq("id", S.w3d1.WK);
await supabase.from("workout_sections").update({ section_subtype: "cardioliss", cap_time: null }).eq("id", S.w4d1.WK);
await supabase.from("workout_sections").update({ section_subtype: "emom", cap_time: "6" }).eq("id", S.w4d2.WK);
console.log("Sezioni configurate");

// ── WARMUP helpers ─────────────────────────────────────────────
const wuD1 = (sid) => [
  ex(sid, "Bike",           null, "4 min", null, null, "#cardio#", 0),
  ex(sid, "Hip Opener",     null, "10+10", null, null, "#mob#",    1),
  ex(sid, "Squat to Stand", null, "8",     null, null, "#mob#",    2),
  ex(sid, "Glute bridge",   "2",  "12",    null, null, "#att#",    3),
  ex(sid, "Air Squat",      "1",  "12",    null, null, "#mob#",    4),
];
const wuD2 = (sid) => [
  ex(sid, "Rower",                  null, "4 min", null, null, "#cardio#", 0),
  ex(sid, "Band Pull Apart",        "2",  "15",    null, null, "#att#",    1),
  ex(sid, "Wall Slide",             "2",  "10",    null, null, "#mob#",    2),
  ex(sid, "Push Up Inclinato",      "1",  "10",    null, null, "#att#",    3),
  ex(sid, "Face Pull con Elastico", "1",  "15",    null, null, "#att#",    4),
];

const rows = [

  // ══ WEEK 1 DAY 1 ════════════════════════════════════════════
  ...wuD1(S.w1d1.W),
  // Forza
  ex(S.w1d1.ST, "Back Squat", "4", "6", "RPE 7", "90 sec", "#lower# partenza 45 kg", 0),
  // Accessori (superset)
  ex(S.w1d1.A, "DB Romanian Deadlift", "3", "10", "RPE 7", null,    "SUPERSET", 0),
  ex(S.w1d1.A, "DB Step Up",           "3", "10", "RPE 7", "60 sec","SUPERSET", 1),
  // Core
  ex(S.w1d1.C, "Plank",  "3", "30''", null, null, null, 0),
  ex(S.w1d1.C, "Sit Up", "3", "10",   null, null, null, 1),
  // Workout EMOM 6'
  ex(S.w1d1.WK, "Assault Bike Calories", null, "10", null,    null, "#emom#", 0),
  ex(S.w1d1.WK, "KB Deadlift",           null, "12", "16 KB", null, "#emom#", 1),

  // ══ WEEK 1 DAY 2 ════════════════════════════════════════════
  ...wuD2(S.w1d2.W),
  // Forza
  ex(S.w1d2.ST, "Bench Press", "4", "6", "RPE 7", "90 sec",
     "#upper# partenza 40 kg | Controllare bene la discesa. Spalle basse e scapole attive.", 0),
  // Accessori (superset)
  ex(S.w1d2.A, "Lat Machine",     "3", "10", "RPE 7", null,    "SUPERSET", 0),
  ex(S.w1d2.A, "DB Shoulder Press","3", "10", "RPE 7", "60 sec","SUPERSET", 1),
  // Core
  ex(S.w1d2.C, "Pallof Press",   "3", "10+10",     null, null, null, 0),
  ex(S.w1d2.C, "Side Plank",     "2", "30''/lato",  null, null, null, 1),
  ex(S.w1d2.C, "Russian Twist",  "2", "15",         null, null, null, 2),

  // ══ WEEK 2 DAY 1 ════════════════════════════════════════════
  ...wuD1(S.w2d1.W),
  // Forza
  ex(S.w2d1.ST, "Back Squat", "5", "5", "RPE 7.5", "90 sec",
     "#lower# partenza 50 kg | Aumentare leggermente il carico rispetto alla settimana 1. Mantenere esecuzione pulita.", 0),
  // Accessori (superset)
  ex(S.w2d1.A, "DB Romanian Deadlift", "3", "10", "RPE 7.5", null,    "SUPERSET", 0),
  ex(S.w2d1.A, "DB Walking Lunges",    "3", "10", "12.5 DB", "60 sec","SUPERSET", 1),
  // Workout EMOM 9' (core EMOM)
  ex(S.w2d1.WK, "Leg Raise",       null, "45''", null, null, "#emom#", 0),
  ex(S.w2d1.WK, "DB Renegade Row", null, "10",   null, null, "#emom#", 1),
  ex(S.w2d1.WK, "SkiErg",         null, "40''", null, null, "#emom#", 2),

  // ══ WEEK 2 DAY 2 ════════════════════════════════════════════
  ...wuD2(S.w2d2.W),
  // Forza
  ex(S.w2d2.ST, "Bench Press", "5", "5", "RPE 7.5", "90 sec", "#upper# partenza 42 kg", 0),
  // Accessori (superset)
  ex(S.w2d2.A, "Pulley Machine",       "3", "10",  "RPE 7.5", null,    "SUPERSET", 0),
  ex(S.w2d2.A, "Half Kneeling DB Press","3", "8+8", "RPE 7",  "60 sec","SUPERSET", 1),
  // Core
  ex(S.w2d2.C, "Pallof Press",    "3", "10+10", null, null, null, 0),
  ex(S.w2d2.C, "Reverse Crunch",  "3", "10",    null, null, null, 1),
  // Workout AMRAP 6'
  ex(S.w2d2.WK, "Rower Calories", null, "8", null, null, "#amrap#", 0),
  ex(S.w2d2.WK, "Push Up",        null, "8", null, null, "#amrap#", 1),
  ex(S.w2d2.WK, "DB Snatch",      null, "8", null, null, "#amrap#", 2),

  // ══ WEEK 3 DAY 1 ════════════════════════════════════════════
  ...wuD1(S.w3d1.W),
  // Forza
  ex(S.w3d1.ST, "Back Squat", "5", "4", "RPE 8", "90 sec",
     "#lower# 50 kg | Settimana più intensa. Carico più alto, meno ripetizioni. Tecnica sempre prioritaria.", 0),
  // Accessori (superset)
  ex(S.w3d1.A, "Romanian Deadlift", "3", "8",  "RPE 8",  null,    "SUPERSET", 0),
  ex(S.w3d1.A, "DB Step Up",        "3", "10", "15 DB",  "60 sec","SUPERSET", 1),
  // Core
  ex(S.w3d1.C, "Plank",          "3", "40''",   null, null, null, 0),
  ex(S.w3d1.C, "Farmer Carry",   "3", "30 MT",  "24 KB", null, null, 1),
  // Workout EMOM 6'
  ex(S.w3d1.WK, "Assault Bike Calories", null, "12", null,    null, "#emom#", 0),
  ex(S.w3d1.WK, "KB Swing",             null, "12", "16 KB", null, "#emom#", 1),

  // ══ WEEK 3 DAY 2 ════════════════════════════════════════════
  ...wuD2(S.w3d2.W),
  // Forza
  ex(S.w3d2.ST, "Bench Press", "5", "4", "RPE 8", "90 sec",
     "#upper# Carico più alto rispetto alle settimane precedenti. Evitare cedimento. Spalle sempre stabili.", 0),
  // Accessori (superset)
  ex(S.w3d2.A, "Pull Up",       "3", "7", null,    null,    "SUPERSET", 0),
  ex(S.w3d2.A, "Renegade Row",  "3", "8", "RPE 7.5","60 sec","SUPERSET", 1),
  // Core
  ex(S.w3d2.C, "Side Plank", "3", "30''/lato", null, null, null, 0),
  ex(S.w3d2.C, "V Up",       "3", "15",        null, null, null, 1),

  // ══ WEEK 4 DAY 1 ════════════════════════════════════════════
  ...wuD1(S.w4d1.W),
  // Forza
  ex(S.w4d1.ST, "Back Squat", "3", "10", "RPE 6.5", "90 sec", "#lower#", 0),
  // Accessori (superset)
  ex(S.w4d1.A, "DB Romanian Deadlift", "3", "10", "RPE 6.5", null,    "SUPERSET", 0),
  ex(S.w4d1.A, "KB Goblet Squat",      "3", "10", "16 KB",   "60 sec","SUPERSET con rialzo", 1),
  // Core
  ex(S.w4d1.C, "V Up",        "3", "10+10",   null, null, null, 0),
  ex(S.w4d1.C, "Prono Plank", "3", "30''",    null, null, null, 1),
  // Workout CARDIOLISS 3'
  ex(S.w4d1.WK, "Skill Mill Salita", null, "3 min", null, null, "#cardioliss#", 0),

  // ══ WEEK 4 DAY 2 ════════════════════════════════════════════
  ...wuD2(S.w4d2.W),
  // Forza
  ex(S.w4d2.ST, "Bench Press", "3", "6", "RPE 6.5", "90 sec", "#upper#", 0),
  // Accessori (superset)
  ex(S.w4d2.A, "Pulley Machine",        "3", "10",  "RPE 6.5", null,    "SUPERSET", 0),
  ex(S.w4d2.A, "Half Kneeling DB Press","3", "8+8", "RPE 6.5", "60 sec","SUPERSET", 1),
  // Core
  ex(S.w4d2.C, "Pallof Press",    "3", "10+10",    null, null, null, 0),
  ex(S.w4d2.C, "Side Plank Pulse","2", "30''/lato", null, null, null, 1),
  // Workout EMOM 6' leggero
  ex(S.w4d2.WK, "Rower Calories",  null, "8", null, null, "#emom#", 0),
  ex(S.w4d2.WK, "DB Devil Press",  null, "6", null, null, "#emom#", 1),
];

const { error } = await supabase.from("exercises").insert(rows);
if (error) console.error("❌ ERRORE:", error.message);
else console.log(`✅ Carlo giugno inserito! (${rows.length} esercizi su 8 giorni)`);
