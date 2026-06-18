import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://wltgyvkgevrrgznxtkxc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs"
);

// ── Libreria ────────────────────────────────────────────────────
const { error: libErr } = await supabase.from("exercise_library").insert([
  { name:"Spiderman Plank", category:"CORE TRAINING", subcategory:"NON ISOMETRICI",
    unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",
    load_pct:false,load_rpe:false,load_kg:false,default_load:null,
    equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
  { name:"Cable Pull Through", category:"ACCESSORI", subcategory:"BODYWEIGHT",
    unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",
    load_pct:false,load_rpe:true,load_kg:true,default_load:"kg",
    equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
]);
if (libErr) console.error("❌ Libreria:", libErr.message);
else console.log("✅ Spiderman Plank + Cable Pull Through aggiunti");

// ── Setup ───────────────────────────────────────────────────────
const MONTH_ID = "1fb7c90e-8343-4b97-b894-823b207b82a2";
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
  S[key] = { W: sec(secs,"warmup"), ST: sec(secs,"strength"), A: sec(secs,"accessories"), C: sec(secs,"core") };
}

const allSecs = Object.values(S).flatMap(s => Object.values(s)).filter(Boolean);
await supabase.from("exercises").delete().in("section_id", allSecs);
console.log("✅ Sezioni pronte");

// ── Warmup D1 (uguale tutte le settimane) ───────────────────────
const wuD1 = (sid) => [
  ex(sid,"Bike",null,"4 min",null,null,"#cardio#",0),
  ex(sid,"Hip CARs","2","6+6",null,null,"#mob#",1),
  ex(sid,"Glute bridge","2","10",null,null,"#att#",2),
  ex(sid,"Air Squat","2","10",null,null,"#mob#",3),
  ex(sid,"Band Pull Apart","2","12",null,null,"#att#",4),
];
// ── Warmup D2 (uguale tutte le settimane) ───────────────────────
const wuD2 = (sid) => [
  ex(sid,"Rower",null,"4 min",null,null,"#cardio#",0),
  ex(sid,"Hip Hinge con Bastone","2","8",null,null,"#mob#",1),
  ex(sid,"Good Morning con Elastico","2","10",null,null,"#mob#",2),
  ex(sid,"Band Pull Apart","2","12",null,null,"#att#",3),
  ex(sid,"Scapular Push Up","2","10",null,null,"#mob#",4),
];

const rows = [

  // ══ W1D1 – Squat + Push ═════════════════════════════════════
  ...wuD1(S.w1d1.W),
  ex(S.w1d1.ST,"Back Squat",  "4","6","RPE 6.5","90 sec","#lower#",0),
  ex(S.w1d1.ST,"DB Bench Press","4","8",null,   "75 sec","#upper#",1),
  ex(S.w1d1.A,"Belt Squat",          "3","10","16 KB","60 sec",null,0),
  ex(S.w1d1.A,"Bulgarian Split Squat","2","8+8","7.5 DB","60 sec","2 DB",1),
  ex(S.w1d1.A,"Lat Machine",         "3","10","20",   "60 sec","partenza 10+10 kg",2),
  ex(S.w1d1.C,"Pallof Press","2","10+10",null,null,null,0),
  ex(S.w1d1.C,"Plank",       "2","30''", null,null,null,1),
  ex(S.w1d1.C,"V Up",        "2","10",   null,null,null,2),

  // ══ W1D2 – Hinge + Upper ════════════════════════════════════
  ...wuD2(S.w1d2.W),
  ex(S.w1d2.ST,"KB Deadlift",              "4","10","16 KB","75 sec","#lower# 2 KB",0),
  ex(S.w1d2.ST,"Half Kneeling Landmine Press","4","8+8","13","75 sec","#upper#",1),
  ex(S.w1d2.A,"DB Step Up",    "2","8+8","12.5 DB","60 sec",null,0),
  ex(S.w1d2.A,"Pulley Machine","3","10", null,    "60 sec",null,1),
  ex(S.w1d2.A,"DB Glute Bridge","2","12","12.5 DB","45 sec","pausa 2''",2),
  ex(S.w1d2.C,"Med Ball Sit Up","2","10",null,null,"con press medball 4 kg",0),
  ex(S.w1d2.C,"KB Suitcase Carry","2","20 MT","20 KB",null,null,1),

  // ══ W2D1 – Squat + Push ═════════════════════════════════════
  ...wuD1(S.w2d1.W),
  ex(S.w2d1.ST,"Front Squat", "4","6","RPE 7","90 sec","#lower# bilanciere 15 kg",0),
  ex(S.w2d1.ST,"DB Bench Press","4","8",null, "75 sec","#upper# aumento carico 7.5/10 kg",1),
  ex(S.w2d1.A,"Belt Squat",            "3","10","20 KB","60 sec","più carico W1",0),
  ex(S.w2d1.A,"DB Reverse Lunge",      "2","10+10","10 DB","60 sec","2 DB",1),
  ex(S.w2d1.A,"Lat Machine Presa Triangolo","3","10","20","60 sec","partenza 10+10 kg",2),
  ex(S.w2d1.C,"Pallof Press",  "2","12+12",null,null,null,0),
  ex(S.w2d1.C,"Prono Plank",   "2","35''", null,null,"su fitball",1),
  ex(S.w2d1.C,"Reverse Crunch","2","12",   null,null,null,2),

  // ══ W2D2 – Hinge + Upper ════════════════════════════════════
  ...wuD2(S.w2d2.W),
  ex(S.w2d2.ST,"DB Romanian Deadlift","4","8",null,"75 sec","#lower# gambe semitese",0),
  ex(S.w2d2.ST,"DB Shoulder Press",  "4","8",null,"75 sec","#upper# da seduta",1),
  ex(S.w2d2.A,"Step Down",         "2","8+8","10 DB","60 sec","controllato",0),
  ex(S.w2d2.A,"Ring Row",          "3","10", null,   "60 sec",null,1),
  ex(S.w2d2.A,"Cable Pull Through","2","12", null,   "60 sec",null,2),
  ex(S.w2d2.C,"Dead Bug Dinamico","2","10",null,null,"con DB 5 kg",0),
  ex(S.w2d2.C,"Side Plank",       "2","25''/lato",null,null,null,1),
  ex(S.w2d2.C,"Russian Twist",    "2","20",null,null,"con DB 5 kg",2),

  // ══ W3D1 – Squat + Push ═════════════════════════════════════
  ...wuD1(S.w3d1.W),
  ex(S.w3d1.ST,"Back Squat",   "5","5","RPE 7.5","90 sec","#lower#",0),
  ex(S.w3d1.ST,"DB Bench Press","4","6-8",null, "75 sec","#upper#",1),
  ex(S.w3d1.A,"Belt Squat",          "3","8","20 KB","60 sec","RPE 8",0),
  ex(S.w3d1.A,"Bulgarian Split Squat","2","8+8","7.5 DB","60 sec",null,1),
  ex(S.w3d1.A,"Lat Machine",         "3","10",null,"60 sec",null,2),
  ex(S.w3d1.C,"Pallof Press",  "3","10+10",null,null,null,0),
  ex(S.w3d1.C,"Spiderman Plank","2","35''", null,null,null,1),
  ex(S.w3d1.C,"Bicycle Crunch","2","20",   null,null,"cyclette crunch",2),

  // ══ W3D2 – Hinge + Upper ════════════════════════════════════
  ...wuD2(S.w3d2.W),
  ex(S.w3d2.ST,"Sumo Deadlift","4","5","RPE 7.5","90 sec","#lower#",0),
  ex(S.w3d2.ST,"Landmine Press","4","8+8",null,  "75 sec","#upper# in piedi",1),
  ex(S.w3d2.A,"DB Reverse Lunge",    "2","8+8",null,"60 sec","affondi posteriori",0),
  ex(S.w3d2.A,"Pulley Machine",       "3","10", null,"60 sec",null,1),
  ex(S.w3d2.A,"Single Leg RDL Manubrio","2","8+8",null,"60 sec",null,2),
  ex(S.w3d2.C,"Sit Up",           "2","12",  null,null,null,0),
  ex(S.w3d2.C,"KB Suitcase Carry","2","30 MT",null,null,null,1),

  // ══ W4D1 – Squat + Push (SCARICO) ═══════════════════════════
  ...wuD1(S.w4d1.W),
  ex(S.w4d1.ST,"Front Squat",   "3","8","RPE 6","75 sec","#lower#",0),
  ex(S.w4d1.ST,"DB Bench Press","3","8",null,  "60 sec","#upper# facile",1),
  ex(S.w4d1.A,"Landmine Squat",   "2","10",null,   "60 sec",null,0),
  ex(S.w4d1.A,"DB Walking Lunges","2","8+8","5 DB","60 sec","affondi camminati 1 DB",1),
  ex(S.w4d1.A,"KB Gorilla Row",   "2","10",null,   "60 sec",null,2),
  ex(S.w4d1.C,"Pallof Press","2","10",  null,null,null,0),
  ex(S.w4d1.C,"Prono Plank", "2","45''",null,null,null,1),

  // ══ W4D2 – Hinge + Upper (SCARICO) ══════════════════════════
  ...wuD2(S.w4d2.W),
  ex(S.w4d2.ST,"KB Deadlift",         "3","12","12 KB","60 sec","#lower# 2 KB",0),
  ex(S.w4d2.ST,"Half Kneeling DB Press","3","8+8","7.5 DB","60 sec","#upper#",1),
  ex(S.w4d2.A,"KB Goblet Squat","2","10",null,"60 sec","su rialzo",0),
  ex(S.w4d2.A,"Pulley Machine", "2","10",null,"60 sec",null,1),
  ex(S.w4d2.A,"Leg curl",       "2","12",null,"60 sec",null,2),
  ex(S.w4d2.C,"Dead Bug Dinamico","2","10",null,null,null,0),
  ex(S.w4d2.C,"Side Plank",      "2","20''/lato",null,null,null,1),
  ex(S.w4d2.C,"V Up",            "2","12",null,null,null,2),
];

const { error } = await supabase.from("exercises").insert(rows);
if (error) console.error("❌ ERRORE:", error.message);
else console.log(`✅ Valentina Furlan giugno inserito! (${rows.length} esercizi su 8 giorni)`);
