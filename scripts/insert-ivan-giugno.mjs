import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://wltgyvkgevrrgznxtkxc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs"
);

// ── Libreria ────────────────────────────────────────────────────
const { error: libErr } = await supabase.from("exercise_library").insert([
  { name:"Leg Press", category:"ACCESSORI", subcategory:"BODYWEIGHT",
    unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",
    load_pct:false,load_rpe:true,load_kg:true,default_load:"kg",
    equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
  { name:"DB Incline Curl", category:"ACCESSORI", subcategory:"MANUBRI",
    unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",
    load_pct:false,load_rpe:true,load_kg:true,default_load:"kg",
    equip_barbell:false,equip_db:true,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:"db" },
  { name:"Tapis Roulant", category:"WARMUP", subcategory:"CARDIO",
    unit_min:true,unit_cal:false,unit_rep:false,default_unit:"min",
    load_pct:false,load_rpe:false,load_kg:false,default_load:null,
    equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
]);
if (libErr) console.error("❌ Libreria:", libErr.message);
else console.log("✅ 3 esercizi aggiunti in libreria");

// ── Setup ───────────────────────────────────────────────────────
const MONTH_ID = "bab00f97-9df2-4605-81f7-2bde7b837624";
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
  S[key] = { W: sec(secs,"warmup"), ST: sec(secs,"strength"), A: sec(secs,"accessories"), C: sec(secs,"core") };
}

const allSecs = Object.values(S).flatMap(s => Object.values(s)).filter(Boolean);
await supabase.from("exercises").delete().in("section_id", allSecs);
console.log("✅ Sezioni pronte");

// ── Warmup A: Squat Day (uguale tutte le settimane) ─────────────
const wuA = (sid) => [
  ex(sid,"Bike",null,"4 min",null,null,"#cardio# o Tapis Roulant",0),
  ex(sid,"Cat Cow","1","10",null,null,"#mob#",1),
  ex(sid,"90/90 Hip Switch","1","6+6",null,null,"#mob#",2),
  ex(sid,"Glute bridge","1","12",null,null,"#att#",3),
  ex(sid,"Monster Walk","1","20 passi",null,null,"#att#",4),
];

// ── Warmup B: Upper Day ─────────────────────────────────────────
const wuB = (sid) => [
  ex(sid,"Bike",null,"4 min",null,null,"#cardio# o Rower",0),
  ex(sid,"Band Pull Apart","2","15",null,null,"#att#",1),
  ex(sid,"Shoulder CARs","1","6",null,null,"#mob#",2),
  ex(sid,"Open Book","1","6+6",null,null,"#mob#",3),
  ex(sid,"Scapular Push Up","1","10",null,null,"#mob#",4),
];

// ── Warmup C: Hinge Day ─────────────────────────────────────────
const wuC = (sid) => [
  ex(sid,"Rower",null,"4 min",null,null,"#cardio#",0),
  ex(sid,"Hip Hinge con Bastone","2","10",null,null,"#mob#",1),
  ex(sid,"Cat Cow","1","10",null,null,"#mob#",2),
  ex(sid,"Glute bridge","1","12",null,null,"#att#",3),
  ex(sid,"Bird Dog","1","6+6",null,null,"#mob#",4),
];

// ── Accessori A (uguali tutte le settimane) ─────────────────────
const accA = (sid) => [
  ex(sid,"Bulgarian Split Squat","3","8+8",null,"60 sec",null,0),
  ex(sid,"Dead Bug Dinamico",    "3","8+8",null,"60 sec",null,1),
  ex(sid,"Leg Press",            "3","12", null,"60 sec","o DB Reverse Lunge",2),
  ex(sid,"Leg curl",             "3","12", null,"60 sec",null,3),
  ex(sid,"Calf Raise",           "3","15", null,"45 sec",null,4),
  ex(sid,"Farmer Carry",         "3","25 MT",null,"45 sec",null,5),
];

// ── Accessori B ─────────────────────────────────────────────────
const accB = (sid) => [
  ex(sid,"DB Shoulder Press",    "3","10", null,"60 sec",null,0),
  ex(sid,"Lat Machine",          "3","10", null,"60 sec",null,1),
  ex(sid,"Pulley Machine",       "3","10", null,"60 sec",null,2),
  ex(sid,"DB Lateral Raise",     "3","12", null,"60 sec",null,3),
  ex(sid,"DB Incline Curl",      "3","12", null,"45 sec",null,4),
  ex(sid,"Push down (TRICEPS)",  "3","12", null,"45 sec",null,5),
];

// ── Accessori C ─────────────────────────────────────────────────
const accC = (sid) => [
  ex(sid,"Leg curl",                  "3","12",  null,"60 sec",null,0),
  ex(sid,"Bird Dog Dinamico",         "3","6+6",  null,"60 sec",null,1),
  ex(sid,"DB Walking Lunges",         "3","10+10",null,"60 sec",null,2),
  ex(sid,"Pull Up Assistito Elastico","3","8-10", null,"60 sec","o Lat Machine",3),
  ex(sid,"Dip",                       "3","8-10", null,"45 sec",null,4),
  ex(sid,"Calf Raise",                "3","15",   null,"45 sec",null,5),
];

// ── Core A ──────────────────────────────────────────────────────
const coreA = (sid) => [
  ex(sid,"Prono Plank","3","40''",null,null,null,0),
  ex(sid,"Hollow Hold","3","30''",null,null,null,1),
];

// ── Core B ──────────────────────────────────────────────────────
const coreB = (sid) => [
  ex(sid,"Pallof Press","3","10+10",null,null,null,0),
  ex(sid,"Side Plank",  "3","20-30''/lato",null,null,null,1),
];

// ── Core C ──────────────────────────────────────────────────────
const coreC = (sid) => [
  ex(sid,"KB Suitcase Carry","3","20 MT/lato","24 KB",null,null,0),
  ex(sid,"Prono Plank",      "3","30''",null,null,null,1),
];

const rows = [
  // ══ WEEK 1 ══════════════════════════════════════════════════
  // W1D1 – Training A: Back Squat 4x8
  ...wuA(S.w1d1.W),
  ex(S.w1d1.ST,"Back Squat","4","8",null,"75 sec","#lower#",0),
  ...accA(S.w1d1.A),
  ...coreA(S.w1d1.C),

  // W1D2 – Training B: Bench Press 4x8
  ...wuB(S.w1d2.W),
  ex(S.w1d2.ST,"Bench Press","4","8",null,"90 sec","#upper#",0),
  ...accB(S.w1d2.A),
  ...coreB(S.w1d2.C),

  // W1D3 – Training C: Sumo Deadlift 4x8
  ...wuC(S.w1d3.W),
  ex(S.w1d3.ST,"Sumo Deadlift","4","8",null,"90 sec","#lower#",0),
  ...accC(S.w1d3.A),
  ...coreC(S.w1d3.C),

  // ══ WEEK 2 ══════════════════════════════════════════════════
  // W2D1 – Training A: Front Squat 4x8
  ...wuA(S.w2d1.W),
  ex(S.w2d1.ST,"Front Squat","4","8",null,"75 sec","#lower#",0),
  ...accA(S.w2d1.A),
  ...coreA(S.w2d1.C),

  // W2D2 – Training B: Incline Bench Press Manubri 4x8
  ...wuB(S.w2d2.W),
  ex(S.w2d2.ST,"DB Incline Bench Press","4","8",null,"90 sec","#upper#",0),
  ...accB(S.w2d2.A),
  ...coreB(S.w2d2.C),

  // W2D3 – Training C: Sumo Deadlift 5x6
  ...wuC(S.w2d3.W),
  ex(S.w2d3.ST,"Sumo Deadlift","5","6",null,"90 sec","#lower#",0),
  ...accC(S.w2d3.A),
  ...coreC(S.w2d3.C),

  // ══ WEEK 3 ══════════════════════════════════════════════════
  // W3D1 – Training A: Back Squat 5x6
  ...wuA(S.w3d1.W),
  ex(S.w3d1.ST,"Back Squat","5","6",null,"75 sec","#lower#",0),
  ...accA(S.w3d1.A),
  ...coreA(S.w3d1.C),

  // W3D2 – Training B: Bench Press 5x6
  ...wuB(S.w3d2.W),
  ex(S.w3d2.ST,"Bench Press","5","6",null,"90 sec","#upper#",0),
  ...accB(S.w3d2.A),
  ...coreB(S.w3d2.C),

  // W3D3 – Training C: Romanian Deadlift 4x8
  ...wuC(S.w3d3.W),
  ex(S.w3d3.ST,"Romanian Deadlift","4","8",null,"90 sec","#lower# gambe semitese",0),
  ...accC(S.w3d3.A),
  ...coreC(S.w3d3.C),

  // ══ WEEK 4 ══════════════════════════════════════════════════
  // W4D1 – Training A: Front Squat 3x8
  ...wuA(S.w4d1.W),
  ex(S.w4d1.ST,"Front Squat","3","8",null,"75 sec","#lower#",0),
  ...accA(S.w4d1.A),
  ...coreA(S.w4d1.C),

  // W4D2 – Training B: Incline Bench Press Manubri 3x8
  ...wuB(S.w4d2.W),
  ex(S.w4d2.ST,"DB Incline Bench Press","3","8",null,"90 sec","#upper#",0),
  ...accB(S.w4d2.A),
  ...coreB(S.w4d2.C),

  // W4D3 – Training C: Sumo Deadlift 3x8
  ...wuC(S.w4d3.W),
  ex(S.w4d3.ST,"Sumo Deadlift","3","8",null,"90 sec","#lower#",0),
  ...accC(S.w4d3.A),
  ...coreC(S.w4d3.C),
];

const { error } = await supabase.from("exercises").insert(rows);
if (error) console.error("❌ ERRORE:", error.message);
else console.log(`✅ Ivan giugno inserito! (${rows.length} esercizi su 12 giorni)`);
