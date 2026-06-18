import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://wltgyvkgevrrgznxtkxc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs"
);

// ── Libreria ────────────────────────────────────────────────────
const { error: libErr } = await supabase.from("exercise_library").insert([
  { name:"Affondo DB Overhead", category:"ACCESSORI", subcategory:"MANUBRI",
    unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",
    load_pct:false,load_rpe:true,load_kg:true,default_load:"kg",
    equip_barbell:false,equip_db:true,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:"db" },
]);
if (libErr) console.error("❌ Libreria:", libErr.message);
else console.log("✅ Affondo DB Overhead aggiunto in libreria");

// ── Setup ───────────────────────────────────────────────────────
const MONTH_ID = "ba917993-5759-4d3d-99cf-d75052f9d751";
const SECTION_ORDER = ["warmup","strength","accessories","core","workout"];
const sec = (secs, type) => secs.find(s => s.section_type === type)?.id;
const ex = (sid, name, sets, reps, load, rest, notes, idx) =>
  ({ section_id: sid, name, sets, reps, load, rest_time: rest, notes, order_index: idx });

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
  S[key] = { W: sec(secs,"warmup"), ST: sec(secs,"strength"), A: sec(secs,"accessories"), C: sec(secs,"core"), WK: sec(secs,"workout") };
}

const allSecs = Object.values(S).flatMap(s => Object.values(s)).filter(Boolean);
await supabase.from("exercises").delete().in("section_id", allSecs);

// Subtype EMOM per tutti i workout
for (const [key, sv] of Object.entries(S)) {
  const cap = (key.includes("w1") || key.includes("w4")) ? "9" : "12";
  await supabase.from("workout_sections").update({ section_subtype:"emom", cap_time:cap }).eq("id", sv.WK);
}
console.log("✅ Sezioni configurate");

// ── Warmup A – W1/W3: con Air Squat ─────────────────────────────
const wuA_airsquat = (sid) => [
  ex(sid,"Bike",null,"4 min",null,null,"#cardio#",0),
  ex(sid,"Shoulder Pass Through","1","15",null,null,"#mob#",1),
  ex(sid,"Squat to Stand","1","10",null,null,"#mob#",2),
  ex(sid,"Monster Walk","1","20 passi",null,null,"#att#",3),
  ex(sid,"Glute bridge","1","12",null,null,"#att#",4),
  ex(sid,"Air Squat","2","10",null,null,"#mob#",5),
];

// ── Warmup A – W2/W4: con Clean tecnico ─────────────────────────
const wuA_clean = (sid) => [
  ex(sid,"Bike",null,"4 min",null,null,"#cardio#",0),
  ex(sid,"Shoulder Pass Through","1","15",null,null,"#mob#",1),
  ex(sid,"Squat to Stand","1","10",null,null,"#mob#",2),
  ex(sid,"Monster Walk","1","20 passi",null,null,"#att#",3),
  ex(sid,"Glute bridge","1","12",null,null,"#att#",4),
  ex(sid,"Hang Power Clean","5","3",null,null,"#mob# tecnico - basso carico",5),
];

// ── Warmup B – uguale tutte le settimane ────────────────────────
const wuB = (sid) => [
  ex(sid,"Bike",null,"4 min",null,null,"#cardio#",0),
  ex(sid,"Hip Hinge con Bastone","1","10",null,null,"#mob#",1),
  ex(sid,"Bird Dog","1","6+6",null,null,"#mob#",2),
  ex(sid,"Band Pull Apart","1","15",null,null,"#att#",3),
  ex(sid,"DB Romanian Deadlift","2","10",null,null,"#mob#",4),
];

const rows = [

  // ══ WEEK 1 ══════════════════════════════════════════════════
  // W1 Day A
  ...wuA_airsquat(S.w1d1.W),
  ex(S.w1d1.ST,"Back Squat",  "5","5","RPE 7","90 sec","#lower#",0),
  ex(S.w1d1.ST,"DB Bench Press","5","5","RPE 7","90 sec","#upper#",1),
  ex(S.w1d1.A,"DB Walking Lunges",       "3","10+10",null,"60 sec",null,0),
  ex(S.w1d1.A,"Leg extention",           "3","12",   null,"60 sec",null,1),
  ex(S.w1d1.A,"Pull Up Assistito Elastico","3","6",  null,"60 sec",null,2),
  // CORE EMOM 9' in WORKOUT
  ex(S.w1d1.WK,"Prono Plank",    null,"40''", null,null,"#emom#",0),
  ex(S.w1d1.WK,"Farmer Carry",   null,"25 MT",null,null,"#emom#",1),
  ex(S.w1d1.WK,"Dead Bug Dinamico",null,"10+10",null,null,"#emom#",2),

  // W1 Day B
  ...wuB(S.w1d2.W),
  ex(S.w1d2.ST,"Sumo Deadlift",        "5","5","RPE 7","90 sec","#lower#",0),
  ex(S.w1d2.ST,"Strict Press Bilanciere","5","5","RPE 7","90 sec","#upper# no rack",1),
  ex(S.w1d2.A,"Belt Squat",            "3","10",null,"60 sec",null,0),
  ex(S.w1d2.A,"Barbell Inverted Row",  "3","10",null,"60 sec","o Ring Row",1),
  ex(S.w1d2.A,"Leg curl",              "3","12",null,"60 sec",null,2),
  ex(S.w1d2.A,"Push Up",              "3",null, null,null,"lasciare 2 rep in riserva",3),
  // CORE EMOM 9' in WORKOUT
  ex(S.w1d2.WK,"Side Plank",null,"30''",null,null,"#emom# destra",0),
  ex(S.w1d2.WK,"Side Plank",null,"30''",null,null,"#emom# sinistra",1),
  ex(S.w1d2.WK,"KB Suitcase Carry",null,"20 MT/lato",null,null,"#emom#",2),

  // ══ WEEK 2 ══════════════════════════════════════════════════
  // W2 Day A
  ...wuA_clean(S.w2d1.W),
  ex(S.w2d1.ST,"Front Squat",  "5","4","RPE 7.5","120 sec","#lower#",0),
  ex(S.w2d1.ST,"DB Bench Press","5","4","RPE 7.5","120 sec","#upper#",1),
  ex(S.w2d1.A,"Affondo DB Overhead",      "3","8+8",null,"60 sec",null,0),
  ex(S.w2d1.A,"Chin Up Assistito Elastico","3","6-8",null,"60 sec",null,1),
  // CORE EMOM 12'
  ex(S.w2d1.WK,"Hollow Hold",     null,"25''",  null,null,"#emom#",0),
  ex(S.w2d1.WK,"Farmer Carry",    null,"30 MT",  null,null,"#emom#",1),
  ex(S.w2d1.WK,"Mountain Climber",null,"20+20",  null,null,"#emom#",2),

  // W2 Day B
  ...wuB(S.w2d2.W),
  ex(S.w2d2.ST,"Sumo Deadlift",      "5","4","RPE 7.5","120 sec","#lower#",0),
  ex(S.w2d2.ST,"Push Press Bilanciere","5","4","RPE 7.5","120 sec","#upper# no rack",1),
  ex(S.w2d2.A,"Belt Squat","3","10",null,"60 sec",null,0),
  ex(S.w2d2.A,"Leg curl",  "3","12",null,"60 sec",null,1),
  ex(S.w2d2.A,"Push Up",  "3",null, null,null,"lasciare 2 rep in riserva",2),
  // CORE EMOM 12'
  ex(S.w2d2.WK,"Side Plank",null,"35''",null,null,"#emom# destra",0),
  ex(S.w2d2.WK,"Side Plank",null,"35''",null,null,"#emom# sinistra",1),
  ex(S.w2d2.WK,"KB Suitcase Carry",null,"25 MT/lato",null,null,"#emom#",2),

  // ══ WEEK 3 ══════════════════════════════════════════════════
  // W3 Day A
  ...wuA_airsquat(S.w3d1.W),
  ex(S.w3d1.ST,"Back Squat",   "5","3","RPE 8","90 sec","#lower#",0),
  ex(S.w3d1.ST,"DB Bench Press","5","3","RPE 8","90 sec","#upper#",1),
  ex(S.w3d1.A,"DB Walking Lunges",        "3","12+12",null,"60 sec",null,0),
  ex(S.w3d1.A,"Leg extention",            "3","12",   null,"60 sec",null,1),
  ex(S.w3d1.A,"Pull Up Assistito Elastico","4","6",   null,"60 sec",null,2),
  // CORE EMOM 12'
  ex(S.w3d1.WK,"Plank Shoulder Tap",null,"20",    null,null,"#emom#",0),
  ex(S.w3d1.WK,"KB Suitcase Carry",  null,"30 MT","20 KB",null,"#emom#",1),
  ex(S.w3d1.WK,"V Up",               null,"12",   null,null,"#emom#",2),

  // W3 Day B
  ...wuB(S.w3d2.W),
  ex(S.w3d2.ST,"Sumo Deadlift",        "5","3","RPE 8","90 sec","#lower#",0),
  ex(S.w3d2.ST,"Strict Press Bilanciere","5","3","RPE 8","90 sec","#upper# no rack",1),
  ex(S.w3d2.A,"Belt Squat",     "4","8", null,"60 sec",null,0),
  ex(S.w3d2.A,"Leg curl disteso","3","12",null,"60 sec",null,1),
  ex(S.w3d2.A,"Push Up",        "3",null,null,null,"lasciare 1-2 rep in riserva",2),
  // CORE EMOM 12'
  ex(S.w3d2.WK,"Side Plank con Abduzione",null,"30''",null,null,"#emom# destra",0),
  ex(S.w3d2.WK,"Side Plank con Abduzione",null,"30''",null,null,"#emom# sinistra",1),
  ex(S.w3d2.WK,"KB Suitcase Carry",       null,"25 MT/lato",null,null,"#emom#",2),

  // ══ WEEK 4 ══════════════════════════════════════════════════
  // W4 Day A
  ...wuA_clean(S.w4d1.W),
  ex(S.w4d1.ST,"Front Squat",  "3","5","RPE 6.5","90 sec","#lower#",0),
  ex(S.w4d1.ST,"DB Bench Press","3","5","RPE 6.5","90 sec","#upper#",1),
  ex(S.w4d1.A,"Affondo DB Overhead",      "2","8+8",null,"60 sec",null,0),
  ex(S.w4d1.A,"Chin Up Assistito Elastico","2","6",  null,"60 sec",null,1),
  // CORE EMOM 9'
  ex(S.w4d1.WK,"Plank",           null,"35''",null,null,"#emom#",0),
  ex(S.w4d1.WK,"Reverse Crunch",  null,"12",  null,null,"#emom#",1),
  ex(S.w4d1.WK,"Dead Bug Dinamico",null,"8+8",null,null,"#emom#",2),

  // W4 Day B
  ...wuB(S.w4d2.W),
  ex(S.w4d2.ST,"Sumo Deadlift",      "3","5","RPE 6.5","90 sec","#lower#",0),
  ex(S.w4d2.ST,"Push Press Bilanciere","3","5","RPE 6.5","90 sec","#upper# no rack",1),
  ex(S.w4d2.A,"Belt Squat","2","10",null,"60 sec",null,0),
  ex(S.w4d2.A,"Lat Machine","2","10",null,"60 sec",null,1),
  ex(S.w4d2.A,"Leg curl",  "2","12",null,"60 sec",null,2),
  ex(S.w4d2.A,"Push Up",  "2",null, null,null,"lasciare 3 rep in riserva",3),
  // CORE EMOM 9'
  ex(S.w4d2.WK,"Side Plank",null,"25''",null,null,"#emom# destra",0),
  ex(S.w4d2.WK,"Side Plank",null,"25''",null,null,"#emom# sinistra",1),
  ex(S.w4d2.WK,"KB Suitcase Carry",null,"20 MT/lato",null,null,"#emom#",2),
];

const { error } = await supabase.from("exercises").insert(rows);
if (error) console.error("❌ ERRORE:", error.message);
else console.log(`✅ Ester giugno inserito! (${rows.length} esercizi su 8 giorni)`);
