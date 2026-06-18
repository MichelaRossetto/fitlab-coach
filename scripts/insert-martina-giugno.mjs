import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://wltgyvkgevrrgznxtkxc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs"
);

// ── Libreria ────────────────────────────────────────────────────
const { error: libErr } = await supabase.from("exercise_library").insert([
  { name:"Hip Flexor Stretch", category:"WARMUP", subcategory:"MOBILITÀ",
    unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",
    load_pct:false,load_rpe:false,load_kg:false,default_load:null,
    equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
  { name:"Leg Curl Fitball", category:"ACCESSORI", subcategory:"BODYWEIGHT",
    unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",
    load_pct:false,load_rpe:false,load_kg:false,default_load:null,
    equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
  { name:"Scapular Retraction con Elastico", category:"WARMUP", subcategory:"ATTIVAZIONE",
    unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",
    load_pct:false,load_rpe:false,load_kg:false,default_load:null,
    equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
]);
if (libErr) console.error("❌ Libreria:", libErr.message);
else console.log("✅ 3 esercizi aggiunti in libreria");

// ── Setup ───────────────────────────────────────────────────────
const MONTH_ID = "aa7e364c-708e-4ecd-8a74-6d69e08445a6";
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

// ── Warmup D1 base (Lower Body - uguale W1/W2/W3/W4 salvo cardio) ─
const wuD1 = (sid, cardioMin) => [
  ex(sid,"Bike",null,`${cardioMin} min`,null,null,"#cardio# o Rower/Skill Mill/Assault Bike · RPE 5-6",0),
  ex(sid,"Cat Cow","2","8",null,null,"#mob#",1),
  ex(sid,"90/90 Hip Switch","2","8+8",null,null,"#mob#",2),
  ex(sid,"Open Book","2","8+8",null,null,"#mob#",3),
  ex(sid,"Hip Flexor Stretch","2","8+8",null,null,"#mob# su box",4),
  ex(sid,"Glute bridge","2","12",null,null,"#att#",5),
  ex(sid,"Dead Bug","2","8+8",null,null,"#att# base",6),
  ex(sid,"Band Pull Apart","2","12",null,null,"#att# con elastico",7),
  ex(sid,"Mini Band Lateral Walk","2","10+10",null,null,"#att#",8),
];

// ── Warmup D2 base ───────────────────────────────────────────────
const wuD2 = (sid, cardioMin, withScapular) => {
  const base = [
    ex(sid,"Bike",null,`${cardioMin} min`,null,null,"#cardio# o Rower/Skill Mill/Assault Bike · RPE 5-6",0),
    ex(sid,"Cat Cow","2","8",null,null,"#mob#",1),
    ex(sid,"Open Book","2","8+8",null,null,"#mob#",2),
    ex(sid,"90/90 Hip Switch","2","8+8",null,null,"#mob#",3),
    ex(sid,"Mobilità Caviglia al Muro","2","8+8",null,null,"#mob#",4),
    ex(sid,"Glute bridge","2","10",null,null,"#att# pausa 2'' in alto",5),
  ];
  let idx = 6;
  if (withScapular) { base.push(ex(sid,"Scapular Retraction con Elastico","2","12",null,null,"#att#",idx++)); }
  base.push(ex(sid,"Dead Bug","2","8+8",null,null,"#att# base",idx++));
  base.push(ex(sid,"Banded Row","2","12",null,null,"#att# con elastico",idx++));
  return base;
};

const rows = [

  // ══ WEEK 1 ══════════════════════════════════════════════════
  // W1D1 – Lower Body
  ...wuD1(S.w1d1.W, "8"),
  ex(S.w1d1.ST,"KB Goblet Squat","3","10","RPE 6","60 sec","su box o panca — sedersi leggermente sul box e risalire. Schiena neutra, collo rilassato, carico leggero.",0),
  ex(S.w1d1.ST,"Belt Squat",     "3","10","RPE 6","60 sec","movimento controllato, focus su gambe e postura. Non cercare carichi alti.",1),
  ex(S.w1d1.A,"Leg extention",           "3","12","RPE 6.5","60 sec","movimento controllato, pausa 1'' in alto.",0),
  ex(S.w1d1.A,"Leg curl",                "3","12","RPE 6.5","60 sec","controllare sia salita che discesa.",1),
  ex(S.w1d1.A,"Bulgarian Split Squat",   "2","8+8","RPE 6",  "60 sec","usare supporto se serve. Corpo libero — assistito PVC.",2),
  ex(S.w1d1.A,"Pulley Machine",          "3","12","RPE 6",   "60 sec","petto aperto, spalle basse, non tirare con il collo.",3),
  ex(S.w1d1.A,"Face Pull con Elastico",  "3","12",null,      "45 sec","elastico leggero, spalle basse.",4),
  ex(S.w1d1.C,"Plank su Panca",                  "3","25''",     null,"30 sec","mani su panca, collo neutro, addome attivo.",0),
  ex(S.w1d1.C,"Side Plank con Ginocchia a Terra", "3","20''/lato",null,"30 sec",null,1),
  ex(S.w1d1.C,"Dead Bug Dinamico",               "3","8+8",      null,"30 sec",null,2),

  // W1D2 – Full Body
  ...wuD2(S.w1d2.W, "10", false),
  ex(S.w1d2.ST,"KB Deadlift",         "3","10","RPE 6","60 sec","kettlebell tra i piedi, partire da rialzo se serve, schiena neutra e collo rilassato.",0),
  ex(S.w1d2.ST,"DB Reverse Lunge",    "3","8+8","RPE 6","60 sec","affondo posteriore con manubri leggeri.",1),
  ex(S.w1d2.ST,"Push Up Inclinato",   "3","10",null,   "60 sec","spalle basse, collo rilassato, non chiudere le spalle in avanti.",2),
  ex(S.w1d2.ST,"Lat Machine Presa Neutra","3","10","RPE 6","60 sec","o elastico dall'alto — non deve esserci il collo che lavora o tira.",3),
  ex(S.w1d2.A,"DB Glute Bridge",           "3","12","RPE 6.5","60 sec","pausa 1'' in alto, spingere dai talloni.",0),
  ex(S.w1d2.A,"Step Up",                   "3","8+8","RPE 6", "60 sec","box basso, appoggio completo del piede, salire controllata senza slancio. Manubri leggeri o corpo libero.",1),
  ex(S.w1d2.A,"Leg extention",             "3","12","RPE 6.5","60 sec",null,2),
  ex(S.w1d2.A,"Banded Row",               "3","12",null,      "45 sec",null,3),
  ex(S.w1d2.A,"External Rotation con Elastico","2","12+12",null,"30 sec",null,4),
  ex(S.w1d2.A,"Band Pull Apart",          "2","15",null,      "30 sec",null,5),
  ex(S.w1d2.C,"Pallof Press",  "3","10+10",null,"30 sec","bacino fermo, braccia avanti, non ruotare il busto.",0),
  ex(S.w1d2.C,"Wall Sit",      "3","25''", null,"45 sec","schiena appoggiata, ginocchia comode, non scendere troppo.",1),
  ex(S.w1d2.C,"DB Farmer Carry","4","25''",null,"45 sec","camminata lenta, spalle basse, collo rilassato, addome attivo.",2),

  // ══ WEEK 2 ══════════════════════════════════════════════════
  // W2D1 – Lower Body
  ...wuD1(S.w2d1.W, "10"),
  ex(S.w2d1.ST,"KB Goblet Squat","3","10","RPE 6.5","60 sec","su box o panca — carico leggermente più alto rispetto alla Settimana 1 solo se la tecnica è stabile.",0),
  ex(S.w2d1.ST,"Belt Squat",     "3","10","RPE 6.5","60 sec","movimento controllato, senza cercare carichi alti.",1),
  ex(S.w2d1.A,"Leg extention",          "3","12","RPE 6.5","60 sec",null,0),
  ex(S.w2d1.A,"Leg curl",               "3","12","RPE 6.5","60 sec",null,1),
  ex(S.w2d1.A,"DB Bulgarian Split Squat","2","8+8","RPE 6.5","60 sec","2 DB leggeri.",2),
  ex(S.w2d1.A,"Pulley Machine",         "3","12","RPE 6.5","60 sec","petto aperto, spalle basse, non tirare con il collo.",3),
  ex(S.w2d1.A,"Face Pull con Elastico", "3","12",null,      "45 sec","elastico leggero, spalle basse.",4),
  ex(S.w2d1.C,"Plank su Panca",                  "3","30''",     null,"30 sec","mani su panca, collo neutro, addome attivo.",0),
  ex(S.w2d1.C,"Side Plank con Ginocchia a Terra", "3","25''/lato",null,"30 sec",null,1),
  ex(S.w2d1.C,"Dead Bug Dinamico",               "3","8+8",      null,"30 sec",null,2),

  // W2D2 – Full Body
  ...wuD2(S.w2d2.W, "10", true),
  ex(S.w2d2.ST,"KB Deadlift",           "3","10","RPE 6.5","60 sec","kettlebell tra i piedi, partire da rialzo se serve, schiena neutra e collo rilassato.",0),
  ex(S.w2d2.ST,"DB Reverse Lunge",      "3","8+8","RPE 6.5","60 sec","affondo posteriore con manubri leggeri.",1),
  ex(S.w2d2.ST,"DB Bench Press",        "3","10","5 DB","60 sec","BENCH Press Manubri 5 KG MAX — focus incastro scapolare.",2),
  ex(S.w2d2.ST,"Lat Machine Presa Neutra","3","10","RPE 6.5","60 sec","o elastico dall'alto — non deve esserci il collo che lavora o tira.",3),
  ex(S.w2d2.A,"DB Glute Bridge",              "3","12","RPE 6.5","60 sec","pausa 1'' in alto, spingere dai talloni.",0),
  ex(S.w2d2.A,"Step Up",                      "3","10+10","RPE 6.5","60 sec","box basso, appoggio completo del piede, salire controllata senza slancio. Manubri leggeri o corpo libero.",1),
  ex(S.w2d2.A,"Leg curl",                     "3","12","RPE 6.5","60 sec",null,2),
  ex(S.w2d2.A,"External Rotation con Elastico","2","12+12",null,"30 sec",null,3),
  ex(S.w2d2.A,"Band Pull Apart",              "2","15",null,      "30 sec",null,4),
  ex(S.w2d2.C,"Pallof Press",  "3","10+10",null,"30 sec","bacino fermo, braccia avanti, non ruotare il busto.",0),
  ex(S.w2d2.C,"Wall Sit",      "3","30''", null,"45 sec","schiena appoggiata, ginocchia comode, non scendere troppo.",1),
  ex(S.w2d2.C,"DB Farmer Carry","4","30''",null,"45 sec","camminata lenta, spalle basse, collo rilassato, addome attivo.",2),

  // ══ WEEK 3 ══════════════════════════════════════════════════
  // W3D1 – Lower Body
  ...wuD1(S.w3d1.W, "10"),
  ex(S.w3d1.ST,"KB Goblet Squat","4","10","RPE 7","60 sec","su box o panca — carico leggermente più alto rispetto alla Settimana 2 solo se la tecnica è stabile.",0),
  ex(S.w3d1.ST,"Belt Squat",     "4","10","RPE 7","60 sec","movimento controllato.",1),
  ex(S.w3d1.A,"Leg extention",          "4","12","RPE 7","60 sec","pausa 1'' in alto.",0),
  ex(S.w3d1.A,"Leg Curl Fitball",       "4","12",null,   "60 sec",null,1),
  ex(S.w3d1.A,"DB Bulgarian Split Squat","3","8+8","RPE 7","60 sec","2 DB.",2),
  ex(S.w3d1.A,"Pulley Machine",         "4","12","RPE 7","60 sec","petto aperto, spalle basse, non tirare con il collo.",3),
  ex(S.w3d1.A,"Face Pull con Elastico", "3","15",null,   "45 sec","elastico leggero, spalle basse.",4),
  ex(S.w3d1.C,"Plank su Panca",                  "3","35''",     null,"30 sec","mani su panca, collo neutro, addome attivo.",0),
  ex(S.w3d1.C,"Side Plank con Ginocchia a Terra", "3","30''/lato",null,"30 sec",null,1),
  ex(S.w3d1.C,"Dead Bug Dinamico",               "3","10+10",    null,"30 sec",null,2),

  // W3D2 – Full Body
  ...wuD2(S.w3d2.W, "12", true),
  ex(S.w3d2.ST,"KB Deadlift",           "4","10","RPE 7","60 sec","kettlebell tra i piedi, partire da rialzo se serve, schiena neutra e collo rilassato.",0),
  ex(S.w3d2.ST,"DB Reverse Lunge",      "3","10+10","RPE 7","60 sec","affondo posteriore con manubri leggeri.",1),
  ex(S.w3d2.ST,"Push Up Inclinato",     "3","10",null,    "60 sec","spalle basse, collo rilassato, non chiudere le spalle in avanti.",2),
  ex(S.w3d2.ST,"Lat Machine Presa Neutra","3","10-12","RPE 7","60 sec","o elastico dall'alto — non deve esserci il collo che lavora o tira.",3),
  ex(S.w3d2.A,"DB Glute Bridge",              "4","12","RPE 7","60 sec","pausa 1'' in alto, spingere dai talloni.",0),
  ex(S.w3d2.A,"Step Up",                      "3","10+10","RPE 7","60 sec","box basso, appoggio completo del piede, salire controllata senza slancio. Manubri leggeri o corpo libero.",1),
  ex(S.w3d2.A,"Leg extention",               "4","12","RPE 7","60 sec",null,2),
  ex(S.w3d2.A,"External Rotation con Elastico","3","12+12",null,"30 sec",null,3),
  ex(S.w3d2.A,"Band Pull Apart",             "3","15",null,      "30 sec",null,4),
  ex(S.w3d2.C,"Pallof Press",  "3","12+12",null,"30 sec","bacino fermo, braccia avanti, non ruotare il busto.",0),
  ex(S.w3d2.C,"Wall Sit",      "3","35''", null,"45 sec","schiena appoggiata, ginocchia comode, non scendere troppo.",1),
  ex(S.w3d2.C,"DB Farmer Carry","4","35''",null,"45 sec","camminata lenta, spalle basse, collo rilassato, addome attivo.",2),

  // ══ WEEK 4 (SCARICO) ════════════════════════════════════════
  // W4D1 – Lower Body
  ...wuD1(S.w4d1.W, "8"),
  ex(S.w4d1.ST,"KB Goblet Squat","3","10","RPE 6","60 sec","su box o panca — carico facile, movimento controllato.",0),
  ex(S.w4d1.ST,"Belt Squat",     "3","10","RPE 6","60 sec","movimento controllato.",1),
  ex(S.w4d1.A,"Leg extention",       "3","12","RPE 6","60 sec","movimento controllato, pausa 1'' in alto.",0),
  ex(S.w4d1.A,"Leg Curl Fitball",    "3","12",null,   "60 sec",null,1),
  ex(S.w4d1.A,"Bulgarian Split Squat","2","8+8","RPE 6","60 sec",null,2),
  ex(S.w4d1.A,"Pulley Machine",      "3","12","RPE 6","60 sec","petto aperto, spalle basse, non tirare con il collo.",3),
  ex(S.w4d1.A,"Face Pull con Elastico","3","12",null, "45 sec","elastico leggero, spalle basse.",4),
  ex(S.w4d1.C,"Plank su Panca",                  "3","25-30''",  null,"30 sec","mani su panca, collo neutro, addome attivo.",0),
  ex(S.w4d1.C,"Side Plank con Ginocchia a Terra", "3","20-25''/lato",null,"30 sec",null,1),
  ex(S.w4d1.C,"Dead Bug Dinamico",               "3","8+8",      null,"30 sec",null,2),

  // W4D2 – Full Body
  ...wuD2(S.w4d2.W, "10", false),
  ex(S.w4d2.ST,"KB Deadlift",           "3","10","RPE 6","60 sec","kettlebell tra i piedi, partire da rialzo se serve, schiena neutra e collo rilassato.",0),
  ex(S.w4d2.ST,"DB Reverse Lunge",      "3","8+8",null,  "60 sec","affondo posteriore partenza da rialzo.",1),
  ex(S.w4d2.ST,"DB Bench Press",        "3","10","RPE 6","60 sec","BENCH Press Manubri — focus incastro scapolare.",2),
  ex(S.w4d2.ST,"Lat Machine Presa Neutra","3","10","RPE 6","60 sec","o elastico dall'alto — non deve esserci il collo che lavora o tira.",3),
  ex(S.w4d2.A,"DB Glute Bridge",              "3","12","RPE 6","60 sec","pausa 1'' in alto, spingere dai talloni.",0),
  ex(S.w4d2.A,"Step Up",                      "3","8+8","RPE 6","60 sec","box basso, appoggio completo del piede, salire controllata senza slancio. Manubri leggeri o corpo libero.",1),
  ex(S.w4d2.A,"Leg curl",                     "3","12","RPE 6","60 sec",null,2),
  ex(S.w4d2.A,"External Rotation con Elastico","2","12+12",null,"30 sec",null,3),
  ex(S.w4d2.A,"Band Pull Apart",              "2","15",null,    "30 sec",null,4),
  ex(S.w4d2.C,"Pallof Press",   "3","10+10",null,"30 sec","bacino fermo, braccia avanti, non ruotare il busto.",0),
  ex(S.w4d2.C,"Wall Sit",       "3","25''", null,"45 sec","schiena appoggiata, ginocchia comode, non scendere troppo.",1),
  ex(S.w4d2.C,"DB Farmer Carry","3","25-30''",null,"45 sec","camminata lenta, spalle basse, collo rilassato, addome attivo.",2),
];

const { error } = await supabase.from("exercises").insert(rows);
if (error) console.error("❌ ERRORE:", error.message);
else console.log(`✅ Martina giugno inserito! (${rows.length} esercizi su 8 giorni)`);
