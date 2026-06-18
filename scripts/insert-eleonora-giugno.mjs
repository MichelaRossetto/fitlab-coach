import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://wltgyvkgevrrgznxtkxc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs"
);

const MONTH_ID = "c3e1f446-fd36-44ad-9172-5a6fcb285f02";

// ── 1. Note sul mese ────────────────────────────────────────────
const noteText = "Per ottenere il massimo beneficio dal programma è importante rispettare i recuperi indicati ed evitare pause troppo lunghe tra esercizi e circuiti. L'allenamento è creato per essere completato entro circa 55–60', mantenendo ritmo, concentrazione e continuità di movimento. Recuperi eccessivamente lunghi andrebbero a modificare la logica del programma, riducendo l'efficacia del lavoro metabolico e della componente funzionale.";
await supabase.from("training_months").update({ notes: noteText }).eq("id", MONTH_ID);
console.log("✅ Note mese inserite");

// ── 2. Libreria ─────────────────────────────────────────────────
const { error: libErr } = await supabase.from("exercise_library").insert([
  { name:"Pull Up Kipping", category:"FORZA", subcategory:"UPPER BODY", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:false,load_kg:false,default_load:null,equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
  { name:"Rock Up", category:"CORE TRAINING", subcategory:"NON ISOMETRICI", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:false,load_kg:false,default_load:null,equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
  { name:"DB Turkish Sit Up", category:"CORE TRAINING", subcategory:"NON ISOMETRICI", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:false,load_kg:true,default_load:"kg",equip_barbell:false,equip_db:true,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:"db" },
  { name:"Push Up Down Dog", category:"WARMUP", subcategory:"ATTIVAZIONE", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:false,load_kg:false,default_load:null,equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
  { name:"Lateral Burpee Over KB", category:"WORKOUT", subcategory:null, unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:false,load_kg:false,default_load:null,equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
  { name:"DB Overhead Lunge", category:"ACCESSORI", subcategory:"MANUBRI", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:true,load_kg:true,default_load:"kg",equip_barbell:false,equip_db:true,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:"db" },
  { name:"DB Overhead Lunge", category:"WORKOUT", subcategory:null, unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:true,load_kg:true,default_load:"kg",equip_barbell:false,equip_db:true,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:"db" },
  { name:"KB Sumo DL High Pull", category:"WORKOUT", subcategory:null, unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:false,load_kg:true,default_load:"kg",equip_barbell:false,equip_db:false,equip_kb:true,equip_mb:false,equip_sb:false,default_equip:"kb" },
  { name:"DB Z Press", category:"ACCESSORI", subcategory:"MANUBRI", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:true,load_kg:true,default_load:"kg",equip_barbell:false,equip_db:true,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:"db" },
  { name:"Sled Push", category:"WORKOUT", subcategory:null, unit_min:true,unit_cal:false,unit_rep:true,default_unit:"min",load_pct:false,load_rpe:false,load_kg:false,default_load:null,equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
  { name:"Double KB Row", category:"ACCESSORI", subcategory:"KETTLEBELL", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:true,load_kg:true,default_load:"kg",equip_barbell:false,equip_db:false,equip_kb:true,equip_mb:false,equip_sb:false,default_equip:"kb" },
  { name:"DB Pull Over", category:"ACCESSORI", subcategory:"MANUBRI", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:true,load_kg:true,default_load:"kg",equip_barbell:false,equip_db:true,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:"db" },
  { name:"Shoulder Press Elastico", category:"WARMUP", subcategory:"ATTIVAZIONE", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:false,load_kg:false,default_load:null,equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
  { name:"Chin Up", category:"FORZA", subcategory:"UPPER BODY", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:true,load_kg:false,default_load:null,equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
  { name:"Chin Up", category:"ACCESSORI", subcategory:"BODYWEIGHT", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:true,load_kg:false,default_load:null,equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
]);
if (libErr) console.error("❌ Libreria:", libErr.message);
else console.log("✅ 14 esercizi aggiunti in libreria");

// ── 3. Setup sezioni ────────────────────────────────────────────
const SECTION_ORDER = ["warmup","strength","accessories","core","workout"];
const sec = (secs, type) => secs.find(s => s.section_type === type)?.id;
const ex = (sid, name, sets, reps, load, rest, notes, idx) =>
  ({ section_id: sid, name, sets, reps, load, rest_time: rest, notes, order_index: idx });

const { data: weeks } = await supabase.from("training_weeks").select("id,week_number").eq("month_id", MONTH_ID).order("week_number");
const dayMap = {};
for (const w of weeks) {
  const { data: days } = await supabase.from("training_days").select("id,day_number").eq("week_id", w.id).order("day_number");
  for (const d of days) dayMap[`w${w.week_number}d${d.day_number}`] = d.id;
}

const S = {};
for (const [key, dayId] of Object.entries(dayMap)) {
  if (!key.endsWith("d1") && !key.endsWith("d2")) continue; // solo D1 e D2
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

// Subtype workout
await supabase.from("workout_sections").update({ section_subtype:"amrap",  cap_time:"15" }).eq("id", S.w1d1.WK);
await supabase.from("workout_sections").update({ section_subtype:"emom",   cap_time:"18" }).eq("id", S.w1d2.WK);
await supabase.from("workout_sections").update({ section_subtype:"fortime",cap_time:"15" }).eq("id", S.w2d1.WK);
await supabase.from("workout_sections").update({ section_subtype:"fortime",cap_time:"18" }).eq("id", S.w2d2.WK);
await supabase.from("workout_sections").update({ section_subtype:"amrap",  cap_time:"15" }).eq("id", S.w3d1.WK);
await supabase.from("workout_sections").update({ section_subtype:"emom",   cap_time:"18" }).eq("id", S.w3d2.WK);
await supabase.from("workout_sections").update({ section_subtype:"amrap",  cap_time:"15" }).eq("id", S.w4d1.WK);
await supabase.from("workout_sections").update({ section_subtype:"fortime",cap_time:"10" }).eq("id", S.w4d2.WK);
console.log("✅ Sezioni configurate");

// ── Warmup helpers ──────────────────────────────────────────────
// Warmup D1 A (W1+W3): Bike + squat/hip/glute/goodmorning/pushup/plank
const wuD1A = (sid, gmReps, addLunge) => {
  const base = [
    ex(sid,"Assault Bike",null,"3 min",null,null,"#cardio#",0),
    ex(sid,"Squat to Stand","2","8",null,null,"#mob#",1),
    ex(sid,"Hip Opener","2","8+8",null,null,"#mob#",2),
    ex(sid,"Glute bridge","2",gmReps===15?"15":"12",null,null,"#att#",3),
    ex(sid,"Good Morning con Elastico","2",String(gmReps),null,null,"#mob#",4),
  ];
  if (addLunge) base.push(ex(sid,"Walking Lunge","2","20",null,null,"#mob# affondi alternati",5));
  base.push(ex(sid,"Push Up","2","6",null,null,"#att#",base.length));
  base.push(ex(sid,"Plank","2",gmReps===15?"30''":"20''",null,null,"#att#",base.length));
  return base;
};
// Warmup D1 B (W2+W4): Rower + band/scap/press/swing/hollow
const wuD2_w1 = (sid) => [
  ex(sid,"Rower",null,"3 min",null,null,"#cardio#",0),
  ex(sid,"Band Pull Apart","2","15",null,null,"#att#",1),
  ex(sid,"Scapular Push Up","2","8",null,null,"#mob#",2),
  ex(sid,"Shoulder Press Elastico","2","10",null,null,"#att#",3),
  ex(sid,"Double KB Row","2","8",null,null,"#att#",4),
  ex(sid,"KB Deadlift","2","10",null,null,"#mob#",5),
  ex(sid,"Hollow Hold","2","20''",null,null,"#att# KB",6),
];
const wuD2_w2 = (sid) => [
  ex(sid,"Bike",null,"3 min",null,null,"#cardio#",0),
  ex(sid,"DB Reverse Lunge","2","8",null,null,"#mob# affondi posteriori",1),
  ex(sid,"Push Up Down Dog","2","8",null,null,"#att#",2),
  ex(sid,"Walking Lunge","2","8",null,null,"#mob# affondi avanti",3),
  ex(sid,"Box Step Up","2","8",null,null,"#att# con KB",4),
  ex(sid,"KB Swing","2","15","12 KB",null,"#att#",5),
];
const wuD2_w3 = (sid) => [
  ex(sid,"Rower",null,"3 min",null,null,"#cardio#",0),
  ex(sid,"Rower",null,"2 min",null,null,"#cardio# + Bike",0), // "Rower 3'+2' bike"
  ex(sid,"Band Pull Apart","2","20",null,null,"#att#",1),
  ex(sid,"KB Deadlift","2","15",null,null,"#mob# KB Sumo",2),
  ex(sid,"KB Halo","2","15",null,null,"#mob#",3),
  ex(sid,"Mountain Climber","2","20",null,null,"#att#",4),
  ex(sid,"Hollow Hold","2","20''",null,null,"#att#",5),
];
const wuD2_w4 = (sid) => [
  ex(sid,"Rower",null,"3 min",null,null,"#cardio#",0),
  ex(sid,"Band Pull Apart","2","12",null,null,"#att#",1),
  ex(sid,"Push Up Down Dog","2","8",null,null,"#att#",2),
  ex(sid,"KB Halo","2","10",null,null,"#mob#",3),
  ex(sid,"Box Step Up","2","8",null,null,"#att# KB",4),
  ex(sid,"Hollow Hold","2","20''",null,null,"#att#",5),
];
const wuD1_w2 = (sid) => [
  ex(sid,"Rower",null,"3 min",null,null,"#cardio#",0),
  ex(sid,"Band Pull Apart","2","15",null,null,"#att#",1),
  ex(sid,"Scapular Push Up","2","8",null,null,"#mob#",2),
  ex(sid,"Shoulder Press Elastico","2","10",null,null,"#att#",3),
  ex(sid,"KB Swing","2","10",null,null,"#att#",4),
  ex(sid,"Hollow Hold","2","20''",null,null,"#att# KB",5),
];
const wuD1_w4 = (sid) => [
  ex(sid,"Bike",null,"3 min",null,null,"#cardio#",0),
  ex(sid,"Squat to Stand","2","10",null,null,"#mob#",1),
  ex(sid,"Glute bridge","2","10",null,null,"#att#",2),
  ex(sid,"Push Up","2","6",null,null,"#att#",3),
  ex(sid,"Bird Dog","2","6+6",null,null,"#mob#",4),
  ex(sid,"Good Morning con Elastico","2","10",null,null,"#mob#",5),
  ex(sid,"Band Pull Apart","2","20",null,null,"#att#",6),
  ex(sid,"Plank","2","20''",null,null,"#att#",7),
];

const rows = [

  // ══ W1D1 ════════════════════════════════════════════════════
  ...wuD1A(S.w1d1.W, 12, false),
  // Forza: Back Squat pausa 2'' bottom
  ex(S.w1d1.ST,"Back Squat","5","5","RPE 7","75 sec","#lower# pausa 2'' bottom · Carico medio, movimento pulito, profondità controllata.",0),
  // Circuito accessori 3 rounds, rec 45'' fine giro
  ex(S.w1d1.A,"DB Romanian Deadlift","3","10",null,null,"Circuito 3 giri · Rec 45'' fine giro",0),
  ex(S.w1d1.A,"Floor Press Manubri",  "3","10",null,null,"Circuito 3 giri",1),
  ex(S.w1d1.A,"Pull Up Kipping",      "3","10",null,null,"Circuito 3 giri",2),
  // Core 3 rounds
  ex(S.w1d1.C,"Rock Up","3","6",null,null,"Core 3 giri · Rec 30-40''",0),
  ex(S.w1d1.C,"V Up",   "3","12",null,null,"Core 3 giri",1),
  ex(S.w1d1.C,"DB Turkish Sit Up","3","5+5",null,null,"Core 3 giri",2),
  // AMRAP 15'
  ex(S.w1d1.WK,"KB American Swing",null,"14","16 KB",null,"#amrap#",0),
  ex(S.w1d1.WK,"KB Walking Lunge", null,"12",null,   null,"#amrap#",1),
  ex(S.w1d1.WK,"Push Up",          null,"14",null,   null,"#amrap#",2),
  ex(S.w1d1.WK,"Rower Calories",   null,"12",null,   null,"#amrap#",3),
  ex(S.w1d1.WK,"DB Snatch",        null,"14",null,   null,"#amrap#",4),

  // ══ W1D2 ════════════════════════════════════════════════════
  ...wuD2_w1(S.w1d2.W),
  // Circuito accessori 3 giri MAX 8'
  ex(S.w1d2.A,"DB Clean and Press","3","8","10 DB",null,"Circuito 3 giri MAX 8' · @DB 10 kg · Rec 45'' fine giro",0),
  ex(S.w1d2.A,"DB Front Squat",    "3","8","10 DB",null,"Circuito 3 giri",1),
  ex(S.w1d2.A,"DB Step Up",        "3","8+8","10 DB",null,"Circuito 3 giri",2),
  ex(S.w1d2.A,"DB Devil Press",    "3","8","10 DB",null,"Circuito 3 giri",3),
  // Core 3 giri rec 30-40''
  ex(S.w1d2.C,"Hanging Knee Raise","3","15",null,null,"strict · Core 3 giri · Rec 30-40''",0),
  ex(S.w1d2.C,"Ab Wheel Rollout",  "3","10",null,null,"Core 3 giri",1),
  ex(S.w1d2.C,"Star Plank",        "3","15''/lato",null,null,"Core 3 giri",2),
  // EMOM 18' (min 1-5 attivi, min 6 rest, ×3)
  ex(S.w1d2.WK,"SkiErg Calories",       null,"8",null,null,"#emom# Min 1 (40'' lavoro)",0),
  ex(S.w1d2.WK,"DB Thruster",           null,"10","10 DB",null,"#emom# Min 2",1),
  ex(S.w1d2.WK,"Box Step Up",           null,"14",null,null,"#emom# Min 3",2),
  ex(S.w1d2.WK,"Sit Up",               null,"15",null,null,"#emom# Min 4",3),
  ex(S.w1d2.WK,"Assault Bike Calories", null,"10",null,null,"#emom# Min 5 (40'' lavoro) · Min 6 Rest — Ripetere 3×",4),

  // ══ W2D1 ════════════════════════════════════════════════════
  ...wuD1_w2(S.w2d1.W),
  // Forza: Bench Press
  ex(S.w2d1.ST,"Bench Press","5","5","RPE 7.5","75 sec","#upper# alternativa: Floor Press",0),
  // Circuito 3 giri rec 45''
  ex(S.w2d1.A,"DB Incline Bench Press","3","12",null,null,"Circuito 3 giri · Rec 45'' fine giro",0),
  ex(S.w2d1.A,"Ring Row",              "3","12",null,null,"Circuito 3 giri",1),
  ex(S.w2d1.A,"DB Push Press",         "3","12",null,null,"Circuito 3 giri",2),
  // Core 3 giri rec 30-40''
  ex(S.w2d1.C,"Strict Toes To Bar","3","8",null,null,"Core 3 giri · Rec 30-40''",0),
  ex(S.w2d1.C,"Renegade Row",      "3","16",null,null,"Core 3 giri",1),
  ex(S.w2d1.C,"Russian Twist",     "3","24",null,null,"Core 3 giri",2),
  // FOR TIME 4 giri cap 15'
  ex(S.w2d1.WK,"DB Snatch",              null,"12","12.5 DB",null,"#fortime# 4 giri · alternati",0),
  ex(S.w2d1.WK,"KB Goblet Squat",        null,"20","20 KB",  null,"#fortime# 4 giri",1),
  ex(S.w2d1.WK,"KB Deadlift",            null,"12","16 KB",  null,"#fortime# 4 giri · 2 KB",2),
  ex(S.w2d1.WK,"Lateral Burpee Over KB", null,"20",null,     null,"#fortime# 4 giri",3),

  // ══ W2D2 ════════════════════════════════════════════════════
  ...wuD2_w2(S.w2d2.W),
  // Circuito 3 giri MAX 9' con EMOM core
  ex(S.w2d2.A,"KB Front Squat","3","10",null,null,"Circuito 3 giri MAX 9' · Rec 45'' fine giro",0),
  ex(S.w2d2.A,"KB Push Press",  "3","10",null,null,"Circuito 3 giri",1),
  ex(S.w2d2.A,"V Up",           "3","15",null,null,"Circuito 3 giri",2),
  ex(S.w2d2.A,"KB Gorilla Row", "3","10",null,null,"Circuito 3 giri",3),
  // Core EMOM 9' (3 min×2 volte)
  ex(S.w2d2.C,"Hanging Knee Raise","2","15",null,null,"EMOM 9' — Min 1 · Rec 30-40''",0),
  ex(S.w2d2.C,"Prono Plank",       "2","30''","10",null,"EMOM 9' — Min 2",1),
  ex(S.w2d2.C,"KB Suitcase Carry", "2","10+10 MT","20 KB",null,"EMOM 9' — Min 3",2),
  // WORKOUT FOR TIME 18' cap
  ex(S.w2d2.WK,"Rower Calories",    null,"35",null,null,"#fortime#",0),
  ex(S.w2d2.WK,"DB Step Up",        null,"35",null,null,"#fortime#",1),
  ex(S.w2d2.WK,"KB American Swing", null,"35","12 KB",null,"#fortime#",2),
  ex(S.w2d2.WK,"Sit Up",            null,"35",null,null,"#fortime#",3),
  ex(S.w2d2.WK,"DB Push Press",     null,"15+15","12.5 DB",null,"#fortime# dx+sin",4),
  ex(S.w2d2.WK,"Reverse Lunge",     null,"20",null,null,"#fortime#",5),
  ex(S.w2d2.WK,"Burpee",            null,"20",null,null,"#fortime#",6),
  ex(S.w2d2.WK,"SkiErg Calories",   null,null, null,null,"#fortime# Cash out MAX cal",7),

  // ══ W3D1 ════════════════════════════════════════════════════
  ...wuD1A(S.w3d1.W, 15, true),
  // Forza: Front Squat NO Rack
  ex(S.w3d1.ST,"Front Squat","5","4","RPE 8","90 sec","#lower# NO RACK",0),
  // Circuito 3 giri rec 45''
  ex(S.w3d1.A,"KB Single Leg RDL","3","8+8",null,null,"Circuito 3 giri · Rec 45'' fine giro",0),
  ex(S.w3d1.A,"DB Arnold Press",  "3","10", null,null,"Circuito 3 giri",1),
  ex(S.w3d1.A,"Lat Machine",      "3","12", null,null,"Circuito 3 giri",2),
  // Core 3x rec 30''
  ex(S.w3d1.C,"Hanging Leg Raise",    "3","10",null,null,"alle parallele · Rec 30''",0),
  ex(S.w3d1.C,"Fitball Rollout",      "3","20",null,null,null,1),
  ex(S.w3d1.C,"Side Plank con Reach","3","10+10",null,null,null,2),
  // AMRAP 15'
  ex(S.w3d1.WK,"Wall Ball",      null,"20","6",null,"#amrap#",0),
  ex(S.w3d1.WK,"Box Step Up",    null,"14",null,null,"#amrap#",1),
  ex(S.w3d1.WK,"KB Thruster",    null,"14","12 KB",null,"#amrap#",2),
  ex(S.w3d1.WK,"Push Up",        null,"20",null,null,"#amrap#",3),
  ex(S.w3d1.WK,"Skill Mill Salita",null,"1 min",null,null,"#amrap# 1' salita",4),

  // ══ W3D2 ════════════════════════════════════════════════════
  ...wuD2_w3(S.w3d2.W),
  // Circuito 4 giri MAX 12' rec 45''
  ex(S.w3d2.A,"DB Walking Lunges","4","16",null,null,"Circuito 4 giri MAX 12' · Rec 45'' fine giro",0),
  ex(S.w3d2.A,"DB Front Squat",   "4","10",null,null,"Circuito 4 giri",1),
  ex(S.w3d2.A,"DB Bench Press",   "4","10",null,null,"Circuito 4 giri",2),
  ex(S.w3d2.A,"Chin Up",          "4","5", null,null,"Circuito 4 giri · strict",3),
  // Core AMRAP 6' — qualità e controllo
  ex(S.w3d2.C,"Active Hang",    null,"20''",null,null,"AMRAP 6' Core",0),
  ex(S.w3d2.C,"Knee To Chest",  null,"10", null,null,"AMRAP 6' Core",1),
  ex(S.w3d2.C,"Reverse Crunch", null,"10", null,null,"AMRAP 6' Core",2),
  ex(S.w3d2.C,"Leg Raise",      null,"10", null,null,"AMRAP 6' Core · qualità, non velocità",3),
  // EMOM 18' (min 6 rest ×3)
  ex(S.w3d2.WK,"Assault Bike Calories", null,"12",null,null,"#emom# Min 1",0),
  ex(S.w3d2.WK,"Slam Ball Over Shoulder",null,"10",null,null,"#emom# Min 2",1),
  ex(S.w3d2.WK,"Box Jump",              null,"12",null,null,"#emom# Min 3 · ammortizza bene",2),
  ex(S.w3d2.WK,"Ring Row",              null,"10",null,null,"#emom# Min 4",3),
  ex(S.w3d2.WK,"KB Suitcase Carry",     null,"20+20 MT",null,null,"#emom# Min 5 · 20/24 KB · Min 6 Rest — Ripetere 3×",4),

  // ══ W4D1 ════════════════════════════════════════════════════
  ...wuD1_w4(S.w4d1.W),
  // Forza: Push Press Bilanciere
  ex(S.w4d1.ST,"Push Press Bilanciere","4","5","RPE 7","75 sec","#upper# Focus timing gambe-spinta e stabilità overhead.",0),
  // Circuito 3 giri MAX 9' rec 45''
  ex(S.w4d1.A,"DB Bulgarian Split Squat","3","8+8",null,null,"Circuito 3 giri MAX 9' · Rec 45'' fine giro",0),
  ex(S.w4d1.A,"DB Pull Over",           "3","10", null,null,"Circuito 3 giri",1),
  ex(S.w4d1.A,"Pulley Machine",         "3","10", null,null,"Circuito 3 giri",2),
  // Core 2×
  ex(S.w4d1.C,"Med Ball Sit Up","2","15",null,null,"Core 2 giri",0),
  ex(S.w4d1.C,"V Up",           "2","10",null,null,"Core 2 giri · medball",1),
  ex(S.w4d1.C,"Rock Up",        "2","5", null,null,"Core 2 giri · medball",2),
  // AMRAP 15'
  ex(S.w4d1.WK,"KB Sumo DL High Pull",null,"15","16 KB",null,"#amrap#",0),
  ex(S.w4d1.WK,"DB Push Press",       null,"10","10 DB",null,"#amrap#",1),
  ex(S.w4d1.WK,"Step Up",             null,"12",null,null,"#amrap# veloce",2),
  ex(S.w4d1.WK,"Sit Up",              null,"15",null,null,"#amrap#",3),
  ex(S.w4d1.WK,"DB Overhead Lunge",   null,"10",null,null,"#amrap#",4),
  ex(S.w4d1.WK,"KB Swing",            null,"15","16 KB",null,"#amrap#",5),

  // ══ W4D2 ════════════════════════════════════════════════════
  ...wuD2_w4(S.w4d2.W),
  // Circuito AMRAP 12' rec 45''
  ex(S.w4d2.A,"KB Goblet Squat", null,"12",null,null,"Circuito AMRAP 12' · Rec 45'' fine giro",0),
  ex(S.w4d2.A,"DB Z Press",      null,"10",null,null,"Circuito AMRAP 12'",1),
  ex(S.w4d2.A,"Handstand Hold",  null,"30''",null,null,"Circuito AMRAP 12'",2),
  ex(S.w4d2.A,"DB Reverse Lunge",null,"12",null,null,"Circuito AMRAP 12'",3),
  // Core 3 giri
  ex(S.w4d2.C,"Reverse Crunch",       "3","12",null,null,"Core 3 giri",0),
  ex(S.w4d2.C,"KB Russian Twist + Press","3","20",null,null,"Core 3 giri · totali",1),
  ex(S.w4d2.C,"Flutter Kick",         "3","30",null,null,"Core 3 giri",2),
  ex(S.w4d2.C,"Side Plank",           "3","20''/lato",null,null,"Core 3 giri",3),
  // FOR TIME 10' cap
  ex(S.w4d2.WK,"Sled Push",          null,"2 min",null,null,"#fortime# salita",0),
  ex(S.w4d2.WK,"Burpee Box Step Up", null,"12",  null,null,"#fortime#",1),
  ex(S.w4d2.WK,"Dip su Panca",       null,"12",  null,null,"#fortime# dip al box",2),
  ex(S.w4d2.WK,"Assault Bike",       null,"2 min",null,null,"#fortime#",3),
  ex(S.w4d2.WK,"KB Thruster",        null,"10+10","12 KB",null,"#fortime# dx+sin",4),
  ex(S.w4d2.WK,"Sled Push",          null,"2 min",null,null,"#fortime# salita ×2",5),
  ex(S.w4d2.WK,"Burpee Box Step Up", null,"12",  null,null,"#fortime# ×2",6),
  ex(S.w4d2.WK,"Dip su Panca",       null,"12",  null,null,"#fortime# ×2",7),
];

const { error } = await supabase.from("exercises").insert(rows);
if (error) console.error("❌ ERRORE:", error.message);
else console.log(`✅ Eleonora giugno inserito! (${rows.length} esercizi su 8 giorni)`);
