import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://wltgyvkgevrrgznxtkxc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs"
);

// ── 1. Aggiungi esercizi mancanti in libreria ───────────────────
const libAdd = [
  { name:"Monster Walk", category:"WARMUP", subcategory:"ATTIVAZIONE", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:false,load_kg:false,default_load:null,equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
  { name:"Single Leg Romanian Deadlift", category:"ACCESSORI", subcategory:"KETTLEBELL", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:true,load_kg:true,default_load:"kg",equip_barbell:false,equip_db:false,equip_kb:true,equip_mb:false,equip_sb:false,default_equip:"kb" },
  { name:"Single Leg Romanian Deadlift", category:"FORZA", subcategory:"LOWER BODY", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:true,load_kg:true,default_load:"kg",equip_barbell:false,equip_db:false,equip_kb:true,equip_mb:false,equip_sb:false,default_equip:"kb" },
  { name:"Burpee Box Step Up", category:"WORKOUT", subcategory:null, unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:false,load_kg:false,default_load:null,equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
  { name:"Double Under", category:"WARMUP", subcategory:"CARDIO", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:false,load_kg:false,default_load:null,equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
  { name:"Double Under", category:"WORKOUT", subcategory:null, unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:false,load_kg:false,default_load:null,equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
  { name:"Single Under", category:"WARMUP", subcategory:"CARDIO", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:false,load_kg:false,default_load:null,equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
  { name:"Single Under", category:"WORKOUT", subcategory:null, unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:false,load_kg:false,default_load:null,equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
  { name:"Pike Leg Lift Over", category:"CORE TRAINING", subcategory:"NON ISOMETRICI", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:false,load_kg:false,default_load:null,equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
  { name:"Run", category:"WORKOUT", subcategory:null, unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:false,load_kg:false,default_load:null,equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
];
const { error: libErr } = await supabase.from("exercise_library").insert(libAdd);
if (libErr) console.error("❌ Libreria:", libErr.message);
else console.log(`✅ ${libAdd.length} esercizi aggiunti in libreria`);

// ── 2. Setup sezioni ────────────────────────────────────────────
const MONTH_ID = "a3dbedf8-d3e9-4d1f-9a08-ff685b735107"; // giugno Diana
const SECTION_ORDER = ["warmup","strength","accessories","core","workout"];
const sec = (secs, type) => secs.find(s => s.section_type === type)?.id;
const ex = (sid, name, sets, reps, load, rest, notes, idx) =>
  ({ section_id: sid, name, sets, reps, load, rest_time: rest, notes, order_index: idx });

const { data: weeks } = await supabase.from("training_weeks").select("id, week_number").eq("month_id", MONTH_ID).order("week_number");
const dayMap = {};
for (const w of weeks) {
  const { data: days } = await supabase.from("training_days").select("id, day_number").eq("week_id", w.id);
  for (const d of days) dayMap[`w${w.week_number}d${d.day_number}`] = d.id;
}

const S = {};
for (const [key, dayId] of Object.entries(dayMap)) {
  const { data: existing } = await supabase.from("workout_sections").select("id, section_type").eq("day_id", dayId);
  let secs = existing;
  if (!existing?.length) {
    await supabase.from("workout_sections").insert(SECTION_ORDER.map((t, i) => ({ day_id: dayId, section_type: t, order_index: i })));
    const { data: c } = await supabase.from("workout_sections").select("id, section_type").eq("day_id", dayId);
    secs = c;
  }
  S[key] = { W: sec(secs,"warmup"), ST: sec(secs,"strength"), A: sec(secs,"accessories"), C: sec(secs,"core"), WK: sec(secs,"workout") };
}

const allSecs = Object.values(S).flatMap(s => Object.values(s)).filter(Boolean);
await supabase.from("exercises").delete().in("section_id", allSecs);

// Imposta subtype workout
await supabase.from("workout_sections").update({ section_subtype:"emom",  cap_time:"12" }).eq("id", S.w1d1.WK);
await supabase.from("workout_sections").update({ section_subtype:"amrap", cap_time:"10" }).eq("id", S.w1d2.WK);
await supabase.from("workout_sections").update({ section_subtype:"fortime",cap_time:null }).eq("id", S.w1d3.WK);
await supabase.from("workout_sections").update({ section_subtype:"emom",  cap_time:"12" }).eq("id", S.w2d1.WK);
await supabase.from("workout_sections").update({ section_subtype:"amrap", cap_time:"12" }).eq("id", S.w2d2.WK);
await supabase.from("workout_sections").update({ section_subtype:"amrap", cap_time:"12" }).eq("id", S.w2d3.WK);
await supabase.from("workout_sections").update({ section_subtype:"amrap", cap_time:"12" }).eq("id", S.w3d1.WK);
await supabase.from("workout_sections").update({ section_subtype:"fortime",cap_time:null }).eq("id", S.w3d2.WK);
await supabase.from("workout_sections").update({ section_subtype:"emom",  cap_time:"15" }).eq("id", S.w3d3.WK);
await supabase.from("workout_sections").update({ section_subtype:"cardioliss",cap_time:null}).eq("id", S.w4d1.WK);
await supabase.from("workout_sections").update({ section_subtype:"amrap", cap_time:"8"  }).eq("id", S.w4d2.WK);
await supabase.from("workout_sections").update({ section_subtype:"fortime",cap_time:null }).eq("id", S.w4d3.WK);
console.log("✅ Sezioni configurate");

// ── Warmup helpers ──────────────────────────────────────────────
const wuLower = (sid) => [
  ex(sid,"Bike",null,"4 min",null,null,"#cardio#",0),
  ex(sid,"Hip Opener",null,"10+10",null,null,"#mob#",1),
  ex(sid,"Monster Walk","2","10",null,null,"#att#",2),
  ex(sid,"Glute bridge","2","12",null,null,"#att#",3),
  ex(sid,"Squat to Stand",null,"10",null,null,"#mob#",4),
];
const wuLowerFull = (sid, ex4) => [ // W1D3, W3D1 variant
  ex(sid,"Bike",null,"4 min",null,null,"#cardio#",0),
  ex(sid,"Hip Opener",null,"10+10",null,null,"#mob#",1),
  ex(sid,"Cossack Squat",null,"8+8",null,null,"#mob#",2),
  ex(sid,ex4,null,"10+10",null,null,"#mob#",3),
  ex(sid,"Monster Walk",null,"10+10",null,null,"#att#",4),
];
const wuFullGoblet = (sid) => [ // W3D3, W4D3
  ex(sid,"Bike",null,"4 min",null,null,"#cardio#",0),
  ex(sid,"Hip Opener",null,"10+10",null,null,"#mob#",1),
  ex(sid,"Cossack Squat",null,"8+8",null,null,"#mob#",2),
  ex(sid,"KB Goblet Squat",null,"10",null,null,"#mob#",3),
  ex(sid,"Monster Walk",null,"10+10",null,null,"#att#",4),
];
const wuUpper = (sid) => [
  ex(sid,"Rower",null,"4 min",null,null,"#cardio#",0),
  ex(sid,"Band Pull Apart","2","15",null,null,"#att#",1),
  ex(sid,"Shoulder CARs",null,"10+10",null,null,"#mob#",2),
  ex(sid,"Scapular Push Up","2","10",null,null,"#mob#",3),
  ex(sid,"Shoulder Dislocation con Elastico",null,"10",null,null,"#att#",4),
];

// ── ESERCIZI ────────────────────────────────────────────────────
const rows = [

  // ══ W1D1 – LOWER ════════════════════════════════════════════
  ...wuLower(S.w1d1.W),
  ex(S.w1d1.ST,"Back Squat","5","5","70%","120 sec","#lower#",0),
  ex(S.w1d1.A,"Belt Squat","4","10","20 KB","60 sec",null,0),
  ex(S.w1d1.A,"Hip Thrust Bilanciere","3","8","25","60 sec","RPE 7",1),
  ex(S.w1d1.A,"Single Leg Romanian Deadlift","3","10+10","16 KB","60 sec",null,2),
  ex(S.w1d1.C,"Sit Up","3","12","con peso",null,null,0),
  ex(S.w1d1.C,"Side Plank","3","30''",null,null,null,1),
  ex(S.w1d1.C,"Pallof Press","3","12+12",null,null,null,2),
  ex(S.w1d1.WK,"Wall Ball",null,"12","7",null,"#emom#",0),
  ex(S.w1d1.WK,"KB Swing",null,"12","16 KB",null,"#emom#",1),
  ex(S.w1d1.WK,"Assault Bike Calories",null,"10",null,null,"#emom#",2),

  // ══ W1D2 – UPPER ════════════════════════════════════════════
  ...wuUpper(S.w1d2.W),
  ex(S.w1d2.ST,"Bench Press","5","5","70%","75 sec","#upper#",0),
  ex(S.w1d2.A,"Lat Machine","4","10","25","60 sec",null,0),
  ex(S.w1d2.A,"Chest Supported Row","3","10",null,"75 sec",null,1),
  ex(S.w1d2.A,"Half Kneeling DB Press","3","10+10",null,"75 sec",null,2),
  ex(S.w1d2.C,"Hanging Knee Raise","3","10",null,null,null,0),
  ex(S.w1d2.C,"Russian Twist","3","20",null,null,"6 kg",1),
  ex(S.w1d2.C,"Farmer Carry","3","30 MT",null,null,null,2),
  ex(S.w1d2.WK,"Rower Calories",null,"12",null,null,"#amrap#",0),
  ex(S.w1d2.WK,"DB Push Press",null,"10","7.5 DB",null,"#amrap#",1),
  ex(S.w1d2.WK,"Sit Up",null,"12",null,null,"#amrap#",2),
  ex(S.w1d2.WK,"Slam Ball Over Shoulder",null,"10","18",null,"#amrap#",3),

  // ══ W1D3 – FULL BODY ════════════════════════════════════════
  ...wuLowerFull(S.w1d3.W,"Walking Lunge"),
  ex(S.w1d3.ST,"Deadlift","5","5","70%","75 sec","#lower#",0),
  ex(S.w1d3.A,"Landmine Squat","3","12",null,"75 sec",null,0),
  ex(S.w1d3.A,"DB Walking Lunges","3","20 passi","7.5 DB","75 sec",null,1),
  ex(S.w1d3.A,"Hip Thrust Bilanciere","3","10","25","75 sec",null,2),
  ex(S.w1d3.C,"Copenhagen Plank","3","20''/lato",null,null,null,0),
  ex(S.w1d3.C,"Dead Bug","3","10+10",null,null,null,1),
  ex(S.w1d3.C,"Overhead Hold","3","30''/lato",null,null,"KB",2),
  ex(S.w1d3.WK,"DB Thruster",null,"20","7.5 DB",null,"#fortime# ×2 giri",0),
  ex(S.w1d3.WK,"Burpee Box Step Up",null,"15",null,null,"#fortime# ×2 giri",1),
  ex(S.w1d3.WK,"KB Deadlift",null,"20",null,null,"#fortime# ×2 giri",2),
  ex(S.w1d3.WK,"Run",null,"200 MT",null,null,"#fortime# ×2 giri",3),

  // ══ W2D1 – LOWER ════════════════════════════════════════════
  ...wuLower(S.w2d1.W),
  ex(S.w2d1.ST,"Front Squat","5","5","70%","60 sec","#lower#",0),
  ex(S.w2d1.A,"Belt Squat","4","10","20 KB","60 sec",null,0),
  ex(S.w2d1.A,"Hip Thrust Bilanciere","3","10","30","75 sec",null,1),
  ex(S.w2d1.A,"Single Leg Romanian Deadlift","3","10+10","16 KB","75 sec",null,2),
  ex(S.w2d1.C,"V Up","3","15",null,null,null,0),
  ex(S.w2d1.C,"Side Plank","3","35''",null,null,null,1),
  ex(S.w2d1.C,"Toes To Bar","3","6",null,null,null,2),
  ex(S.w2d1.WK,"KB Goblet Squat",null,"10","20 KB",null,"#emom#",0),
  ex(S.w2d1.WK,"Push Up",null,"10",null,null,"#emom#",1),
  ex(S.w2d1.WK,"Assault Bike Calories",null,"10",null,null,"#emom#",2),

  // ══ W2D2 – UPPER ════════════════════════════════════════════
  ...wuUpper(S.w2d2.W),
  ex(S.w2d2.ST,"Bench Press","5","5","75%","75 sec","#upper#",0),
  ex(S.w2d2.A,"Pull Up Assistito Elastico","3","8",null,"90 sec",null,0),
  ex(S.w2d2.A,"Chest Supported Row","3","12",null,"90 sec",null,1),
  ex(S.w2d2.A,"Half Kneeling DB Press","3","10+10",null,"90 sec",null,2),
  ex(S.w2d2.C,"Hanging Knee Raise","3","12",null,null,null,0),
  ex(S.w2d2.C,"Russian Twist","3","24",null,null,null,1),
  ex(S.w2d2.C,"KB Suitcase Carry","3","30 MT","20 KB",null,null,2),
  ex(S.w2d2.WK,"Skill Mill Salita",null,"1 min",null,null,"#amrap#",0),
  ex(S.w2d2.WK,"DB Snatch",null,"20","10 DB",null,"#amrap#",1),
  ex(S.w2d2.WK,"Ring Row",null,"12",null,null,"#amrap#",2),
  ex(S.w2d2.WK,"DB Reverse Lunge",null,"12","10 DB",null,"#amrap#",3),

  // ══ W2D3 – FULL BODY ════════════════════════════════════════
  // Warmup: W2D3 ha Jump lunges al posto di Walking Lunge
  ex(S.w2d3.W,"Bike",null,"4 min",null,null,"#cardio#",0),
  ex(S.w2d3.W,"Hip Opener",null,"10+10",null,null,"#mob#",1),
  ex(S.w2d3.W,"Cossack Squat",null,"8+8",null,null,"#mob#",2),
  ex(S.w2d3.W,"Jump Lunges",null,"10+10",null,null,"#att#",3),
  ex(S.w2d3.W,"Monster Walk",null,"10+10",null,null,"#att#",4),
  ex(S.w2d3.ST,"Deadlift","5","5","75%","75 sec","#lower#",0),
  ex(S.w2d3.A,"Bulgarian Split Squat","3","10+10",null,"90 sec",null,0),
  ex(S.w2d3.A,"Hip Thrust a Corpo Libero","3","10",null,"90 sec",null,1),
  ex(S.w2d3.C,"Copenhagen Plank","3","25''",null,null,null,0),
  ex(S.w2d3.C,"Dead Bug Dinamico","3","12+12",null,null,null,1),
  ex(S.w2d3.C,"Scissor Kick","3","35''",null,null,null,2),
  ex(S.w2d3.WK,"Step Up",null,"20",null,null,"#amrap#",0),
  ex(S.w2d3.WK,"KB American Swing",null,"15",null,null,"#amrap#",1),
  ex(S.w2d3.WK,"Double Under",null,"20",null,null,"#amrap#",2),
  ex(S.w2d3.WK,"Pull Up",null,"5",null,null,"#amrap#",3),

  // ══ W3D1 – LOWER ════════════════════════════════════════════
  ...wuLowerFull(S.w3d1.W,"Walking Lunge"),
  ex(S.w3d1.ST,"Back Squat","5","4","77-80%","75 sec","#lower#",0),
  ex(S.w3d1.A,"Belt Squat","5","8","24 KB","75 sec",null,0),
  ex(S.w3d1.A,"Hip Thrust Bilanciere","5","8","30","75 sec",null,1),
  // CORE = TABATA
  ex(S.w3d1.C,"Sit Up",null,"20''",null,null,"TABATA 20''/10'' ×8 — alterna con Plank",0),
  ex(S.w3d1.C,"Prono Plank",null,"20''","10",null,"TABATA 20''/10'' ×8 — alterna con Sit Up",1),
  ex(S.w3d1.WK,"Air Squat",null,"30",null,null,"#amrap#",0),
  ex(S.w3d1.WK,"DB Deadlift",null,"12","12.5 DB",null,"#amrap#",1),
  ex(S.w3d1.WK,"DB Clean and Jerk",null,"10","12.5 DB",null,"#amrap#",2),
  ex(S.w3d1.WK,"Walking Lunge",null,"20",null,null,"#amrap#",3),

  // ══ W3D2 – UPPER ════════════════════════════════════════════
  ...wuUpper(S.w3d2.W),
  ex(S.w3d2.ST,"Strict Press Bilanciere","5","4","75%","75 sec","#upper#",0),
  ex(S.w3d2.A,"Lat Machine","4","8",null,"90 sec",null,0),
  ex(S.w3d2.A,"Chest Supported Row","4","8",null,"90 sec",null,1),
  ex(S.w3d2.A,"Half Kneeling DB Press","4","8+8",null,"90 sec",null,2),
  // CORE = EMOM 6'
  ex(S.w3d2.C,"Toes To Bar",null,"4",null,null,"EMOM 6'",0),
  // WORKOUT = FOR TIME (singolo giro)
  ex(S.w3d2.WK,"Assault Bike Calories",null,"10",null,null,"#fortime#",0),
  ex(S.w3d2.WK,"Wall Ball",null,"20","6",null,"#fortime#",1),
  ex(S.w3d2.WK,"DB Renegade Row",null,"20","7.5 DB",null,"#fortime#",2),
  ex(S.w3d2.WK,"Pike Leg Lift Over",null,"20",null,null,"#fortime#",3),
  ex(S.w3d2.WK,"Rower Calories",null,"10",null,null,"#fortime#",4),

  // ══ W3D3 – FULL BODY ════════════════════════════════════════
  ...wuFullGoblet(S.w3d3.W),
  ex(S.w3d3.ST,"Deadlift","5","4","80%","90 sec","#lower#",0),
  ex(S.w3d3.A,"Landmine Squat","3","10",null,"90 sec",null,0),
  ex(S.w3d3.A,"DB Bulgarian Split Squat","3","8+8","15 DB","90 sec",null,1),
  ex(S.w3d3.C,"Copenhagen Plank","3","20''/lato",null,null,null,0),
  ex(S.w3d3.C,"Dead Bug Dinamico","3","20",null,null,null,1),
  ex(S.w3d3.C,"Reverse Crunch","3","12",null,null,null,2),
  ex(S.w3d3.WK,"DB Shoulder Press",null,"12",null,null,"#emom#",0),
  ex(S.w3d3.WK,"Burpee",null,"12",null,null,"#emom#",1),
  ex(S.w3d3.WK,"KB Deadlift",null,"12",null,null,"#emom#",2),

  // ══ W4D1 – LOWER (SCARICO) ══════════════════════════════════
  ...wuLower(S.w4d1.W),
  ex(S.w4d1.ST,"Back Squat","3","5","60-65%","60 sec","#lower#",0),
  ex(S.w4d1.A,"Belt Squat","2","10","16 KB","75 sec",null,0),
  ex(S.w4d1.A,"Hip Thrust Bilanciere","2","10","25","75 sec",null,1),
  ex(S.w4d1.A,"Single Leg Romanian Deadlift","2","10+10","12 KB","75 sec",null,2),
  ex(S.w4d1.C,"Sit Up","2","12",null,null,null,0),
  ex(S.w4d1.C,"Side Plank","2","25''",null,null,null,1),
  ex(S.w4d1.C,"Pallof Press","2","10+10",null,null,null,2),
  ex(S.w4d1.WK,"Bike LISS",null,"10 min",null,null,"#cardioliss#",0),

  // ══ W4D2 – UPPER (SCARICO) ══════════════════════════════════
  ...wuUpper(S.w4d2.W),
  ex(S.w4d2.ST,"Bench Press","3","5","60-65%","60 sec","#upper#",0),
  ex(S.w4d2.A,"Lat Machine","3","10",null,"75 sec",null,0),
  ex(S.w4d2.A,"Chest Supported Row","2","10",null,"75 sec",null,1),
  ex(S.w4d2.A,"Half Kneeling DB Press","2","10",null,"75 sec",null,2),
  ex(S.w4d2.C,"Hanging Knee Raise","2","10",null,null,null,0),
  ex(S.w4d2.C,"Russian Twist","2","20",null,null,null,1),
  ex(S.w4d2.C,"Toes To Bar","2","8",null,null,null,2),
  ex(S.w4d2.WK,"SkiErg Calories",null,"6",null,null,"#amrap#",0),
  ex(S.w4d2.WK,"KB Gorilla Row",null,"8+8","12 KB",null,"#amrap#",1),
  ex(S.w4d2.WK,"KB American Swing",null,"10","12 KB",null,"#amrap#",2),

  // ══ W4D3 – FULL BODY (SCARICO) ══════════════════════════════
  ...wuFullGoblet(S.w4d3.W),
  ex(S.w4d3.ST,"Deadlift","3","5","60-65%","75 sec","#lower#",0),
  ex(S.w4d3.A,"DB Reverse Lunge","2","16 passi",null,"60 sec",null,0),
  ex(S.w4d3.A,"Leg curl disteso","2","10",null,"60 sec",null,1),
  ex(S.w4d3.C,"Copenhagen Plank","2","20''",null,null,null,0),
  ex(S.w4d3.C,"Dead Bug Dinamico","2","10+10",null,null,null,1),
  ex(S.w4d3.C,"Farmer Carry","2","30 MT",null,null,null,2),
  ex(S.w4d3.WK,"Single Under",null,"100",null,null,"#fortime#",0),
  ex(S.w4d3.WK,"KB Deadlift",null,"15",null,null,"#fortime#",1),
  ex(S.w4d3.WK,"Push Up",null,"20",null,null,"#fortime#",2),
  ex(S.w4d3.WK,"Step Up",null,"15",null,null,"#fortime#",3),
  ex(S.w4d3.WK,"Single Under",null,"100",null,null,"#fortime#",4),
];

const { error } = await supabase.from("exercises").insert(rows);
if (error) console.error("❌ ERRORE:", error.message);
else console.log(`✅ Diana giugno inserito! (${rows.length} esercizi su 12 giorni)`);
