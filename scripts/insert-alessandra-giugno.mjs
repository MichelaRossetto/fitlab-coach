import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://wltgyvkgevrrgznxtkxc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs"
);

// ── Libreria ────────────────────────────────────────────────────
const { error: libErr } = await supabase.from("exercise_library").insert([
  { name:"Half Burpee", category:"WORKOUT", subcategory:null,
    unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",
    load_pct:false,load_rpe:false,load_kg:false,default_load:null,
    equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
]);
if (libErr) console.error("❌ Libreria:", libErr.message);
else console.log("✅ Half Burpee aggiunto in libreria");

// ── Setup ───────────────────────────────────────────────────────
const MONTH_ID = "11611e32-cb1e-4fec-907a-6fc802964119";
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

// Subtype workout
await supabase.from("workout_sections").update({ section_subtype:"amrap", cap_time:"14" }).eq("id", S.w1d1.WK);
await supabase.from("workout_sections").update({ section_subtype:"emom",  cap_time:"15" }).eq("id", S.w1d2.WK);
await supabase.from("workout_sections").update({ section_subtype:"amrap", cap_time:"15" }).eq("id", S.w2d1.WK);
await supabase.from("workout_sections").update({ section_subtype:"emom",  cap_time:"15" }).eq("id", S.w2d2.WK);
await supabase.from("workout_sections").update({ section_subtype:"amrap", cap_time:"15" }).eq("id", S.w3d1.WK);
await supabase.from("workout_sections").update({ section_subtype:"emom",  cap_time:"15" }).eq("id", S.w3d2.WK);
await supabase.from("workout_sections").update({ section_subtype:"amrap", cap_time:"12" }).eq("id", S.w4d1.WK);
await supabase.from("workout_sections").update({ section_subtype:"emom",  cap_time:"12" }).eq("id", S.w4d2.WK);
console.log("✅ Sezioni configurate");

// ── Warmup D1 base ───────────────────────────────────────────────
const wuD1 = (sid, cardio, extraEx) => {
  const base = [
    ex(sid, cardio, null, "8 min", null, null, "#cardio#", 0),
    ex(sid,"Glute bridge","2","12",null,null,"#att# 2 giri",1),
    ex(sid,"Air Squat","2","10",null,null,"#mob# 2 giri",2),
    ex(sid,"Affondo Dinamico","2","6+6",null,null,"#mob# 2 giri",3),
    ex(sid,"Band Pull Apart","2","12",null,null,"#att# 2 giri",4),
  ];
  if (extraEx) extraEx.forEach((e,i) => base.push(e(base.length+i)));
  return base;
};

const rows = [

  // ══ W1D1 – Lower Body + Cardio Flow ═════════════════════════
  ex(S.w1d1.W,"Bike",null,"8 min",null,null,"#cardio# + camminata in salita",0),
  ex(S.w1d1.W,"Glute bridge","2","12",null,null,"#att# 2 giri",1),
  ex(S.w1d1.W,"Air Squat","2","10",null,null,"#mob# 2 giri",2),
  ex(S.w1d1.W,"Affondo Dinamico","2","6+6",null,null,"#mob# 2 giri",3),
  ex(S.w1d1.W,"Band Pull Apart","2","12",null,null,"#att# 2 giri",4),
  // Forza circuito rec 60''
  ex(S.w1d1.ST,"KB Goblet Squat","4","10","RPE 7","60 sec","#lower# circuito con Farmer Carry + Knee To Chest",0),
  ex(S.w1d1.A,"Farmer Carry",  "4","30 MT",null,"60 sec","Circuito Forza — dopo Goblet Squat",0),
  ex(S.w1d1.A,"Knee To Chest", "4","12",   null,"60 sec","Circuito Forza",1),
  ex(S.w1d1.A,"DB Walking Lunges","3","10+10",null,"60 sec",null,2),
  ex(S.w1d1.A,"Leg curl",      "3","12",   null,"60 sec","macchina",3),
  ex(S.w1d1.C,"Plank",         "3","25''", null,null,null,0),
  ex(S.w1d1.C,"Russian Twist", "3","14",   null,null,null,1),
  ex(S.w1d1.C,"Dead Bug Dinamico","3","10+10",null,null,null,2),
  ex(S.w1d1.C,"Tapis Roulant",null,"5 min",null,null,"Defaticamento — camminata",3),
  // AMRAP 14'
  ex(S.w1d1.WK,"Rower",          null,"200 MT",null,null,"#amrap#",0),
  ex(S.w1d1.WK,"Box Step Up",    null,"10",   null,null,"#amrap#",1),
  ex(S.w1d1.WK,"KB Swing",       null,"12",   null,null,"#amrap#",2),
  ex(S.w1d1.WK,"Sit Up",         null,"10",   null,null,"#amrap#",3),
  ex(S.w1d1.WK,"KB Reverse Lunge",null,"8+8", null,null,"#amrap# fronte petto (goblet hold)",4),

  // ══ W1D2 – Upper Body + Full Body Conditioning ══════════════
  ex(S.w1d2.W,"Rower",null,"8 min",null,null,"#cardio# o camminata lieve salita",0),
  ex(S.w1d2.W,"Band Pull Apart","2","12",null,null,"#att# 2 giri",1),
  ex(S.w1d2.W,"Push Up Ginocchia","2","8",null,null,"#att# su panca · 2 giri",2),
  ex(S.w1d2.W,"One Arm DB Row","2","8+8",null,null,"#att# rematore manubri leggero · 2 giri",3),
  ex(S.w1d2.W,"Shoulder CARs",null,"6",null,null,"#mob# 2 giri",4),
  // Forza superset rec 60-75''
  ex(S.w1d2.ST,"DB Bench Press",      "4","10","RPE 7","75 sec","#upper# SUPERSET",0),
  ex(S.w1d2.ST,"Lat Machine Presa Triangolo","4","8","15","75 sec","#upper# SUPERSET · 15 kg per parte",1),
  ex(S.w1d2.A,"DB Shoulder Press","3","10",null,"60 sec",null,0),
  ex(S.w1d2.A,"Pulley Machine",   "3","12",null,"60 sec",null,1),
  ex(S.w1d2.C,"Sit Up","3","12",null,null,null,0),
  ex(S.w1d2.C,"Plank","3","25''",null,null,null,1),
  ex(S.w1d2.C,"Leg Raise","3","15",null,null,null,2),
  ex(S.w1d2.C,"Bike",null,"5 min",null,null,"Finisher",3),
  // EMOM 15'
  ex(S.w1d2.WK,"Assault Bike Calories",null,"10",null,null,"#emom# Min 1",0),
  ex(S.w1d2.WK,"DB Push Press",null,"10",null,null,"#emom# Min 2",1),
  ex(S.w1d2.WK,"Step Up",null,"8",null,null,"#emom# Min 3 + 8 Air Squat",2),

  // ══ W2D1 – Lower Body + Glute Flow ══════════════════════════
  ex(S.w2d1.W,"Skill Mill Walk",null,"8 min",null,null,"#cardio# camminata in salita",0),
  ex(S.w2d1.W,"Glute bridge","2","12",null,null,"#att# 2 giri",1),
  ex(S.w2d1.W,"KB Goblet Squat","2","8",null,null,"#mob# leggero · 2 giri",2),
  ex(S.w2d1.W,"Hip Opener","2","8+8",null,null,"#mob# 2 giri",3),
  ex(S.w2d1.W,"Cat Cow","2","8",null,null,"#mob# 2 giri",4),
  // Forza circuito rec 75''
  ex(S.w2d1.ST,"Sumo Deadlift","4","6","RPE 7","75 sec","#lower# circuito con Box Step Up",0),
  ex(S.w2d1.A,"Box Step Up",   "4","10+10",null,"75 sec","Circuito Forza — dopo Sumo DL",0),
  ex(S.w2d1.A,"Landmine Squat","3","10",null,"60 sec",null,1),
  ex(S.w2d1.A,"Leg extention", "3","12",null,"60 sec",null,2),
  ex(S.w2d1.C,"Knee To Chest","3","12",null,null,null,0),
  ex(S.w2d1.C,"Russian Twist","3","16",null,null,null,1),
  ex(S.w2d1.C,"Plank",        "3","30''",null,null,null,2),
  ex(S.w2d1.C,"Bike",null,"5 min",null,null,"Defaticamento",3),
  // AMRAP 15'
  ex(S.w2d1.WK,"Step Up",           null,"10",null,null,"#amrap#",0),
  ex(S.w2d1.WK,"KB American Swing", null,"12",null,null,"#amrap#",1),
  ex(S.w2d1.WK,"KB Goblet Squat",   null,"10",null,null,"#amrap#",2),
  ex(S.w2d1.WK,"Reverse Lunge",     null,"8+8",null,null,"#amrap# affondi posteriori",3),
  ex(S.w2d1.WK,"V Up",              null,"12",null,null,"#amrap#",4),

  // ══ W2D2 – Upper + Metabolic ════════════════════════════════
  ex(S.w2d2.W,"Bike",null,"8 min",null,null,"#cardio# + SkiErg",0),
  ex(S.w2d2.W,"Band Pull Apart","2","12",null,null,"#att# 2 giri",1),
  ex(S.w2d2.W,"Push Up Ginocchia","2","8",null,null,"#att# facilitati · 2 giri",2),
  ex(S.w2d2.W,"DB Shoulder Press","2","8",null,null,"#att# leggera · 2 giri",3),
  ex(S.w2d2.W,"Thoracic Rotation","2","6+6",null,null,"#mob# 2 giri",4),
  // Forza rec 75''
  ex(S.w2d2.ST,"Strict Press Bilanciere","4","6","RPE 7","75 sec","#upper# circuito con Sit Up",0),
  ex(S.w2d2.ST,"Sit Up",               "4","12",null,   "75 sec","#upper# circuito forza",1),
  // Superset accessori
  ex(S.w2d2.A,"Lat Machine",   "3","10",null,"60 sec","SUPERSET",0),
  ex(S.w2d2.A,"One Arm DB Row","3","10",null,"60 sec","SUPERSET — rematore manubri",1),
  ex(S.w2d2.A,"DB Lateral Raise","3","12",null,"60 sec","alzate laterali",2),
  ex(S.w2d2.A,"DB Pull Over",    "3","10",null,"60 sec","pullover manubrio",3),
  ex(S.w2d2.C,"Dead Bug Dinamico","3","10+10",null,null,null,0),
  ex(S.w2d2.C,"Plank",           "3","30''", null,null,null,1),
  ex(S.w2d2.C,"Crunch",          "3","15",   null,null,null,2),
  ex(S.w2d2.C,"Tapis Roulant",null,"5 min",null,null,"Defaticamento — camminata",3),
  // EMOM 15'
  ex(S.w2d2.WK,"SkiErg Calories",null,"8",null,null,"#emom# Min 1",0),
  ex(S.w2d2.WK,"KB Deadlift",    null,"10",null,null,"#emom# Min 2",1),
  ex(S.w2d2.WK,"Burpee",         null,"8",null,null,"#emom# Min 3",2),

  // ══ W3D1 – Lower Body + Full Body Flow ══════════════════════
  ex(S.w3d1.W,"Rower",null,"8 min",null,null,"#cardio# + camminata inclinata",0),
  ex(S.w3d1.W,"Glute bridge","2","12",null,null,"#att# 2 giri",1),
  ex(S.w3d1.W,"Affondo Dinamico","2","6+6",null,null,"#mob# 2 giri",2),
  ex(S.w3d1.W,"Front Squat",null,"6",null,null,"#mob# scarico · 2 giri",3),
  ex(S.w3d1.W,"Hip Circle",null,"10",null,null,"#mob# 2 giri",4),
  // Forza circuito rec 75-90''
  ex(S.w3d1.ST,"Front Squat","4","5","RPE 7.5","90 sec","#lower# circuito con Farmer Carry",0),
  ex(S.w3d1.A,"Farmer Carry",          "4","30 MT",null,"90 sec","Circuito Forza",0),
  ex(S.w3d1.A,"DB Bulgarian Split Squat","3","8+8",null,"60 sec",null,1),
  ex(S.w3d1.A,"Leg curl",              "3","12",  null,"60 sec",null,2),
  ex(S.w3d1.C,"Russian Twist","3","16",null,null,null,0),
  ex(S.w3d1.C,"Dead Bug Dinamico","3","10+10",null,null,null,1),
  ex(S.w3d1.C,"Plank",        "3","30''",null,null,null,2),
  ex(S.w3d1.C,"Bike",null,"6 min",null,null,"Finisher",3),
  // AMRAP 15'
  ex(S.w3d1.WK,"Step Up",          null,"12",null,null,"#amrap#",0),
  ex(S.w3d1.WK,"KB Swing",         null,"10",null,null,"#amrap#",1),
  ex(S.w3d1.WK,"KB Reverse Lunge", null,"8",null,null,"#amrap# front rack",2),
  ex(S.w3d1.WK,"Wall Ball",        null,"10",null,null,"#amrap#",3),
  ex(S.w3d1.WK,"Sit Up",           null,"12",null,null,"#amrap#",4),

  // ══ W3D2 – Upper Body + Conditioning ════════════════════════
  ex(S.w3d2.W,"Bike",null,"8 min",null,null,"#cardio#",0),
  ex(S.w3d2.W,"Band Pull Apart","2","12",null,null,"#att# 2 giri",1),
  ex(S.w3d2.W,"Push Up Ginocchia","2","8",null,null,"#att# su panca · 2 giri",2),
  ex(S.w3d2.W,"Shoulder Dislocation con Elastico","2","10",null,null,"#mob# 2 giri",3),
  ex(S.w3d2.W,"One Arm DB Row","2","8+8",null,null,"#att# rematore leggero · 2 giri",4),
  // Forza rec 75''
  ex(S.w3d2.ST,"DB Bench Press","4","8","RPE 7.5","75 sec","#upper# SUPERSET",0),
  ex(S.w3d2.ST,"Lat Machine",   "4","8",null,    "75 sec","#upper# SUPERSET",1),
  ex(S.w3d2.A,"DB Shoulder Press","3","10",null,"60 sec",null,0),
  ex(S.w3d2.A,"Face Pull con Elastico","3","20",null,"60 sec",null,1),
  ex(S.w3d2.C,"Sit Up",        "3","12",null,null,null,0),
  ex(S.w3d2.C,"Knee To Chest", "3","12",null,null,null,1),
  ex(S.w3d2.C,"Plank",         "3","30''",null,null,null,2),
  ex(S.w3d2.C,"Skill Mill Walk",null,"5 min",null,null,"Finisher — camminata inclinata",3),
  // EMOM 15'
  ex(S.w3d2.WK,"Rower Calories",null,"12",null,null,"#emom# Min 1",0),
  ex(S.w3d2.WK,"DB Push Press", null,"10",null,null,"#emom# Min 2",1),
  ex(S.w3d2.WK,"Half Burpee",   null,"8",null,null,"#emom# Min 3 sprint + 8 Air Squat",2),

  // ══ W4D1 – Full Body Metabolic (Scarico) ════════════════════
  ex(S.w4d1.W,"Bike",null,"8 min",null,null,"#cardio# + camminata",0),
  ex(S.w4d1.W,"Glute bridge","2","10",null,null,"#att# 2 giri",1),
  ex(S.w4d1.W,"Air Squat","2","8",null,null,"#mob# 2 giri",2),
  ex(S.w4d1.W,"Band Pull Apart","2","12",null,null,"#att# 2 giri",3),
  // Forza circuito rec 60''
  ex(S.w4d1.ST,"KB Goblet Squat","3","10","RPE 6","60 sec","#lower# circuito con Farmer Carry",0),
  ex(S.w4d1.A,"Farmer Carry",  "3","30 MT",null,"60 sec","Circuito Forza",0),
  ex(S.w4d1.A,"Hip Thrust a Corpo Libero","3","10",null,"60 sec",null,1),
  ex(S.w4d1.A,"Lat Machine",   "3","10",null,"60 sec",null,2),
  ex(S.w4d1.C,"Dead Bug Dinamico","3","10+10",null,null,null,0),
  ex(S.w4d1.C,"Russian Twist", "3","14",  null,null,null,1),
  ex(S.w4d1.C,"Plank",         "3","25''",null,null,null,2),
  ex(S.w4d1.C,"Tapis Roulant",null,"5 min",null,null,"Defaticamento — camminata",3),
  // AMRAP 12'
  ex(S.w4d1.WK,"Step Up",          null,"10",null,null,"#amrap#",0),
  ex(S.w4d1.WK,"KB Front Squat",   null,"10",null,null,"#amrap#",1),
  ex(S.w4d1.WK,"Push Up Ginocchia",null,"8",null,null,"#amrap# su panca",2),
  ex(S.w4d1.WK,"Plank Shoulder Tap",null,"20",null,null,"#amrap# shoulder touch",3),
  ex(S.w4d1.WK,"Rower",            null,"200 MT",null,null,"#amrap#",4),

  // ══ W4D2 – Full Body Flow (Scarico) ═════════════════════════
  ex(S.w4d2.W,"Rower",null,"8 min",null,null,"#cardio# + Bike",0),
  ex(S.w4d2.W,"Shoulder CARs",null,"6",null,null,"#mob# 2 giri",1),
  ex(S.w4d2.W,"Hip Opener","2","6+6",null,null,"#mob# 2 giri",2),
  ex(S.w4d2.W,"KB Goblet Squat","2","8",null,null,"#mob# leggero · 2 giri",3),
  ex(S.w4d2.W,"Push Up","2","10",null,null,"#att# 2 giri",4),
  // Forza rec 75''
  ex(S.w4d2.ST,"Sumo Deadlift","3","6","RPE 6","75 sec","#lower# circuito con Sit Up",0),
  ex(S.w4d2.ST,"Sit Up",       "3","12",null,  "75 sec","#lower# circuito forza",1),
  ex(S.w4d2.A,"DB Shoulder Press","3","10",null,"60 sec",null,0),
  ex(S.w4d2.A,"One Arm DB Row",  "3","10",null,"60 sec","rematore manubri",1),
  ex(S.w4d2.C,"Crunch",       "3","12+12",null,null,"obliquio",0),
  ex(S.w4d2.C,"Knee To Chest","3","10",  null,null,"a terra",1),
  ex(S.w4d2.C,"Plank",        "3","25''",null,null,null,2),
  ex(S.w4d2.C,"Skill Mill Walk",null,"5 min",null,null,"Finisher — camminata inclinata",3),
  // EMOM 12'
  ex(S.w4d2.WK,"Assault Bike Calories",null,"8",null,null,"#emom# Min 1",0),
  ex(S.w4d2.WK,"KB Deadlift",          null,"10",null,null,"#emom# Min 2",1),
  ex(S.w4d2.WK,"Step Up",              null,"10",null,null,"#emom# Min 3",2),
];

const { error } = await supabase.from("exercises").insert(rows);
if (error) console.error("❌ ERRORE:", error.message);
else console.log(`✅ Alessandra Rossetto giugno inserito! (${rows.length} esercizi su 8 giorni)`);
