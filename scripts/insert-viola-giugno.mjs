import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://wltgyvkgevrrgznxtkxc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs"
);

const MONTH_ID = "5411d790-dac8-49cb-8e48-f31ec3d6bf0a";

// ── Note mese ───────────────────────────────────────────────────
const notesMese = "Questo mese sarà dedicato ad una fase di consolidamento della forza, con l'obiettivo di mantenere e stabilizzare il lavoro costruito negli ultimi mesi senza accumulare eccessiva fatica. I fondamentali principali (Squat, Press, Bench Press e Deadlift) resteranno il focus centrale delle sedute, lavorando con intensità moderate e attenzione alla qualità tecnica, velocità e solidità del movimento. Accanto al lavoro forza verranno inseriti circuiti accessori mirati, più fluidi e dinamici, pensati per migliorare stabilità, controllo, tono muscolare e capacità di lavoro generale senza interferire con il recupero. Questa fase servirà come ponte di preparazione verso il periodo di luglio/agosto, dove inizieremo un lavoro più impegnativo e specifico orientato ai massimali dei fondamentali.";
await supabase.from("training_months").update({ notes: notesMese }).eq("id", MONTH_ID);
console.log("✅ Note mese inserite");

// ── Libreria ────────────────────────────────────────────────────
const { error: libErr } = await supabase.from("exercise_library").insert([
  { name:"KB Pass Through da Quadrupedia", category:"CORE TRAINING", subcategory:"NON ISOMETRICI", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:false,load_kg:false,default_load:null,equip_barbell:false,equip_db:false,equip_kb:true,equip_mb:false,equip_sb:false,default_equip:"kb" },
  { name:"Quadrupedia in Camminata", category:"CORE TRAINING", subcategory:"NON ISOMETRICI", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:false,load_kg:false,default_load:null,equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
  { name:"Scorpion Stretch", category:"WARMUP", subcategory:"MOBILITÀ", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:false,load_kg:false,default_load:null,equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
  { name:"Reverse Plank", category:"CORE TRAINING", subcategory:"ISOMETRICI", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:false,load_kg:false,default_load:null,equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
  { name:"Crunch su Fitball", category:"CORE TRAINING", subcategory:"NON ISOMETRICI", unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",load_pct:false,load_rpe:false,load_kg:false,default_load:null,equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
]);
if (libErr) console.error("❌ Libreria:", libErr.message);
else console.log("✅ 5 esercizi aggiunti in libreria");

// ── Setup sezioni ───────────────────────────────────────────────
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

// Workout sections
await supabase.from("workout_sections").update({ section_subtype:"emom",  cap_time:"8"  }).eq("id", S.w1d3.WK);
await supabase.from("workout_sections").update({ section_subtype:"amrap", cap_time:"8"  }).eq("id", S.w2d3.WK);
await supabase.from("workout_sections").update({ section_subtype:"emom",  cap_time:"10" }).eq("id", S.w3d3.WK);
await supabase.from("workout_sections").update({ section_subtype:"amrap", cap_time:"6"  }).eq("id", S.w4d3.WK);
console.log("✅ Sezioni configurate");

const rows = [

  // ══ W1D1 – Lower Body ════════════════════════════════════════
  ex(S.w1d1.W,"Bike",null,"5 min",null,null,"#cardio#",0),
  ex(S.w1d1.W,"Cat Cow","2","8",null,null,"#mob# 2 giri",1),
  ex(S.w1d1.W,"Glute bridge","2","12",null,null,"#att# 2 giri",2),
  ex(S.w1d1.W,"KB Goblet Squat","2","8",null,null,"#mob# 2 giri",3),
  ex(S.w1d1.W,"Hip Opener","2","6+6",null,null,"#mob# 2 giri",4),
  ex(S.w1d1.W,"Band Pull Apart","2","12",null,null,"#att# 2 giri",5),
  ex(S.w1d1.ST,"Back Squat","4","5","75%","90 sec","#lower#",0),
  ex(S.w1d1.A,"Deficit reverse lunges","4","8+8","7.5 DB","75 sec","Circuito 4 giri",0),
  ex(S.w1d1.A,"Leg Curl Fitball",      "4","12",  null,  "75 sec","Circuito 4 giri · hamstring curl",1),
  ex(S.w1d1.A,"Farmer Carry",          "4","30 MT","16-20 KB","75 sec","Circuito 4 giri",2),
  ex(S.w1d1.C,"Dead Bug Dinamico",           "3","10+10",null,null,"3 giri",0),
  ex(S.w1d1.C,"KB Pass Through da Quadrupedia","3","10+10",null,null,"3 giri",1),
  ex(S.w1d1.C,"Plank",                       "3","30''", null,null,"3 giri",2),
  ex(S.w1d1.C,"V Up",                        "3","10",   null,null,"3 giri",3),
  ex(S.w1d1.C,"Skill Mill Walk",null,"6 min",null,null,"Finisher — pendenza media",4),

  // ══ W1D2 – Upper Body ════════════════════════════════════════
  ex(S.w1d2.W,"Rower",null,"5 min",null,null,"#cardio#",0),
  ex(S.w1d2.W,"Band Pull Apart","2","15",null,null,"#att# 2 giri",1),
  ex(S.w1d2.W,"Push Up","2","8",null,null,"#att# 2 giri",2),
  ex(S.w1d2.W,"Scapular Pull Up","2","8",null,null,"#mob# 2 giri",3),
  ex(S.w1d2.W,"Shoulder CARs",null,"6",null,null,"#mob# disco 5 kg · 2 giri",4),
  ex(S.w1d2.ST,"Bench Press","4","5","75%","90 sec","#upper#",0),
  ex(S.w1d2.A,"Pendlay Row",   "3","8", "RPE 7","60 sec","Circuito 3 giri",0),
  ex(S.w1d2.A,"Filly Press",   "3","10",null,   "60 sec","Circuito 3 giri",1),
  ex(S.w1d2.A,"DB Lateral Raise","3","12",null, "60 sec","Circuito 3 giri · alzate laterali",2),
  ex(S.w1d2.C,"Hanging Knee Raise","3","16",null,null,"3 giri",0),
  ex(S.w1d2.C,"Russian Twist",    "3","16",null,null,"3 giri",1),
  ex(S.w1d2.C,"Side Plank",       "3","25''/lato",null,null,"3 giri",2),
  ex(S.w1d2.C,"Assault Bike",null,"6 min",null,null,"Finisher — easy",3),

  // ══ W1D3 – Full Body ══════════════════════════════════════════
  ex(S.w1d3.W,"Bike",null,"6 min",null,null,"#cardio#",0),
  ex(S.w1d3.W,"Cat Cow",null,"8",null,null,"#mob#",1),
  ex(S.w1d3.W,"Glute bridge",null,"12",null,null,"#att#",2),
  ex(S.w1d3.W,"Cossack Squat",null,"12",null,null,"#mob#",3),
  ex(S.w1d3.W,"Affondo Dinamico","2","6+6",null,null,"#mob# 2 giri",4),
  ex(S.w1d3.W,"Air Squat","2","10",null,null,"#mob# 2 giri",5),
  ex(S.w1d3.W,"Band Pull Apart","2","12",null,null,"#att# 2 giri",6),
  ex(S.w1d3.W,"KB Deadlift","2","10",null,null,"#mob# leggero · 2 giri",7),
  ex(S.w1d3.ST,"Deadlift","4","4","75-77%","90 sec","#lower#",0),
  ex(S.w1d3.A,"DB Bulgarian Split Squat","3","8+8","RPE 8","75 sec","Circuito 3 giri",0),
  ex(S.w1d3.A,"Barbell Inverted Row",  "3","10",  null,  "75 sec","Circuito 3 giri · inverted barbell row",1),
  ex(S.w1d3.A,"Cable Pull Through",    "3","12",  null,  "75 sec","Circuito 3 giri · partenza 7.5 kg/lato",2),
  ex(S.w1d3.C,"Plank",             "3","60''",null,null,"3 giri — 1 minuto",0),
  ex(S.w1d3.C,"Sit Up",            "3","12",  null,null,"3 giri",1),
  ex(S.w1d3.C,"Hanging Leg Raise", "3","12",  null,null,"3 giri · alle parallele",2),
  ex(S.w1d3.C,"L Sit Hold",        "3","15''",null,null,"3 giri",3),
  ex(S.w1d3.WK,"Rower Calories",null,"10","",null,"#emom# Min 1",0),
  ex(S.w1d3.WK,"KB Swing",      null,"10","20 KB",null,"#emom# Min 2",1),

  // ══ W2D1 – Lower Body ════════════════════════════════════════
  ex(S.w2d1.W,"Bike",null,"5 min",null,null,"#cardio#",0),
  ex(S.w2d1.W,"Glute bridge","2","12",null,null,"#att# 2 giri",1),
  ex(S.w2d1.W,"Hip Opener","2","6+6",null,null,"#mob# 2 giri",2),
  ex(S.w2d1.W,"KB Goblet Squat","2","8",null,null,"#mob# 2 giri",3),
  ex(S.w2d1.W,"Cossack Squat","2","6+6",null,null,"#mob# 2 giri",4),
  ex(S.w2d1.ST,"Front Squat","5","4","77-80%","90 sec","#lower#",0),
  ex(S.w2d1.A,"Affondo DB Overhead",  "3","8+8","7.5 DB","75 sec","Circuito 3 giri",0),
  ex(S.w2d1.A,"DB Romanian Deadlift", "3","8",  "15 DB","75 sec","Circuito 3 giri",1),
  ex(S.w2d1.A,"Leg curl disteso",     "3","12", null,   "75 sec","Circuito 3 giri",2),
  ex(S.w2d1.C,"Farmer Carry","3","40 MT",null,null,"3 giri",0),
  ex(S.w2d1.C,"Prono Plank", "3","60''",null,null,"3 giri — 1 minuto",1),
  ex(S.w2d1.C,"Knee To Chest","3","20",null,null,"3 giri",2),
  ex(S.w2d1.C,"Skill Mill Walk",null,"7 min",null,null,"Finisher — camminata",3),

  // ══ W2D2 – Upper Body ════════════════════════════════════════
  ex(S.w2d2.W,"Rower",null,"5 min",null,null,"#cardio#",0),
  ex(S.w2d2.W,"Band Pull Apart","2","15",null,null,"#att# 2 giri",1),
  ex(S.w2d2.W,"Push Up","2","8",null,null,"#att# 2 giri",2),
  ex(S.w2d2.W,"Shoulder CARs","2","6",null,null,"#mob# 2 giri",3),
  ex(S.w2d2.W,"Wall Slide","2","10",null,null,"#mob# 2 giri",4),
  ex(S.w2d2.W,"Hollow Rock",null,"30''",null,null,"#mob#",5),
  ex(S.w2d2.ST,"Strict Press Bilanciere","5","4","RPE 7.5","90 sec","#upper#",0),
  ex(S.w2d2.A,"Chest Supported Row","3","10",null,"60 sec","Circuito 3 giri · su panca inclinata",0),
  ex(S.w2d2.A,"Floor Press Manubri", "3","10",null,"60 sec","Circuito 3 giri · DB floor press",1),
  ex(S.w2d2.A,"DB Lateral Raise",    "3","10",null,"60 sec","Circuito 3 giri · alzate laterali",2),
  ex(S.w2d2.A,"DB Front Raise",      "3","10",null,"60 sec","Circuito 3 giri · alzate frontali",3),
  ex(S.w2d2.C,"Hollow Hold",    "3","25''",null,null,"3 giri",0),
  ex(S.w2d2.C,"Russian Twist",  "3","16",  null,null,"3 giri",1),
  ex(S.w2d2.C,"Dead Bug Dinamico","3","10+10",null,null,"3 giri",2),
  ex(S.w2d2.C,"Skill Mill Walk",null,"8 min",null,null,"Finisher — camminata inclinata 6' + 2' easy",3),

  // ══ W2D3 – Full Body ══════════════════════════════════════════
  ex(S.w2d3.W,"Rower",null,"2 min",null,null,"#cardio#",0),
  ex(S.w2d3.W,"SkiErg",null,"2 min",null,null,"#cardio#",1),
  ex(S.w2d3.W,"Glute bridge",null,"12",null,null,"#att#",2),
  ex(S.w2d3.W,"Hip Opener",null,"6+6",null,null,"#mob#",3),
  ex(S.w2d3.W,"KB Goblet Squat",null,"8",null,null,"#mob#",4),
  ex(S.w2d3.W,"Cossack Squat",null,"6+6",null,null,"#mob#",5),
  ex(S.w2d3.W,"KB Deadlift","2","10",null,null,"#mob# 2 giri",6),
  ex(S.w2d3.W,"Air Squat","2","10",null,null,"#mob# 2 giri",7),
  ex(S.w2d3.W,"Band Pull Apart","2","12",null,null,"#att# 2 giri",8),
  ex(S.w2d3.W,"Affondo Dinamico","2","6+6",null,null,"#mob# 2 giri",9),
  ex(S.w2d3.ST,"Sumo Deadlift","4","4","77-80%","90 sec","#lower#",0),
  ex(S.w2d3.A,"Belt Squat",           "3","10","24 KB","75 sec","Circuito 3 giri",0),
  ex(S.w2d3.A,"Pull Up Assistito Elastico","3","6-8",null,"75 sec","Circuito 3 giri",1),
  ex(S.w2d3.A,"Hip Thrust a Corpo Libero","3","10", null,"75 sec","Circuito 3 giri",2),
  ex(S.w2d3.C,"Side Plank",       "3","30''",    null,null,"3 giri — dx e sx",0),
  ex(S.w2d3.C,"Hanging Knee Raise","3","10",     null,null,"3 giri",1),
  ex(S.w2d3.C,"Sit Up",           "3","12",      null,null,"3 giri",2),
  ex(S.w2d3.WK,"Step Up",           null,"8",null,null,"#amrap#",0),
  ex(S.w2d3.WK,"KB American Swing", null,"10","12 KB",null,"#amrap#",1),
  ex(S.w2d3.WK,"Push Up",           null,"8",null,null,"#amrap#",2),

  // ══ W3D1 – Lower Body ════════════════════════════════════════
  ex(S.w3d1.W,"Bike",null,"5 min",null,null,"#cardio#",0),
  ex(S.w3d1.W,"Glute bridge","2","12",null,null,"#att# 2 giri",1),
  ex(S.w3d1.W,"KB Goblet Squat","2","8",null,null,"#mob# 2 giri",2),
  ex(S.w3d1.W,"Hip CARs","2","10+10",null,null,"#mob# 2 giri",3),
  ex(S.w3d1.W,"Affondo Dinamico","2","6+6",null,null,"#mob# 2 giri",4),
  ex(S.w3d1.ST,"Back Squat","5","3","80-82%","90 sec","#lower#",0),
  ex(S.w3d1.A,"DB Bulgarian Split Squat","3","8+8","RPE 9","75 sec","Circuito 3 giri",0),
  ex(S.w3d1.A,"DB Romanian Deadlift",   "3","8",  "RPE 9","75 sec","Circuito 3 giri",1),
  ex(S.w3d1.A,"Cable Pull Through",     "3","12", null,  "75 sec","Circuito 3 giri · +2.5/5 kg rispetto W2",2),
  ex(S.w3d1.C,"Quadrupedia in Camminata","3","40''",null,null,"3 giri",0),
  ex(S.w3d1.C,"Overhead Hold","3","30''+30''",null,null,"3 giri · KB dx/sin",1),
  ex(S.w3d1.C,"Dead Bug Dinamico","3","10+10",null,null,"3 giri",2),
  ex(S.w3d1.C,"Assault Bike",null,"5 min",null,null,"Finisher LISS",3),

  // ══ W3D2 – Upper Body ════════════════════════════════════════
  ex(S.w3d2.W,"Rower",null,"5 min",null,null,"#cardio#",0),
  ex(S.w3d2.W,"Band Pull Apart","2","15",null,null,"#att# 2 giri",1),
  ex(S.w3d2.W,"Push Up","2","8",null,null,"#att# 2 giri",2),
  ex(S.w3d2.W,"Scapular Pull Up","2","8",null,null,"#mob# 2 giri",3),
  ex(S.w3d2.W,"Wall Slide","2","10",null,null,"#mob# 2 giri",4),
  ex(S.w3d2.ST,"Bench Press","5","3","80-82%","90 sec","#upper#",0),
  ex(S.w3d2.A,"Pull Up Assistito Elastico","3","6",null,"60 sec","Circuito 3 giri",0),
  ex(S.w3d2.A,"Half Kneeling DB Press",   "3","10+10",null,"60 sec","Circuito 3 giri",1),
  ex(S.w3d2.A,"DB Lateral Raise",         "3","12",   null,"60 sec","Circuito 3 giri · alzate laterali",2),
  ex(S.w3d2.C,"Hanging Knee Raise","3","20",null,null,"3 giri",0),
  ex(S.w3d2.C,"Russian Twist",    "3","20",null,null,"3 giri",1),
  ex(S.w3d2.C,"Star Plank",       "3","30''/30''",null,null,"3 giri",2),
  ex(S.w3d2.C,"Skill Mill Walk",null,"5 min",null,null,"Finisher — camminata inclinata",3),

  // ══ W3D3 – Full Body ══════════════════════════════════════════
  ex(S.w3d3.W,"SkiErg",null,"3 min",null,null,"#cardio#",0),
  ex(S.w3d3.W,"Bike",null,"3 min",null,null,"#cardio#",1),
  ex(S.w3d3.W,"KB Swing","2","10",null,null,"#att# leggero · 2 giri",2),
  ex(S.w3d3.W,"Air Squat","2","10",null,null,"#mob# 2 giri",3),
  ex(S.w3d3.W,"Band Pull Apart","2","12",null,null,"#att# 2 giri",4),
  ex(S.w3d3.W,"Hip Opener","2","6+6",null,null,"#mob# 2 giri",5),
  ex(S.w3d3.W,"Scorpion Stretch","2","6+6",null,null,"#mob# 2 giri",6),
  ex(S.w3d3.ST,"Push Press Bilanciere","5","3","RPE 8","90 sec","#upper#",0),
  ex(S.w3d3.A,"DB Reverse Lunge",  "3","8+8","10 DB","75 sec","Circuito 3 giri · front rack hold",0),
  ex(S.w3d3.A,"Pendlay Row",        "3","8",  "RPE 8","75 sec","Circuito 3 giri",1),
  ex(S.w3d3.A,"Hip Thrust a Corpo Libero","3","10","RPE 8","75 sec","Circuito 3 giri",2),
  ex(S.w3d3.C,"Sit Up",       "3","15",  null,null,"3 giri",0),
  ex(S.w3d3.C,"V Up",         "3","15",  null,null,"3 giri",1),
  ex(S.w3d3.C,"Reverse Plank","3","30''",null,null,"3 giri",2),
  ex(S.w3d3.WK,"Assault Bike Calories",null,"8-10",null,null,"#emom# Min 1",0),
  ex(S.w3d3.WK,"KB Deadlift",          null,"10","16 KB",null,"#emom# Min 2 · Sumo · 2 KB",1),

  // ══ W4D1 – Lower Body Scarico ════════════════════════════════
  ex(S.w4d1.W,"Bike",null,"5 min",null,null,"#cardio#",0),
  ex(S.w4d1.W,"Glute bridge","2","10",null,null,"#att# 2 giri",1),
  ex(S.w4d1.W,"KB Goblet Squat","2","8",null,null,"#mob# 2 giri",2),
  ex(S.w4d1.W,"Hip Opener","2","6+6",null,null,"#mob# 2 giri",3),
  ex(S.w4d1.ST,"DB Reverse Lunge","3","5+5","RPE 7","75 sec","#lower# front rack hold",0),
  ex(S.w4d1.A,"Belt Squat",   "3","12","20 KB","75 sec","Circuito 3 giri",0),
  ex(S.w4d1.A,"Leg Curl Fitball","3","12",null,"75 sec","Circuito 3 giri · hamstring curl",1),
  ex(S.w4d1.A,"KB Suitcase Carry","3","30 MT/lato","20 KB","75 sec","Circuito 3 giri",2),
  ex(S.w4d1.C,"Leg Raise",      "2","20",  null,null,"2 giri",0),
  ex(S.w4d1.C,"Crunch su Fitball","2","15",null,null,"2 giri",1),
  ex(S.w4d1.C,"Stir The Pot",   "2","10+10",null,null,"2 giri",2),
  ex(S.w4d1.C,"Bike",null,"8 min",null,null,"Finisher LISS — o Skill Mill",3),

  // ══ W4D2 – Upper Body Scarico ════════════════════════════════
  ex(S.w4d2.W,"Rower",null,"5 min",null,null,"#cardio#",0),
  ex(S.w4d2.W,"Band Pull Apart","2","12",null,null,"#att# 2 giri",1),
  ex(S.w4d2.W,"Push Up","2","8",null,null,"#att# 2 giri",2),
  ex(S.w4d2.W,"Shoulder CARs","2","6",null,null,"#mob# 2 giri",3),
  ex(S.w4d2.ST,"Strict Press Bilanciere","3","5","RPE 6","75 sec","#upper#",0),
  ex(S.w4d2.A,"Lat Machine",   "3","10","RPE 8","60 sec","Circuito 3 giri",0),
  ex(S.w4d2.A,"Filly Press",   "3","10","RPE 7","60 sec","Circuito 3 giri",1),
  ex(S.w4d2.A,"DB Lateral Raise","3","12",null, "60 sec","Circuito 3 giri · alzate laterali",2),
  ex(S.w4d2.C,"Russian Twist",    "3","16","12 KB",null,"3 giri",0),
  ex(S.w4d2.C,"Side Plank con Reach","3","25''+25''",null,null,"3 giri",1),
  ex(S.w4d2.C,"Hollow Hold",      "3","20''",null,null,"3 giri",2),
  ex(S.w4d2.C,"Skill Mill Walk",null,"8 min",null,null,"Finisher — camminata inclinata",3),

  // ══ W4D3 – Full Body Scarico ══════════════════════════════════
  ex(S.w4d3.W,"Bike",null,"6 min",null,null,"#cardio#",0),
  ex(S.w4d3.W,"Glute bridge",null,"10",null,null,"#att#",1),
  ex(S.w4d3.W,"KB Goblet Squat",null,"8",null,null,"#mob#",2),
  ex(S.w4d3.W,"Hip Opener",null,"6+6",null,null,"#mob#",3),
  ex(S.w4d3.W,"Air Squat","2","15",null,null,"#mob# 2 giri",4),
  ex(S.w4d3.W,"KB Deadlift","2","12",null,null,"#mob# 2 giri",5),
  ex(S.w4d3.W,"Band Pull Apart","2","20",null,null,"#att# 2 giri",6),
  ex(S.w4d3.ST,"Deadlift","3","4","65-70%","90 sec","#lower#",0),
  ex(S.w4d3.A,"Deficit reverse lunges","3","8+8",null,"75 sec","Circuito 3 giri · 2 DB leggeri",0),
  ex(S.w4d3.A,"Barbell Inverted Row",  "3","10", null,"75 sec","Circuito 3 giri · inverted barbell row",1),
  ex(S.w4d3.A,"Cable Pull Through",    "3","12", null,"75 sec","Circuito 3 giri · easy",2),
  ex(S.w4d3.C,"Sit Up",       "3","12",  null,null,"3 giri",0),
  ex(S.w4d3.C,"Prono Plank",  "3","60''",null,null,"3 giri — 1 minuto",1),
  ex(S.w4d3.C,"Hollow Hold",  "3","20''",null,null,"3 giri",2),
  ex(S.w4d3.WK,"Step Up",   null,"8",null,null,"#amrap#",0),
  ex(S.w4d3.WK,"DB Snatch", null,"8","7.5 DB",null,"#amrap#",1),
  ex(S.w4d3.WK,"Burpee",    null,"8",null,null,"#amrap#",2),
];

const { error } = await supabase.from("exercises").insert(rows);
if (error) console.error("❌ ERRORE:", error.message);
else console.log(`✅ Viola Vanni giugno inserito! (${rows.length} esercizi su 12 giorni)`);
