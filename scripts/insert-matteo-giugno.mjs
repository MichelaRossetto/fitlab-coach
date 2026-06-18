import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://wltgyvkgevrrgznxtkxc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs"
);

const MONTH_ID = "f142e602-8244-47ec-b630-99687df8107a";
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

// ── Warmup base A ────────────────────────────────────────────────
const wuAbase = (sid, e1, e2, e3) => [
  ex(sid,"Bike",null,"3 min",null,null,"#cardio#",0),
  ex(sid,"Hip Opener",null,"10+10",null,null,"#mob#",1),
  ex(sid,"Squat to Stand",null,"10",null,null,"#mob#",2),
  ex(sid,"Band Pull Apart",null,"15",null,null,"#att#",3),
  ex(sid,"Glute bridge",null,"12",null,null,"#att#",4),
  // EMOM 6' come conditioning warmup
  ex(sid,"Wall Ball",null,e1,null,null,"#att# EMOM 6' — Min 1",5),
  ex(sid,"KB Swing",null,"10",null,null,"#att# EMOM 6' — Min 2",6),
  ex(sid,"Box Step Up",null,e3,null,null,"#att# EMOM 6' — Min 3",7),
];

// ── Warmup base B ────────────────────────────────────────────────
const wuBbase = (sid, e1, e2, e3) => [
  ex(sid,"Rower",null,"3 min",null,null,"#cardio#",0),
  ex(sid,"Cat Cow",null,"10",null,null,"#mob#",1),
  ex(sid,"Hip Hinge con Bastone",null,"10",null,null,"#mob#",2),
  ex(sid,"Monster Walk",null,"10+10",null,null,"#att#",3),
  ex(sid,"Scapular Pull Up",null,"10",null,null,"#mob#",4),
  // EMOM 6'
  ex(sid,"Assault Bike Calories",null,e1,null,null,"#att# EMOM 6' — Min 1",5),
  ex(sid,"Slam Ball Over Shoulder",null,e2,null,null,"#att# EMOM 6' — Min 2",6),
  ex(sid,"Push Up",null,e3,null,null,"#att# EMOM 6' — Min 3",7),
];

// ── Forza A: Top Set + Back Off (W1-W3) ─────────────────────────
const forzaA_topback = (sid, rpe, reps, backSets, rest) => [
  ex(sid,"Back Squat","1",reps,`RPE ${rpe}`,`${rest} sec`,"#lower# Top Set",0),
  ex(sid,"Back Squat",`${backSets}`,reps,"-10%",`${rest} sec`,"#lower# Back Off",1),
];

// ── Forza B: Top Set + Back Off (W1-W3) ─────────────────────────
const forzaB_topback = (sid, rpe, reps, backSets, rest) => [
  ex(sid,"Deadlift","1",reps,`RPE ${rpe}`,`${rest} sec`,"#lower# Top Set",0),
  ex(sid,"Deadlift",`${backSets}`,reps,"-10%",`${rest} sec`,"#lower# Back Off",1),
];

const rows = [

  // ══ WEEK 1 ══════════════════════════════════════════════════
  // W1 Day A
  ...wuAbase(S.w1d1.W,"8","10","8"),
  ...forzaA_topback(S.w1d1.ST,"8","5","3",120),
  ex(S.w1d1.A,"Bench Press",          "4","8",  null,"90 sec",null,0),
  ex(S.w1d1.A,"Belt Squat",           "3","12", null,"75 sec",null,1),
  ex(S.w1d1.A,"Pull Up Assistito Elastico","4","6",null,"90 sec",null,2),
  ex(S.w1d1.C,"Dead Bug Dinamico","3","10+10",null,"30 sec",null,0),
  ex(S.w1d1.C,"Side Plank",       "3","30''",  null,"30 sec",null,1),
  ex(S.w1d1.C,"Farmer Carry",     "3","30 MT", null,"45 sec",null,2),

  // W1 Day B
  ...wuBbase(S.w1d2.W,"8","10","8"),
  ...forzaB_topback(S.w1d2.ST,"8","5","3",120),
  ex(S.w1d2.A,"Strict Press Bilanciere","4","8", null,"90 sec",null,0),
  ex(S.w1d2.A,"Chest Supported Row",   "4","10",null,"75 sec",null,1),
  ex(S.w1d2.A,"Walking Lunge",         "3","20 passi",null,"60 sec",null,2),
  ex(S.w1d2.C,"Hanging Knee Raise","3","10",   null,"30 sec",null,0),
  ex(S.w1d2.C,"Russian Twist",    "3","20",    null,"30 sec",null,1),
  ex(S.w1d2.C,"Suitcase Carry",   "3","20 MT/lato",null,"45 sec",null,2),

  // ══ WEEK 2 ══════════════════════════════════════════════════
  // W2 Day A
  ...wuAbase(S.w2d1.W,"10","10","10"),
  ...forzaA_topback(S.w2d1.ST,"8","4","4",120),
  ex(S.w2d1.A,"Bench Press",          "4","8",  null,"90 sec",null,0),
  ex(S.w2d1.A,"Belt Squat",           "4","10", null,"75 sec",null,1),
  ex(S.w2d1.A,"Pull Up Assistito Elastico","4","6",null,"90 sec",null,2),
  ex(S.w2d1.C,"Dead Bug Dinamico","3","12+12",null,"30 sec",null,0),
  ex(S.w2d1.C,"Side Plank",       "3","35''",  null,"30 sec",null,1),
  ex(S.w2d1.C,"Farmer Carry",     "3","35 MT", null,"45 sec",null,2),

  // W2 Day B
  ...wuBbase(S.w2d2.W,"10","10","10"),
  ...forzaB_topback(S.w2d2.ST,"8","4","4",120),
  ex(S.w2d2.A,"Strict Press Bilanciere","4","8", null,"90 sec",null,0),
  ex(S.w2d2.A,"Chest Supported Row",   "4","10",null,"75 sec",null,1),
  ex(S.w2d2.A,"Walking Lunge",         "3","24 passi",null,"60 sec",null,2),
  ex(S.w2d2.C,"Hanging Knee Raise","3","12",   null,"30 sec",null,0),
  ex(S.w2d2.C,"Russian Twist",    "3","24",    null,"30 sec",null,1),
  ex(S.w2d2.C,"Suitcase Carry",   "3","25 MT/lato",null,"45 sec",null,2),

  // ══ WEEK 3 ══════════════════════════════════════════════════
  // W3 Day A
  ...wuAbase(S.w3d1.W,"12","12","10"),
  ...forzaA_topback(S.w3d1.ST,"8.5","3","4",150),
  ex(S.w3d1.A,"Bench Press",          "5","6",  null,"90 sec",null,0),
  ex(S.w3d1.A,"Belt Squat",           "4","10", null,"75 sec",null,1),
  ex(S.w3d1.A,"Pull Up Assistito Elastico","5","5",null,"90 sec",null,2),
  ex(S.w3d1.C,"Dead Bug Dinamico","3","12+12",null,"30 sec",null,0),
  ex(S.w3d1.C,"Side Plank",       "3","40''",  null,"30 sec",null,1),
  ex(S.w3d1.C,"Farmer Carry",     "4","30 MT", null,"45 sec",null,2),

  // W3 Day B
  ...wuBbase(S.w3d2.W,"10","12","10"),
  ...forzaB_topback(S.w3d2.ST,"8.5","3","4",150),
  ex(S.w3d2.A,"Strict Press Bilanciere","5","6", null,"90 sec",null,0),
  ex(S.w3d2.A,"Chest Supported Row",   "4","8", null,"75 sec",null,1),
  ex(S.w3d2.A,"Walking Lunge",         "3","24 passi",null,"60 sec",null,2),
  ex(S.w3d2.C,"Hanging Knee Raise","3","12",   null,"30 sec",null,0),
  ex(S.w3d2.C,"Russian Twist",    "3","24",    null,"30 sec",null,1),
  ex(S.w3d2.C,"Suitcase Carry",   "3","30 MT/lato",null,"45 sec",null,2),

  // ══ WEEK 4 (SCARICO) ════════════════════════════════════════
  // W4 Day A
  ...wuAbase(S.w4d1.W,"8","8","8"),
  ex(S.w4d1.ST,"Back Squat","3","5","65%","90 sec","#lower#",0),
  ex(S.w4d1.A,"Bench Press",          "3","8", null,"75 sec",null,0),
  ex(S.w4d1.A,"Belt Squat",           "2","10",null,"60 sec",null,1),
  ex(S.w4d1.A,"Pull Up Assistito Elastico","3","5",null,"75 sec",null,2),
  ex(S.w4d1.C,"Dead Bug Dinamico","2","10+10",null,"30 sec",null,0),
  ex(S.w4d1.C,"Side Plank",       "2","30''", null,"30 sec",null,1),
  ex(S.w4d1.C,"Farmer Carry",     "2","25 MT",null,"45 sec",null,2),

  // W4 Day B
  ...wuBbase(S.w4d2.W,"8","8","8"),
  ex(S.w4d2.ST,"Deadlift","3","5","65%","90 sec","#lower#",0),
  ex(S.w4d2.A,"Strict Press Bilanciere","3","8", null,"75 sec",null,0),
  ex(S.w4d2.A,"Chest Supported Row",   "3","10",null,"60 sec",null,1),
  ex(S.w4d2.A,"Walking Lunge",         "2","20 passi",null,"60 sec",null,2),
  ex(S.w4d2.C,"Hanging Knee Raise","2","10",   null,"30 sec",null,0),
  ex(S.w4d2.C,"Russian Twist",    "2","20",    null,"30 sec",null,1),
  ex(S.w4d2.C,"Suitcase Carry",   "2","20 MT/lato",null,"45 sec",null,2),
];

const { error } = await supabase.from("exercises").insert(rows);
if (error) console.error("❌ ERRORE:", error.message);
else console.log(`✅ Matteo giugno inserito! (${rows.length} esercizi su 8 giorni)`);
