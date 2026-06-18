import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://wltgyvkgevrrgznxtkxc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs"
);

// ── Libreria ────────────────────────────────────────────────────
const { error: libErr } = await supabase.from("exercise_library").insert([
  { name:"Pallof Hold", category:"CORE TRAINING", subcategory:"ISOMETRICI", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:false,load_kg:false,default_load:null,equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
  { name:"Standing Abduction Elastico", category:"ACCESSORI", subcategory:"BODYWEIGHT", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:false,load_kg:false,default_load:null,equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
  { name:"DB Split Stance RDL", category:"ACCESSORI", subcategory:"MANUBRI", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:true,load_kg:true,default_load:"kg",equip_barbell:false,equip_db:true,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:"db" },
  { name:"Pelvic Tilt su Fitball", category:"CORE TRAINING", subcategory:"ISOMETRICI", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:false,load_kg:false,default_load:null,equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
  { name:"Rocking Bacino Quadrupedia", category:"CORE TRAINING", subcategory:"NON ISOMETRICI", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:false,load_kg:false,default_load:null,equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
  { name:"Lat Machine Presa Inversa", category:"FORZA", subcategory:"UPPER BODY", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:true,load_kg:true,default_load:"kg",equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
  { name:"Fitball Breathing Drill", category:"CORE TRAINING", subcategory:"ISOMETRICI", unit_min:true,unit_cal:false,unit_rep:false,default_unit:"min",load_pct:false,load_rpe:false,load_kg:false,default_load:null,equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
]);
if (libErr) console.error("❌ Libreria:", libErr.message);
else console.log("✅ 7 esercizi aggiunti in libreria");

// ── Setup ───────────────────────────────────────────────────────
const MONTH_ID = "886c70d7-1fb6-4d33-af2d-d1084ba15a39";
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
const wkUpdates = [
  ["w1d1","fortime",null],["w1d2","amrap","10"],["w1d3","amrap","12"],
  ["w2d1","fortime",null],["w2d2","amrap","8"], ["w2d3","amrap","12"],
  ["w3d1","fortime",null],["w3d2","amrap","8"], ["w3d3","amrap","14"],
  ["w4d1","cardioliss",null],["w4d2","amrap","8"],["w4d3","amrap","15"],
];
for (const [k,sub,cap] of wkUpdates) {
  if (S[k]?.WK) await supabase.from("workout_sections").update({ section_subtype:sub, cap_time:cap }).eq("id", S[k].WK);
}
console.log("✅ Sezioni configurate");

// ── Warmup helpers ──────────────────────────────────────────────
const wuD1 = (sid, bikeMin, monsterReps, hipCircle, hasAffondi, respSec) => {
  const base = [
    ex(sid,"Bike",null,`${bikeMin} min`,null,null,"#cardio# leggera",0),
    ex(sid,"Cat Cow","2","8",null,null,"#mob#",1),
    ex(sid,"Monster Walk","2",monsterReps,null,null,"#att# elastico",2),
    ex(sid,"Hip Circle",null,hipCircle,null,null,"#mob#",3),
  ];
  if (hasAffondi) base.push(ex(sid,hasAffondi,"2","8+8",null,null,"#mob#",4));
  base.push(ex(sid,"Respirazione Diaframmatica",null,`${respSec}''`,null,null,"#mob# diaframmatica",base.length));
  return base;
};
const wuD2 = (sid, cardioEx, cardioMin, hasResp, hasFacePull, bpReps) => {
  const base = [
    ex(sid,cardioEx,null,`${cardioMin} min`,null,null,"#cardio#",0),
    ex(sid,"Band Pull Apart","2",String(bpReps),null,null,"#att#",1),
    ex(sid,"Shoulder CARs",null,"6+6",null,null,"#mob#",2),
    ex(sid,"Wall Slide","2","10",null,null,"#mob#",3),
  ];
  if (hasFacePull) base.push(ex(sid,"Face Pull con Elastico","2","12",null,null,"#att#",4));
  if (hasResp) base.push(ex(sid,"Respirazione Diaframmatica",null,"60''",null,null,"#mob#",base.length));
  return base;
};
const wuD3 = (sid, camminataMin, hipCircle, affondo, hasCossack) => {
  const base = [
    ex(sid,"Skill Mill Walk",null,`${camminataMin} min`,null,null,"#cardio# inclinata",0),
    ex(sid,"Cat Cow","2","8",null,null,"#mob#",1),
    ex(sid,"Hip Circle",null,hipCircle,null,null,"#mob#",2),
  ];
  if (hasCossack) base.push(ex(sid,"Cossack Squat","2","8+8",null,null,"#mob#",3));
  else if (affondo) base.push(ex(sid,affondo,"2","8+8",null,null,"#mob#",3));
  base.push(ex(sid,"Shoulder CARs",null,"6+6",null,null,"#mob#",base.length));
  base.push(ex(sid,"Band Pull Apart","2","15",null,null,"#att#",base.length));
  base.push(ex(sid,"Respirazione Diaframmatica",null,"60''",null,null,"#mob#",base.length));
  return base;
};

// ── Pelvis D1 (lower) ───────────────────────────────────────────
const pelvisD1 = (sid, startIdx, hasChild) => {
  const base = [
    ex(sid,"Pelvic Tilt su Fitball","2","12",null,null,"Pelvis — retroversione lenta e controllata, respirazione fluida",startIdx),
    ex(sid,"Hip Circle",null,"30''+30''",null,null,"Pelvis — su fitball, cerchi morbidi orario e antiorario",startIdx+1),
  ];
  if (hasChild) base.push(ex(sid,"Child's Pose",null,"60''",null,null,"Pelvis & Relax",startIdx+2));
  return base;
};
// ── Pelvis D2 (upper) ───────────────────────────────────────────
const pelvisD2 = (sid, startIdx, hasDrill) => {
  const base = [
    ex(sid,"Cat Cow","2","8",null,null,"Pelvis — respirazione e mobilità",startIdx),
    ex(sid,"Rocking Bacino Quadrupedia","2","10",null,null,"Pelvis — movimento morbido",startIdx+1),
  ];
  if (hasDrill) base.push(ex(sid,"Fitball Breathing Drill",null,"2 min",null,null,"Pelvis",startIdx+2));
  return base;
};
// ── Pelvis D3 (full body) ────────────────────────────────────────
const pelvisD3 = (sid, startIdx, respNote) => [
  ex(sid,"Pelvic Tilt su Fitball","2","12",null,null,"Pelvis & Relax",startIdx),
  ex(sid,"Hip Circle",null,"30''",null,null,"Pelvis — su fitball",startIdx+1),
  ex(sid,"Child's Pose",null,"60''",null,null,"Pelvis & Relax",startIdx+2),
  ex(sid,"Respirazione Diaframmatica",null,respNote,null,null,"Pelvis — lenta",startIdx+3),
];

const rows = [

  // ══ W1D1 – Lower Body + Pelvis ══════════════════════════════
  ...wuD1(S.w1d1.W,"4","12 passi","10+10",null,90),
  ex(S.w1d1.ST,"Belt Squat",         "4","8","RPE 6","75 sec","#lower#",0),
  ex(S.w1d1.ST,"DB Romanian Deadlift","3","10",null,  "60 sec","#lower#",1),
  ex(S.w1d1.A,"DB Step Up",                "3","10+10",null,"60 sec","basso · 1 DB",0),
  ex(S.w1d1.A,"Cable Pull Through",        "3","12",   null,"60 sec",null,1),
  ex(S.w1d1.A,"Standing Abduction Elastico","2","15+15",null,null,null,2),
  ex(S.w1d1.C,"Pallof Hold",   "3","20''",null,null,null,0),
  ex(S.w1d1.C,"Bird Dog Dinamico","2","8+8",null,null,"con elastico",1),
  ...pelvisD1(S.w1d1.C, 2, false),
  ex(S.w1d1.WK,"Assault Bike",null,"40''",null,null,"#fortime# 3 rounds · 40'' lavoro",0),
  ex(S.w1d1.WK,"KB Deadlift", null,"10","12 KB",null,"#fortime# 3 rounds",1),
  ex(S.w1d1.WK,"Landmine Squat",null,"8",null,null,"#fortime# 3 rounds",2),
  ex(S.w1d1.WK,"Skill Mill Salita",null,"1 min",null,null,"#fortime# 3 rounds",3),

  // ══ W1D2 – Upper Body + Postura ════════════════════════════
  ...wuD2(S.w1d2.W,"SkiErg","3",false,false,15),
  ex(S.w1d2.ST,"Floor Press Manubri","4","8","RPE 6","90 sec","#upper# posizione glute bridge",0),
  ex(S.w1d2.ST,"Chest Supported Row","4","10",null, "90 sec","#upper#",1),
  ex(S.w1d2.A,"Half Kneeling Landmine Press","3","8+8",null,"90 sec","mezzo inginocchio",0),
  ex(S.w1d2.A,"Lat Machine Presa Neutra",   "3","10", null,"90 sec",null,1),
  ex(S.w1d2.A,"DB Rear Delt Raise",         "2","15", null,"90 sec",null,2),
  ex(S.w1d2.C,"Side Plank",     "3","20''",null,null,null,0),
  ex(S.w1d2.C,"Dead Bug Dinamico","3","8+8",null,null,null,1),
  ...pelvisD2(S.w1d2.C, 2, false),
  ex(S.w1d2.WK,"SkiErg Calories",null,"8",null,null,"#amrap# o Assault Bike Calories · 30'' recupero camminando",0),
  ex(S.w1d2.WK,"DB Push Press",  null,"12",null,null,"#amrap# leggere",1),
  ex(S.w1d2.WK,"KB Swing",       null,"12",null,null,"#amrap#",2),

  // ══ W1D3 – Full Body ════════════════════════════════════════
  ...wuD3(S.w1d3.W,"5","10+10","Walking Lunge",false),
  ex(S.w1d3.ST,"Landmine Squat",      "4","8",null,"60 sec","#lower# tecnica",0),
  ex(S.w1d3.ST,"DB Incline Bench Press","4","10",null,"60 sec","#upper# tecnica",1),
  ex(S.w1d3.A,"DB Overhead Lunge","3","8+8","5 DB","90 sec","Reverse Lunge 1 DB overhead",0),
  ex(S.w1d3.A,"Pulley Machine",  "3","12", null,  "90 sec",null,1),
  ex(S.w1d3.A,"Farmer Carry",    "3","30 MT",null,"90 sec",null,2),
  ex(S.w1d3.C,"Pallof Press",    "2","10+10",null,null,"overhead",0),
  ex(S.w1d3.C,"Dead Bug Dinamico","2","8+8",null,null,"su fitball",1),
  ...pelvisD3(S.w1d3.C, 2, "2 min"),
  ex(S.w1d3.WK,"Bike",          null,"40''",null,null,"#amrap# 40''/20'' · 12' · 1' rest fine round",0),
  ex(S.w1d3.WK,"KB Thruster",   null,"40''","10 KB",null,"#amrap# 2 KB · 40''/20''",1),
  ex(S.w1d3.WK,"Landmine Press",null,"40''",null,null,"#amrap# 40''/20''",2),
  ex(S.w1d3.WK,"Step Up",       null,"40''",null,null,"#amrap# alternati · 40''/20''",3),

  // ══ W2D1 – Lower Body + Pelvis ══════════════════════════════
  ...wuD1(S.w2d1.W,"5","12 passi","10+10","Reverse Lunge",90),
  ex(S.w2d1.ST,"Belt Squat",       "5","8","RPE 6.5","75 sec","#lower#",0),
  ex(S.w2d1.ST,"DB Split Stance RDL","4","10+10",null,"60 sec","#lower#",1),
  ex(S.w2d1.A,"Leg extention",             "3","10",null,"60 sec",null,0),
  ex(S.w2d1.A,"Cable Pull Through",        "3","12",null,"60 sec",null,1),
  ex(S.w2d1.A,"Standing Abduction Elastico","2","15+15",null,null,null,2),
  ex(S.w2d1.C,"Pallof Hold",    "3","20''",null,null,null,0),
  ex(S.w2d1.C,"Bird Dog Dinamico","2","8+8",null,null,"con elastico",1),
  ...pelvisD1(S.w2d1.C, 2, true),

  ex(S.w2d1.WK,"Step Up",             null,"40''",null,null,"#fortime# alternati · 3 rounds",0),
  ex(S.w2d1.WK,"KB Sumo DL High Pull",null,"10","12 KB",null,"#fortime# 3 rounds",1),
  ex(S.w2d1.WK,"Landmine Thruster",   null,"8", null,null,"#fortime# 3 rounds",2),
  ex(S.w2d1.WK,"Bike",                null,"30''",null,null,"#fortime# 30'' easy recupero",3),

  // ══ W2D2 – Upper Body + Postura ════════════════════════════
  ...wuD2(S.w2d2.W,"SkiErg","3",true,true,15),
  ex(S.w2d2.ST,"Bench Press",       "5","8","RPE 6.5","90 sec","#upper# manubri o bilanciere",0),
  ex(S.w2d2.ST,"Chest Supported Row","4","10",null,   "90 sec","#upper#",1),
  ex(S.w2d2.A,"Half Kneeling DB Press","3","8+8",null,"90 sec","mezzo inginocchio",0),
  ex(S.w2d2.A,"Lat Machine Presa Triangolo","3","10",null,"90 sec",null,1),
  ex(S.w2d2.A,"DB Rear Delt Raise","2","15",null,"90 sec",null,2),
  ex(S.w2d2.C,"Side Plank",    "3","20''",null,null,null,0),
  ex(S.w2d2.C,"Leg Raise",     "2","8+8", null,null,"alternato",1),
  ...pelvisD2(S.w2d2.C, 2, false),
  ex(S.w2d2.WK,"DB Walking Lunges",null,"20",null,null,"#amrap#",0),
  ex(S.w2d2.WK,"DB Snatch",        null,"15",null,null,"#amrap# hang",1),
  ex(S.w2d2.WK,"DB Z Press",       null,"10",null,null,"#amrap#",2),

  // ══ W2D3 – Full Body ════════════════════════════════════════
  ...wuD3(S.w2d3.W,"5","10+10",null,true),
  ex(S.w2d3.ST,"Front Squat",         "5","8","RPE 7","90 sec","#lower#",0),
  ex(S.w2d3.ST,"DB Incline Bench Press","3","10",null,"90 sec","#upper#",1),
  ex(S.w2d3.A,"DB Reverse Lunge","3","8+8",null,"60 sec",null,0),
  ex(S.w2d3.A,"Pulley Machine",  "3","12", null,"60 sec",null,1),
  ex(S.w2d3.A,"KB Suitcase Carry","4","30 MT","16 KB","60 sec",null,2),
  ex(S.w2d3.C,"Pallof Press",    "2","10+10",null,null,null,0),
  ex(S.w2d3.C,"Dead Bug Dinamico","2","8",   null,null,"su fitball",1),
  ...pelvisD3(S.w2d3.C, 2, "2 min"),
  ex(S.w2d3.WK,"Bike",           null,"40''",null,null,"#amrap# 40''/20'' · 3 sets · 1' rest fine round",0),
  ex(S.w2d3.WK,"Push Up",        null,"40''",null,null,"#amrap# 40''/20''",1),
  ex(S.w2d3.WK,"DB Shoulder Press",null,"40''",null,null,"#amrap# 40''/20''",2),
  ex(S.w2d3.WK,"KB Goblet Squat",null,"40''",null,null,"#amrap# 40''/20''",3),

  // ══ W3D1 – Lower Body + Pelvis (RPE max 7) ══════════════════
  ...wuD1(S.w3d1.W,"5","12 passi","10+10","Reverse Lunge",90),
  ex(S.w3d1.ST,"Belt Squat",         "5","6","RPE 7","90 sec","#lower#",0),
  ex(S.w3d1.ST,"DB Romanian Deadlift","4","8",null,  "60 sec","#lower#",1),
  ex(S.w3d1.A,"Step Down",                 "3","10+10",null,"90 sec","1 DB",0),
  ex(S.w3d1.A,"Cable Pull Through",        "3","12",  null,"90 sec",null,1),
  ex(S.w3d1.A,"Standing Abduction Elastico","2","15+15",null,null,null,2),
  ex(S.w3d1.C,"Pallof Hold",    "3","20''",null,null,null,0),
  ex(S.w3d1.C,"Bird Dog Dinamico","2","8+8",null,null,"controllato",1),
  ...pelvisD1(S.w3d1.C, 2, true),
  ex(S.w3d1.WK,"Wall Ball",     null,"12","4",null,"#fortime# 3 rounds",0),
  ex(S.w3d1.WK,"Ring Row",      null,"10",null,null,"#fortime# 3 rounds",1),
  ex(S.w3d1.WK,"DB Push Press", null,"10",null,null,"#fortime# 3 rounds",2),
  ex(S.w3d1.WK,"Skill Mill Salita",null,"1 min",null,null,"#fortime# 3 rounds",3),

  // ══ W3D2 – Upper Body + Postura ════════════════════════════
  ...wuD2(S.w3d2.W,"Bike","5",true,true,15),
  ex(S.w3d2.ST,"Strict Press Bilanciere","5","6","RPE 7","90 sec","#upper# alternativa DB",0),
  ex(S.w3d2.ST,"Chest Supported Row",   "4","8",null,  "90 sec","#upper#",1),
  ex(S.w3d2.A,"Half Kneeling Landmine Press","3","8+8",null,"90 sec","mezzo inginocchio",0),
  ex(S.w3d2.A,"Lat Machine Presa Inversa",  "3","10", null,"90 sec",null,1),
  ex(S.w3d2.A,"DB Rear Delt Raise",         "2","15", null,"90 sec",null,2),
  ex(S.w3d2.C,"Side Plank",      "3","20''",null,null,null,0),
  ex(S.w3d2.C,"Dead Bug Dinamico","3","8+8",null,null,"su fitball",1),
  ...pelvisD2(S.w3d2.C, 2, true),
  ex(S.w3d2.WK,"Assault Bike Calories",null,"8",null,null,"#amrap#",0),
  ex(S.w3d2.WK,"DB Clean and Jerk",    null,"10",null,null,"#amrap# easy",1),
  ex(S.w3d2.WK,"KB Row",               null,"10",null,null,"#amrap# per lato",2),
  ex(S.w3d2.WK,"Push Up Inclinato",    null,"10",null,null,"#amrap# su panca",3),

  // ══ W3D3 – Full Body Flow ════════════════════════════════════
  ...wuD3(S.w3d3.W,"5","10+10","Affondo Dinamico",false),
  ex(S.w3d3.ST,"Landmine Squat",      "5","6","RPE 7","75 sec","#lower# tecnica",0),
  ex(S.w3d3.ST,"DB Incline Bench Press","4","8",null, "75 sec","#upper#",1),
  ex(S.w3d3.A,"DB Reverse Lunge","3","8+8",null,"75 sec",null,0),
  ex(S.w3d3.A,"Pulley Machine",  "3","12", null,"75 sec","basso",1),
  ex(S.w3d3.A,"Farmer Carry",    "3","30 MT",null,"75 sec","leggero",2),
  ex(S.w3d3.C,"Pallof Press",    "2","10+10",null,null,null,0),
  ex(S.w3d3.C,"Dead Bug Dinamico","2","8",  null,null,"su fitball",1),
  ...pelvisD3(S.w3d3.C, 2, "1 min"),
  ex(S.w3d3.WK,"Bike",          null,"40''",null,null,"#amrap# 40''/20'' · 14'",0),
  ex(S.w3d3.WK,"KB Swing",      null,"40''",null,null,"#amrap# leggero · 40''/20''",1),
  ex(S.w3d3.WK,"DB Z Press",    null,"40''",null,null,"#amrap# 40''/20''",2),
  ex(S.w3d3.WK,"KB Goblet Squat",null,"40''",null,null,"#amrap# 40''/20''",3),
  ex(S.w3d3.WK,"SkiErg",        null,"40''",null,null,"#amrap# 40''/20''",4),

  // ══ W4D1 – Lower Body Scarico ═══════════════════════════════
  ...wuD1(S.w4d1.W,"5","10 passi","8+8",null,90),
  ex(S.w4d1.ST,"Belt Squat",       "3","8","RPE 5","75 sec","#lower#",0),
  ex(S.w4d1.ST,"Cable Pull Through","2","12",null, "60 sec","#lower#",1),
  ex(S.w4d1.A,"Step Up",                   "3","8+8",null,"75 sec","basso controllato",0),
  ex(S.w4d1.A,"Standing Abduction Elastico","3","12+12",null,"75 sec",null,1),
  ex(S.w4d1.A,"Leg Curl Fitball",          "3","12",   null,"75 sec",null,2),
  ex(S.w4d1.C,"Pallof Hold",    "2","20''",null,null,null,0),
  ex(S.w4d1.C,"Bird Dog Dinamico","2","6+6",null,null,"controllato",1),
  ...pelvisD1(S.w4d1.C, 2, false),
  ex(S.w4d1.WK,"Bike",null,"12 min",null,null,"#cardioliss# o Skill Mill alternanza",0),

  // ══ W4D2 – Upper Body Scarico ═══════════════════════════════
  ...wuD2(S.w4d2.W,"SkiErg","3",true,false,12),
  ex(S.w4d2.ST,"Floor Press Manubri","3","8","RPE 5","75 sec","#upper#",0),
  ex(S.w4d2.ST,"Lat Machine Presa Neutra","2","10",null,"75 sec","#upper#",1),
  ex(S.w4d2.ST,"Push down (TRICEPS)",    "2","10",null,"75 sec","#upper#",2),
  ex(S.w4d2.A,"Landmine Press",  "2","8+8",null,"60 sec",null,0),
  ex(S.w4d2.A,"DB Rear Delt Raise","2","12",null,"60 sec",null,1),
  ex(S.w4d2.C,"Side Plank",     "2","20''",null,null,null,0),
  ex(S.w4d2.C,"Dead Bug Dinamico","2","6+6",null,null,"con fitball",1),
  ...pelvisD2(S.w4d2.C, 2, false),
  ex(S.w4d2.WK,"Assault Bike Calories",null,"8",null,null,"#amrap#",0),
  ex(S.w4d2.WK,"Burpee Box Step Up",   null,"8",null,null,"#amrap# scalati",1),
  ex(S.w4d2.WK,"Push Up Inclinato",    null,"16",null,null,"#amrap# al box",2),

  // ══ W4D3 – Full Body Scarico ═════════════════════════════════
  ...wuD3(S.w4d3.W,"5","8+8","Affondo Dinamico",false),
  ex(S.w4d3.ST,"Landmine Squat",      "3","8","RPE 6","75 sec","#lower# tecnica",0),
  ex(S.w4d3.ST,"DB Incline Bench Press","2","10",null,"75 sec","#upper#",1),
  ex(S.w4d3.A,"Barbell Row",  "3","12",null,"75 sec","presa inversa underhand",0),
  ex(S.w4d3.A,"Farmer Carry", "3","20 MT",null,"75 sec","leggero",1),
  ex(S.w4d3.C,"Pallof Press", "2","8+8",null,null,null,0),
  ex(S.w4d3.C,"Dead Bug Dinamico","2","6",null,null,"su fitball",1),
  ...pelvisD3(S.w4d3.C, 2, "2 min"),
  ex(S.w4d3.WK,"Skill Mill Walk",null,"3 min",null,null,"#amrap# leggermente inclinata · respirazione controllata, ritmo fluido",0),
  ex(S.w4d3.WK,"Air Squat",    null,"15",  null,null,"#amrap#",1),
  ex(S.w4d3.WK,"DB Push Press",null,"15",  null,null,"#amrap# leggeri",2),
  ex(S.w4d3.WK,"Ring Row",     null,"10",  null,null,"#amrap#",3),
];

const { error } = await supabase.from("exercises").insert(rows);
if (error) console.error("❌ ERRORE:", error.message);
else console.log(`✅ Ketty Pertegato giugno inserito! (${rows.length} esercizi su 12 giorni)`);
