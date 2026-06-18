import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://wltgyvkgevrrgznxtkxc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs"
);

const MONTH_ID = "3c843797-a5c5-48b8-b76d-e3e585facd00";
const SECTION_ORDER = ["warmup","strength","accessories","core","workout"];
const sec = (secs, type) => secs.find(s => s.section_type === type)?.id;
const ex = (sid, name, sets, reps, load, rest, notes, idx) =>
  ({ section_id: sid, name, sets, reps, load, rest_time: rest, notes, order_index: idx });

// Setup sezioni per tutti i 4 giorni
const { data: weeks } = await supabase.from("training_weeks").select("id,week_number").eq("month_id", MONTH_ID).order("week_number");
const dayMap = {};
for (const w of weeks) {
  const { data: days } = await supabase.from("training_days").select("id,day_number").eq("week_id", w.id);
  for (const d of days) dayMap[`w${w.week_number}d${d.day_number}`] = d.id;
}

const S = {};
for (const [key, dayId] of Object.entries(dayMap)) {
  const { data: existing } = await supabase.from("workout_sections").select("id,section_type").eq("day_id", dayId);
  let secs = existing;
  if (!existing?.length) {
    await supabase.from("workout_sections").insert(SECTION_ORDER.map((t,i) => ({ day_id: dayId, section_type: t, order_index: i })));
    const { data: c } = await supabase.from("workout_sections").select("id,section_type").eq("day_id", dayId);
    secs = c;
  }
  S[key] = { W: sec(secs,"warmup"), A: sec(secs,"accessories"), C: sec(secs,"core") };
}

const allSecs = Object.values(S).flatMap(s => Object.values(s)).filter(Boolean);
await supabase.from("exercises").delete().in("section_id", allSecs);
console.log("✅ Sezioni pronte");

// ── Template esercizi (identico per tutte le settimane) ─────────
const buildDay = (W, A, C) => [

  // ── WARMUP ──────────────────────────────────────────────────
  ex(W,"Bike",null,"5 min",null,null,"#cardio# o Skill Mill",0),
  ex(W,"Cat Cow","1","10",null,null,"#mob#",1),
  ex(W,"Shoulder Dislocation con Elastico","1","12",null,null,"#mob#",2),
  ex(W,"Squat to Stand","1","10",null,null,"#mob#",3),
  ex(W,"Thoracic Rotation","1","8+8",null,null,"#mob#",4),

  // ── ACCESSORIES ─────────────────────────────────────────────
  // ── BLOCCO A – GAMBE ────────────────────────────────────────
  ex(A,"DB Step Up",             "3","10+10","7.5 DB","60 sec","Blocco A — Gambe",0),
  ex(A,"DB Bulgarian Split Squat","3","8+8",  "7.5 DB","60 sec","Blocco A — Gambe | 5/7.5 kg",1),
  ex(A,"Leg curl",               "3","12",    "10",    "60 sec","Blocco A — Gambe | macchina",2),
  // Cardio attivo dopo A
  ex(A,"Rower",null,"3 min",null,null,"Cardio attivo — ritmo continuo e regolare",3),

  // ── BLOCCO B – SCHIENA E SPINTA ─────────────────────────────
  ex(A,"Lat Machine Presa Triangolo","3","10",null,"60 sec","Blocco B — Schiena e Spinta",4),
  ex(A,"Ring Row",                  "3","10",null,"60 sec","Blocco B — Schiena e Spinta",5),
  ex(A,"Push Up Inclinato",         "3","8-10",null,"60 sec","Blocco B — Schiena e Spinta | su panca",6),
  // Cardio attivo dopo B
  ex(A,"Assault Bike",null,"4 min",null,null,"Cardio attivo — ritmo tranquillo",7),

  // ── BLOCCO C – SPALLE E BRACCIA ─────────────────────────────
  ex(A,"DB Arnold Press",  "3","10",null,"60 sec","Blocco C — Spalle e Braccia",8),
  ex(A,"DB Hammer Curl",   "3","12",null,"60 sec","Blocco C — Spalle e Braccia",9),
  ex(A,"DB French Press",  "3","12",null,"60 sec","Blocco C — Spalle e Braccia | con un manubrio",10),
  // Cardio attivo dopo C
  ex(A,"Tapis Roulant",null,"3 min",null,null,"Cardio attivo — inclinazione media",11),

  // ── BLOCCO D – TONO E STABILITÀ ─────────────────────────────
  ex(A,"Leg extention","3","12",null,"45 sec","Blocco D — Tono e Stabilità",12),
  ex(A,"Farmer Carry",  "3","20 MT",null,"45 sec","Blocco D — Tono e Stabilità",13),

  // ── CORE TRAINING ───────────────────────────────────────────
  ex(C,"Dead Bug Dinamico","2","10+10",null,"30 sec",null,0),
  ex(C,"Bird Dog Dinamico", "2","10+10",null,"30 sec",null,1),
  ex(C,"Plank",             "2","30''", null,"30 sec",null,2),

  // ── DEFATICAMENTO ───────────────────────────────────────────
  ex(C,"Hip Flexor Stretch",       "1","30''/lato",null,null,"Affondo statico con stretching psoas",3),
  ex(C,"Hamstring Stretch Dinamico","1","10+10",   null,null,"Defaticamento",4),
];

// Inserisce lo stesso schema in tutti e 4 i giorni
const rows = [
  ...buildDay(S.w1d1.W, S.w1d1.A, S.w1d1.C),
  ...buildDay(S.w2d1.W, S.w2d1.A, S.w2d1.C),
  ...buildDay(S.w3d1.W, S.w3d1.A, S.w3d1.C),
  ...buildDay(S.w4d1.W, S.w4d1.A, S.w4d1.C),
];

const { error } = await supabase.from("exercises").insert(rows);
if (error) console.error("❌ ERRORE:", error.message);
else console.log(`✅ Lucia giugno inserito! (${rows.length} esercizi × 4 giorni = ${rows.length} totali)`);
