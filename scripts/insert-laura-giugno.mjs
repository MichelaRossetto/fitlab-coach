import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://wltgyvkgevrrgznxtkxc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs"
);

// ── Libreria ────────────────────────────────────────────────────
const { error: libErr } = await supabase.from("exercise_library").insert([
  { name:"Half Kneeling Landmine Press", category:"ACCESSORI", subcategory:"BILANCIERE",
    unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",
    load_pct:false,load_rpe:true,load_kg:true,default_load:"kg",
    equip_barbell:true,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:"barbell" },
  { name:"Landmine Thruster", category:"ACCESSORI", subcategory:"BILANCIERE",
    unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",
    load_pct:false,load_rpe:true,load_kg:true,default_load:"kg",
    equip_barbell:true,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:"barbell" },
  { name:"Landmine Thruster", category:"WORKOUT", subcategory:null,
    unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",
    load_pct:false,load_rpe:true,load_kg:true,default_load:"kg",
    equip_barbell:true,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:"barbell" },
]);
if (libErr) console.error("❌ Libreria:", libErr.message);
else console.log("✅ Half Kneeling Landmine Press + Landmine Thruster aggiunti");

// ── Setup ───────────────────────────────────────────────────────
const MONTH_ID = "f0727d55-3db6-4ed7-8f71-d5d71a87f8a6";
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

// ── Warmup D1 (uguale W1-W4) ────────────────────────────────────
const wuD1 = (sid) => [
  ex(sid,"Bike",null,"4 min",null,null,"#cardio#",0),
  ex(sid,"Hip CARs","2","6+6",null,null,"#mob#",1),
  ex(sid,"Glute bridge","2","10",null,null,"#att#",2),
  ex(sid,"Air Squat","2","10",null,null,"#mob#",3),
  ex(sid,"Band Pull Apart","2","12",null,null,"#att#",4),
];

const rows = [

  // ══ W1D1 – Lower + Push ══════════════════════════════════════
  ...wuD1(S.w1d1.W),
  ex(S.w1d1.ST,"Front Squat", "4","6","RPE 6.5","90 sec","#lower# Rec.attivo: 40'' Bike easy",0),
  ex(S.w1d1.ST,"DB Bench Press","4","8",null,   "90 sec","#upper# Rec.attivo: 200 MT Row o SkiErg easy",1),
  ex(S.w1d1.A,"DB Reverse Lunge",  "3","8+8", null,null,"SUPERSET",0),
  ex(S.w1d1.A,"Lat Machine",       "3","10",  null,null,"SUPERSET · Rec.attivo: 1' camminata inclinata",1),
  ex(S.w1d1.A,"Landmine Squat",    "2","10",  null,null,"Rec.attivo: 40'' Bike",2),
  ex(S.w1d1.C,"Pallof Press","2","10+10",null,null,null,0),
  ex(S.w1d1.C,"Plank",       "2","30''", null,null,null,1),
  ex(S.w1d1.C,"KB Suitcase Carry","2","30 MT",null,null,null,2),

  // ══ W1D2 – Hinge + Full Body ══════════════════════════════════
  ex(S.w1d2.W,"Rower",null,"4 min",null,null,"#cardio#",0),
  ex(S.w1d2.W,"Good Morning con Elastico","2","8",null,null,"#mob#",1),
  ex(S.w1d2.W,"Squat to Stand","2","10",null,null,"#mob#",2),
  ex(S.w1d2.W,"Scapular Push Up","2","10",null,null,"#mob#",3),
  ex(S.w1d2.W,"Band Pull Apart","2","12",null,null,"#att#",4),
  ex(S.w1d2.ST,"KB Deadlift",              "4","10","20 KB","90 sec","#lower# 2 KB · Rec.attivo: 40'' Bike easy",0),
  ex(S.w1d2.ST,"Half Kneeling Landmine Press","4","8+8",null,"90 sec","#upper# Rec.attivo: 200 MT Row easy",1),
  ex(S.w1d2.A,"DB Step Up",      "2","8+8", null,null,"SUPERSET",0),
  ex(S.w1d2.A,"Pulley Machine",  "3","10",  null,null,"SUPERSET · Rec.attivo: 1' camminata inclinata",1),
  ex(S.w1d2.A,"DB Thruster",     "2","10",  null,null,"Rec.attivo: 40'' Bike",2),
  ex(S.w1d2.C,"Dead Bug Dinamico","2","10",null,null,null,0),
  ex(S.w1d2.C,"Side Plank",      "2","20''",null,null,null,1),
  ex(S.w1d2.C,"Toe Touch",       "2","15", null,null,null,2),

  // ══ W2D1 – Lower + Push ══════════════════════════════════════
  ...wuD1(S.w2d1.W),
  ex(S.w2d1.ST,"Back Squat",  "4","6","RPE 7",null,"#lower# Rec.attivo: 40'' Bike easy",0),
  ex(S.w2d1.ST,"DB Bench Press","4","8",null, null,"#upper# aumento carico · Rec.attivo: 200 MT Row easy",1),
  ex(S.w2d1.A,"DB Walking Lunges",        "3","10+10",null,null,"SUPERSET",0),
  ex(S.w2d1.A,"Lat Machine Presa Triangolo","3","10", null,null,"SUPERSET · Rec.attivo: 1'",1),
  ex(S.w2d1.A,"Landmine Squat",           "2","12",   null,null,"Rec.attivo: 40'' Bike",2),
  ex(S.w2d1.C,"Pallof Press",  "2","12+12",null,null,null,0),
  ex(S.w2d1.C,"Plank su Fitball","2","35''",null,null,null,1),
  ex(S.w2d1.C,"Farmer Carry",  "2","30 MT",null,null,null,2),

  // ══ W2D2 – Hinge + Full Body ══════════════════════════════════
  ex(S.w2d2.W,"Rower",null,"4 min",null,null,"#cardio#",0),
  ex(S.w2d2.W,"Good Morning a Corpo Libero","2","10",null,null,"#mob#",1),
  ex(S.w2d2.W,"Scapular Push Up","2","10",null,null,"#mob#",2),
  ex(S.w2d2.W,"Band Pull Apart","2","12",null,null,"#att#",3),
  ex(S.w2d2.ST,"DB Romanian Deadlift","4","8",null,null,"#lower# Rec.attivo: 40'' Bike easy",0),
  ex(S.w2d2.ST,"Landmine Press",     "4","8+8",null,null,"#upper# Rec.attivo: 200 MT Row easy",1),
  ex(S.w2d2.A,"Step Down",     "2","8+8",null,null,"SUPERSET · controllato",0),
  ex(S.w2d2.A,"Pulley Machine","3","10", null,null,"SUPERSET · Rec.attivo: 1' camminata",1),
  ex(S.w2d2.A,"Landmine Thruster","2","10",null,null,"Rec.attivo: 40'' Bike",2),
  ex(S.w2d2.C,"Dead Bug Dinamico","2","10",null,null,"con DB",0),
  ex(S.w2d2.C,"Side Plank",    "2","25''",null,null,null,1),
  ex(S.w2d2.C,"V Up",          "2","12",  null,null,null,2),

  // ══ W3D1 – Lower + Push ══════════════════════════════════════
  ...wuD1(S.w3d1.W),
  ex(S.w3d1.ST,"Front Squat",     "5","5","RPE 7.5","90 sec","#lower# Rec.attivo: 40'' Bike easy",0),
  ex(S.w3d1.ST,"DB Shoulder Press","4","8",null,    "90 sec","#upper# Rec.attivo: 200 MT Row easy",1),
  ex(S.w3d1.A,"Bulgarian Split Squat","3","8+8",null,null,"SUPERSET",0),
  ex(S.w3d1.A,"Lat Machine",         "3","10", null,null,"SUPERSET · Rec.attivo: 1'",1),
  ex(S.w3d1.A,"Landmine Squat",      "2","12", null,null,"Rec.attivo: 40'' Bike",2),
  ex(S.w3d1.C,"Pallof Press",     "3","10+10",null,null,null,0),
  ex(S.w3d1.C,"Plank Shoulder Tap","2","16",  null,null,null,1),
  ex(S.w3d1.C,"Sit Up",           "3","16",   null,null,null,2),

  // ══ W3D2 – Hinge + Full Body ══════════════════════════════════
  ex(S.w3d2.W,"Rower",null,"4 min",null,null,"#cardio#",0),
  ex(S.w3d2.W,"Hip Opener","2","8",null,null,"#mob#",1),
  ex(S.w3d2.W,"Good Morning a Corpo Libero","2","10",null,null,"#mob#",2),
  ex(S.w3d2.W,"Scapular Push Up","2","10",null,null,"#mob#",3),
  ex(S.w3d2.W,"Band Pull Apart","2","12",null,null,"#att#",4),
  ex(S.w3d2.ST,"Sumo Deadlift", "4","5","RPE 7.5","90 sec","#lower# Rec.attivo: 40'' Bike easy",0),
  ex(S.w3d2.ST,"Landmine Press","4","8+8",null,   "90 sec","#upper# Rec.attivo: 200 MT Row easy",1),
  ex(S.w3d2.A,"DB Step Up",      "2","10+10",null,null,"SUPERSET",0),
  ex(S.w3d2.A,"Pulley Machine",  "3","10",  null,null,"SUPERSET · Rec.attivo: 1'",1),
  ex(S.w3d2.A,"DB Thruster",     "2","12",  null,null,"Rec.attivo: 40'' Bike",2),
  ex(S.w3d2.C,"Dead Bug Dinamico","2","12",null,null,"con DB",0),
  ex(S.w3d2.C,"Side Plank con Reach","2","20''",null,null,"Reach Through",1),
  ex(S.w3d2.C,"Toe Touch",       "2","20", null,null,null,2),

  // ══ W4D1 – Lower + Push (SCARICO) ════════════════════════════
  ...wuD1(S.w4d1.W),
  ex(S.w4d1.ST,"Back Squat",   "3","8","RPE 6",null,"#lower# Rec.attivo: 40'' Bike easy",0),
  ex(S.w4d1.ST,"DB Bench Press","3","8",null,  null,"#upper# facile · Rec.attivo: 200 MT Row easy",1),
  ex(S.w4d1.A,"DB Reverse Lunge","2","8+8",null,null,"SUPERSET",0),
  ex(S.w4d1.A,"Lat Machine",    "2","10", null,null,"SUPERSET · Rec.attivo: 1'",1),
  ex(S.w4d1.A,"Landmine Squat", "2","10", null,null,"Rec.attivo: 40'' Bike",2),
  ex(S.w4d1.C,"Pallof Press","2","10+10",null,null,null,0),
  ex(S.w4d1.C,"Plank",       "2","25''", null,null,null,1),
  ex(S.w4d1.C,"Farmer Carry","2","20 MT",null,null,null,2),

  // ══ W4D2 – Hinge + Full Body (SCARICO) ═══════════════════════
  ex(S.w4d2.W,"Rower",null,"4 min",null,null,"#cardio#",0),
  ex(S.w4d2.W,"DB Reverse Lunge","2","8+8",null,null,"#mob# affondi posteriori",1),
  ex(S.w4d2.W,"Good Morning a Corpo Libero","2","10",null,null,"#mob#",2),
  ex(S.w4d2.W,"Scapular Push Up","2","10",null,null,"#mob#",3),
  ex(S.w4d2.W,"Band Pull Apart","2","12",null,null,"#att#",4),
  ex(S.w4d2.ST,"KB Deadlift",              "3","10",null,null,"#lower# tecnico · Rec.attivo: 40'' Bike easy",0),
  ex(S.w4d2.ST,"Half Kneeling Landmine Press","3","8+8",null,null,"#upper# Rec.attivo: 200 MT Row easy",1),
  ex(S.w4d2.A,"DB Step Up",      "2","8+8",null,null,"SUPERSET",0),
  ex(S.w4d2.A,"Pulley Machine",  "2","10", null,null,"SUPERSET · Rec.attivo: 1'",1),
  ex(S.w4d2.A,"Landmine Thruster","2","10",null,null,"Rec.attivo: 40'' Bike",2),
  ex(S.w4d2.C,"Dead Bug Dinamico","2","10",null,null,null,0),
  ex(S.w4d2.C,"Side Plank",      "2","20''",null,null,null,1),
  ex(S.w4d2.C,"V Up",            "2","12", null,null,"alternati",2),
];

const { error } = await supabase.from("exercises").insert(rows);
if (error) console.error("❌ ERRORE:", error.message);
else console.log(`✅ Laura Bincoletto giugno inserito! (${rows.length} esercizi su 8 giorni)`);
