import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://wltgyvkgevrrgznxtkxc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs"
);

// ── Libreria ────────────────────────────────────────────────────
const { error: libErr } = await supabase.from("exercise_library").insert([
  { name:"Shoulder Pass Through", category:"WARMUP", subcategory:"MOBILITÀ", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:false,load_kg:false,default_load:null,equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
  { name:"Back Extension", category:"WARMUP", subcategory:"MOBILITÀ", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:false,load_kg:false,default_load:null,equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
  { name:"Good Morning con Elastico", category:"WARMUP", subcategory:"MOBILITÀ", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:false,load_kg:false,default_load:null,equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
]);
if (libErr) console.error("❌ Libreria:", libErr.message);
else console.log("✅ 3 esercizi aggiunti in libreria");

// ── Setup ───────────────────────────────────────────────────────
const MONTH_ID = "000c4ab7-1d2c-46ed-b44b-5298e8304ac0";
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

// Subtype workout
await supabase.from("workout_sections").update({ section_subtype:"emom",     cap_time:"6"  }).eq("id", S.w1d1.WK);
await supabase.from("workout_sections").update({ section_subtype:"amrap",    cap_time:"6"  }).eq("id", S.w1d2.WK);
await supabase.from("workout_sections").update({ section_subtype:"emom",     cap_time:"6"  }).eq("id", S.w2d1.WK);
await supabase.from("workout_sections").update({ section_subtype:"amrap",    cap_time:"6"  }).eq("id", S.w2d2.WK);
await supabase.from("workout_sections").update({ section_subtype:"emom",     cap_time:"6"  }).eq("id", S.w3d1.WK);
await supabase.from("workout_sections").update({ section_subtype:"amrap",    cap_time:"6"  }).eq("id", S.w3d2.WK);
await supabase.from("workout_sections").update({ section_subtype:"cardioliss",cap_time:null }).eq("id", S.w4d1.WK);
await supabase.from("workout_sections").update({ section_subtype:"cardioliss",cap_time:null }).eq("id", S.w4d2.WK);
console.log("✅ Sezioni configurate");

// ── Warmup helpers ──────────────────────────────────────────────
const wuD1 = (sid) => [
  ex(sid,"Bike",null,"4 min",null,null,"#cardio#",0),
  ex(sid,"Cat Cow","1","10",null,null,"#mob#",1),
  ex(sid,"Shoulder Pass Through","1","15",null,null,"#mob#",2),
  ex(sid,"Monster Walk","1","20 passi",null,null,"#att#",3),
  ex(sid,"Squat to Stand","1","10",null,null,"#mob#",4),
];
const wuD2 = (sid, ex3name) => [
  ex(sid,"Rower",null,"4 min",null,null,"#cardio#",0),
  ex(sid,ex3name,"2","10",null,null,"#mob#",1),
  ex(sid,"Band Pull Apart","2","12",null,null,"#att#",2),
  ex(sid,"Glute bridge","2","12",null,null,"#att#",3),
];

const rows = [

  // ══ W1D1 ════════════════════════════════════════════════════
  ...wuD1(S.w1d1.W),
  // Forza
  ex(S.w1d1.ST,"Back Squat",    "5","5","RPE 7","90 sec","#lower#",0),
  ex(S.w1d1.ST,"Bench Press",   "5","5","RPE 7","90 sec","#upper#",1),
  // Accessori + EMOM 8'
  ex(S.w1d1.A,"Bulgarian Split Squat","3","8+8","10 DB","60 sec",null,0),
  ex(S.w1d1.A,"Lat Machine Presa Triangolo","3","10","20","60 sec","partenza 10+10 kg",1),
  ex(S.w1d1.A,"Push Up",null,"5",null,null,"EMOM 8' — Min 1",2),
  ex(S.w1d1.A,"Dip",null,"5",null,null,"EMOM 8' — Min 2",3),
  // Core
  ex(S.w1d1.C,"Plank","3","40''",null,null,null,0),
  ex(S.w1d1.C,"Hanging Knee Raise","3","10",null,null,null,1),
  // Workout EMOM 6'
  ex(S.w1d1.WK,"Assault Bike Calories",null,"10",null,null,"#emom# Min dispari",0),
  ex(S.w1d1.WK,"Farmer Carry",null,"20 MT",null,null,"#emom# Min pari",1),

  // ══ W1D2 ════════════════════════════════════════════════════
  ...wuD2(S.w1d2.W,"Hip Hinge con Bastone"),
  ex(S.w1d2.ST,"Deadlift",              "5","5","RPE 7","90 sec","#lower#",0),
  ex(S.w1d2.ST,"Strict Press Bilanciere","5","5","RPE 7","90 sec","#upper#",1),
  ex(S.w1d2.A,"Hip Thrust a Corpo Libero","3","10",null,"60 sec",null,0),
  ex(S.w1d2.A,"Pulley Machine",          "3","10",null,"60 sec",null,1),
  ex(S.w1d2.A,"Pull Up",null,"3",null,null,"EMOM 8' — Min 1",2),
  ex(S.w1d2.A,"Dip",null,"5",null,null,"EMOM 8' — Min 2",3),
  ex(S.w1d2.C,"Side Plank","3","30''/lato",null,null,null,0),
  ex(S.w1d2.C,"Farmer Carry","3","30 MT","24 KB",null,null,1),
  ex(S.w1d2.WK,"Box Step Up",null,"8",null,null,"#amrap#",0),
  ex(S.w1d2.WK,"KB Swing",   null,"8",null,null,"#amrap#",1),
  ex(S.w1d2.WK,"Rower",      null,"150 MT",null,null,"#amrap#",2),

  // ══ W2D1 ════════════════════════════════════════════════════
  ...wuD1(S.w2d1.W),
  ex(S.w2d1.ST,"Front Squat", "5","4","RPE 7.5","90 sec","#lower#",0),
  ex(S.w2d1.ST,"Bench Press", "5","4","RPE 7.5","90 sec","#upper#",1),
  ex(S.w2d1.A,"DB Step Up","3","10+10","10 DB","60 sec",null,0),
  ex(S.w2d1.A,"Lat Machine Presa Larga","3","10","25","60 sec","+5 kg rispetto W1",1),
  ex(S.w2d1.A,"Push Up",null,"6",null,null,"EMOM 8' — Min 1",2),
  ex(S.w2d1.A,"Dip",null,"6",null,null,"EMOM 8' — Min 2",3),
  ex(S.w2d1.C,"Plank","3","45''",null,null,null,0),
  ex(S.w2d1.C,"Hanging Knee Raise","3","10",null,null,null,1),
  ex(S.w2d1.WK,"Burpee",   null,"8",null,null,"#emom#",0),
  ex(S.w2d1.WK,"Wall Ball",null,"12","4",null,"#emom#",1),

  // ══ W2D2 ════════════════════════════════════════════════════
  ...wuD2(S.w2d2.W,"Back Extension"),
  ex(S.w2d2.ST,"Sumo Deadlift",         "5","4","RPE 7.5","120 sec","#lower#",0),
  ex(S.w2d2.ST,"Push Press Bilanciere", "5","4","RPE 7.5","90 sec", "#upper#",1),
  ex(S.w2d2.A,"Belt Squat","3","10","24","60 sec",null,0),
  ex(S.w2d2.A,"Ring Row",  "3","10",null,"60 sec",null,1),
  ex(S.w2d2.A,"Pull Up Assistito Elastico",null,"4",null,null,"EMOM 8' — Min 1",2),
  ex(S.w2d2.A,"Dip",null,"6",null,null,"EMOM 8' — Min 2",3),
  ex(S.w2d2.C,"Side Plank","3","35''/lato",null,null,null,0),
  ex(S.w2d2.C,"Farmer Carry","3","30 MT","24 KB",null,null,1),
  ex(S.w2d2.WK,"KB Goblet Squat",null,"10","12 KB",null,"#amrap#",0),
  ex(S.w2d2.WK,"KB Swing",       null,"20",null,   null,"#amrap#",1),
  ex(S.w2d2.WK,"SkiErg",         null,"150 MT",null,null,"#amrap#",2),

  // ══ W3D1 ════════════════════════════════════════════════════
  ...wuD1(S.w3d1.W),
  ex(S.w3d1.ST,"Back Squat", "5","3","RPE 8","120 sec","#lower#",0),
  ex(S.w3d1.ST,"Bench Press","5","3","RPE 8","90 sec", "#upper#",1),
  ex(S.w3d1.A,"Bulgarian Split Squat","3","10+10","12.5 DB","60 sec",null,0),
  ex(S.w3d1.A,"Lat Machine Presa Triangolo","4","8",null,"60 sec",null,1),
  ex(S.w3d1.A,"Push Up",null,"7",null,null,"EMOM 8' — Min 1",2),
  ex(S.w3d1.A,"Dip",null,"7",null,null,"EMOM 8' — Min 2",3),
  ex(S.w3d1.C,"Plank","3","50''",null,null,null,0),
  ex(S.w3d1.C,"Hanging Knee Raise","3","12",null,null,null,1),
  ex(S.w3d1.WK,"DB Walking Lunges",null,"12","10 DB",null,"#emom#",0),
  ex(S.w3d1.WK,"KB Suitcase Carry",null,"20 MT","20 KB",null,"#emom#",1),

  // ══ W3D2 ════════════════════════════════════════════════════
  ...wuD2(S.w3d2.W,"Good Morning con Elastico"),
  ex(S.w3d2.ST,"Deadlift",              "5","3","RPE 8","90 sec","#lower#",0),
  ex(S.w3d2.ST,"Strict Press Bilanciere","5","3","RPE 8","90 sec","#upper#",1),
  ex(S.w3d2.A,"Hip Thrust a Corpo Libero","4","8",null,"60 sec","SUPERSET",0),
  ex(S.w3d2.A,"Pulley Machine",           "4","8",null,"60 sec","SUPERSET",1),
  ex(S.w3d2.A,"Pull Up",null,"5",null,null,"EMOM 8' — Min 1",2),
  ex(S.w3d2.A,"Dip",null,"7",null,null,"EMOM 8' — Min 2",3),
  ex(S.w3d2.C,"Side Plank","3","40''/lato",null,null,null,0),
  ex(S.w3d2.C,"Reverse Crunch","3","15",null,null,"con soft ball",1),
  ex(S.w3d2.WK,"Step Up",null,"10",null,null,"#amrap#",0),
  ex(S.w3d2.WK,"Push Up",null,"10",null,null,"#amrap#",1),
  ex(S.w3d2.WK,"Rower",  null,"200 MT",null,null,"#amrap#",2),

  // ══ W4D1 (SCARICO) ══════════════════════════════════════════
  ...wuD1(S.w4d1.W),
  ex(S.w4d1.ST,"Front Squat","3","5","RPE 6.5","90 sec","#lower#",0),
  ex(S.w4d1.ST,"Bench Press","3","5","RPE 6.5","90 sec","#upper#",1),
  ex(S.w4d1.A,"DB Step Up",       "2","10+10",null,    "60 sec",null,0),
  ex(S.w4d1.A,"DB Shoulder Press","2","10",   "7.5 DB","60 sec",null,1),
  ex(S.w4d1.A,"Push Up",null,"4",null,null,"EMOM 6' — Min 1",2),
  ex(S.w4d1.A,"Dip",null,"4",null,null,"EMOM 6' — Min 2",3),
  ex(S.w4d1.C,"Plank","2","40''",null,null,null,0),
  ex(S.w4d1.C,"KB Russian Twist","2","20",null,null,null,1),
  ex(S.w4d1.WK,"Skill Mill Walk",null,"6 min",null,null,"#cardioliss# lieve pendenza",0),

  // ══ W4D2 (SCARICO) ══════════════════════════════════════════
  ...wuD2(S.w4d2.W,"Back Extension"),
  ex(S.w4d2.ST,"Sumo Deadlift",        "3","5","RPE 6.5","90 sec","#lower#",0),
  ex(S.w4d2.ST,"Push Press Bilanciere","3","5","RPE 6.5","90 sec","#upper#",1),
  ex(S.w4d2.A,"Belt Squat","2","10","20","60 sec","pausa 1'' in buca",0),
  ex(S.w4d2.A,"Ring Row",  "2","10",null,"60 sec",null,1),
  ex(S.w4d2.A,"Pull Up",null,"3",null,null,"EMOM 6' — Min 1",2),
  ex(S.w4d2.A,"Dip",null,"4",null,null,"EMOM 6' — Min 2",3),
  ex(S.w4d2.C,"Prono Plank",    "2","60''",     null,null,null,0),
  ex(S.w4d2.C,"Copenhagen Plank","2","30''/lato",null,null,null,1),
  ex(S.w4d2.WK,"Rower",null,"5 min",null,null,"#cardioliss# o SkiErg easy",0),
];

const { error } = await supabase.from("exercises").insert(rows);
if (error) console.error("❌ ERRORE:", error.message);
else console.log(`✅ Silvia giugno inserito! (${rows.length} esercizi su 8 giorni)`);
