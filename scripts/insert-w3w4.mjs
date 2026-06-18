import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://wltgyvkgevrrgznxtkxc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs"
);

const SECTION_ORDER = ["warmup","strength","accessories","core","workout"];
const sec = (sections, type) => sections.find(s => s.section_type === type)?.id;

const { data: days } = await supabase
  .from("training_days")
  .select("id, day_number, training_weeks!inner(week_number, training_months!inner(month_num, clients!inner(name, surname)))")
  .eq("training_weeks.training_months.clients.name", "Nicola")
  .eq("training_weeks.training_months.clients.surname", "Redigolo")
  .eq("training_weeks.training_months.month_num", 6)
  .in("training_weeks.week_number", [3, 4])
  .in("day_number", [1, 2]);

const get = (wk, dn) => days.find(d => d.training_weeks.week_number === wk && d.day_number === dn)?.id;
const W3D1 = get(3,1), W3D2 = get(3,2), W4D1 = get(4,1), W4D2 = get(4,2);
console.log("Days:", { W3D1, W3D2, W4D1, W4D2 });

for (const dayId of [W3D1, W3D2, W4D1, W4D2]) {
  const { data: existing } = await supabase.from("workout_sections").select("id").eq("day_id", dayId);
  if (!existing?.length) {
    await supabase.from("workout_sections").insert(SECTION_ORDER.map((type, i) => ({ day_id: dayId, section_type: type, order_index: i })));
  }
}
console.log("Sezioni pronte");

const getSecs = async (dayId) => { const { data } = await supabase.from("workout_sections").select("id, section_type").eq("day_id", dayId); return data; };
const s3d1 = await getSecs(W3D1); const s3d2 = await getSecs(W3D2);
const s4d1 = await getSecs(W4D1); const s4d2 = await getSecs(W4D2);

const S = {
  w3d1: { W: sec(s3d1,"warmup"), S: sec(s3d1,"strength"), A: sec(s3d1,"accessories"), C: sec(s3d1,"core"), WK: sec(s3d1,"workout") },
  w3d2: { W: sec(s3d2,"warmup"), S: sec(s3d2,"strength"), A: sec(s3d2,"accessories"), C: sec(s3d2,"core"), WK: sec(s3d2,"workout") },
  w4d1: { W: sec(s4d1,"warmup"), S: sec(s4d1,"strength"), A: sec(s4d1,"accessories"), C: sec(s4d1,"core"), WK: sec(s4d1,"workout") },
  w4d2: { W: sec(s4d2,"warmup"), S: sec(s4d2,"strength"), A: sec(s4d2,"accessories"), C: sec(s4d2,"core"), WK: sec(s4d2,"workout") },
};

const allSecs = [...Object.values(S.w3d1), ...Object.values(S.w3d2), ...Object.values(S.w4d1), ...Object.values(S.w4d2)].filter(Boolean);
await supabase.from("exercises").delete().in("section_id", allSecs);
await supabase.from("workout_sections").update({ section_subtype: "fortime",    cap_time: null }).eq("id", S.w3d1.WK);
await supabase.from("workout_sections").update({ section_subtype: "emom",       cap_time: "9"  }).eq("id", S.w3d2.WK);
await supabase.from("workout_sections").update({ section_subtype: "cardioliss", cap_time: null }).eq("id", S.w4d1.WK);
await supabase.from("workout_sections").update({ section_subtype: "amrap",      cap_time: "8"  }).eq("id", S.w4d2.WK);

const rows = [
  // WEEK 3 DAY 1 - WARMUP
  { section_id: S.w3d1.W, name: "Rower", sets: null, reps: "4 min", load: null, rest_time: null, notes: "#cardio#", order_index: 0 },
  { section_id: S.w3d1.W, name: "Glute bridge", sets: "2", reps: "10", load: null, rest_time: null, notes: "#att#", order_index: 1 },
  { section_id: S.w3d1.W, name: "Air Squat", sets: "2", reps: "10", load: null, rest_time: null, notes: "#mob#", order_index: 2 },
  { section_id: S.w3d1.W, name: "Step Up", sets: "2", reps: "8+8", load: null, rest_time: null, notes: "#mob#", order_index: 3 },
  { section_id: S.w3d1.W, name: "Plank", sets: null, reps: "20''", load: null, rest_time: null, notes: "#att#", order_index: 4 },
  { section_id: S.w3d1.W, name: "Band Pull Apart", sets: "2", reps: "10", load: null, rest_time: null, notes: "#att#", order_index: 5 },
  // WEEK 3 DAY 1 - FORZA
  { section_id: S.w3d1.S, name: "Front Squat", sets: "5", reps: "4", load: "RPE 8", rest_time: "90 sec", notes: "#lower#", order_index: 0 },
  // WEEK 3 DAY 1 - ACCESSORI
  { section_id: S.w3d1.A, name: "Affondo Posteriore con Bilanciere Front Rack", sets: "4", reps: "8+8", load: null, rest_time: "75 sec", notes: null, order_index: 0 },
  { section_id: S.w3d1.A, name: "Lat Machine Presa Triangolo", sets: "4", reps: "6", load: null, rest_time: "75 sec", notes: "PESANTI", order_index: 1 },
  { section_id: S.w3d1.A, name: "DB Sumo Squat", sets: "4", reps: "12", load: "20 DB", rest_time: "60 sec", notes: null, order_index: 2 },
  { section_id: S.w3d1.A, name: "Farmer Carry Pesante", sets: "4", reps: "40 MT", load: "32 KB", rest_time: "60 sec", notes: null, order_index: 3 },
  // WEEK 3 DAY 1 - WORKOUT (FOR TIME)
  { section_id: S.w3d1.WK, name: "Walking Lunge", sets: null, reps: "60", load: null, rest_time: null, notes: "#fortime#", order_index: 0 },
  { section_id: S.w3d1.WK, name: "Assault Bike Calories", sets: null, reps: "40", load: null, rest_time: null, notes: "#fortime#", order_index: 1 },
  { section_id: S.w3d1.WK, name: "Step Up", sets: null, reps: "30", load: null, rest_time: null, notes: "#fortime#", order_index: 2 },
  { section_id: S.w3d1.WK, name: "Goblet Squat", sets: null, reps: "20", load: null, rest_time: null, notes: "#fortime#", order_index: 3 },

  // WEEK 3 DAY 2 - WARMUP
  { section_id: S.w3d2.W, name: "Rower", sets: null, reps: "4 min", load: null, rest_time: null, notes: "#cardio#", order_index: 0 },
  { section_id: S.w3d2.W, name: "Band Pull Apart", sets: "2", reps: "10", load: null, rest_time: null, notes: "#att#", order_index: 1 },
  { section_id: S.w3d2.W, name: "Banded Row", sets: "2", reps: "10", load: null, rest_time: null, notes: "#att#", order_index: 2 },
  { section_id: S.w3d2.W, name: "Scapular Push Up", sets: "2", reps: "10", load: null, rest_time: null, notes: "#mob#", order_index: 3 },
  { section_id: S.w3d2.W, name: "Hollow Hold", sets: null, reps: "20''", load: null, rest_time: null, notes: "#att#", order_index: 4 },
  // WEEK 3 DAY 2 - FORZA
  { section_id: S.w3d2.S, name: "Bench Press", sets: "5", reps: "4", load: "RPE 8", rest_time: "90 sec", notes: "#upper#", order_index: 0 },
  // WEEK 3 DAY 2 - ACCESSORI
  { section_id: S.w3d2.A, name: "Pull Up", sets: "4", reps: "6-8", load: null, rest_time: "60 sec", notes: null, order_index: 0 },
  { section_id: S.w3d2.A, name: "Half Kneeling DB Press", sets: "4", reps: "10+10", load: null, rest_time: "60 sec", notes: null, order_index: 1 },
  { section_id: S.w3d2.A, name: "KB Suitcase Carry", sets: "4", reps: "35 MT", load: "32 KB", rest_time: "60 sec", notes: null, order_index: 2 },
  // WEEK 3 DAY 2 - WORKOUT (EMOM 9')
  { section_id: S.w3d2.WK, name: "Rower Calories", sets: null, reps: "10", load: null, rest_time: null, notes: "#emom#", order_index: 0 },
  { section_id: S.w3d2.WK, name: "KB Gorilla Row", sets: null, reps: "10", load: null, rest_time: null, notes: "#emom#", order_index: 1 },
  { section_id: S.w3d2.WK, name: "Burpee", sets: null, reps: "8", load: null, rest_time: null, notes: "#emom#", order_index: 2 },
  // WEEK 3 DAY 2 - CORE
  { section_id: S.w3d2.C, name: "Plank", sets: "2", reps: "40''", load: null, rest_time: null, notes: null, order_index: 0 },
  { section_id: S.w3d2.C, name: "Bird Dog Dinamico", sets: "2", reps: "10+10", load: null, rest_time: null, notes: null, order_index: 1 },
  { section_id: S.w3d2.C, name: "Reverse Crunch", sets: "2", reps: "15", load: null, rest_time: null, notes: null, order_index: 2 },

  // WEEK 4 DAY 1 - WARMUP
  { section_id: S.w4d1.W, name: "Skill Mill Walk", sets: null, reps: "5 min", load: null, rest_time: null, notes: "#cardio#", order_index: 0 },
  { section_id: S.w4d1.W, name: "Glute bridge", sets: "2", reps: "10", load: null, rest_time: null, notes: "#att#", order_index: 1 },
  { section_id: S.w4d1.W, name: "Air Squat", sets: "2", reps: "10", load: null, rest_time: null, notes: "#mob#", order_index: 2 },
  { section_id: S.w4d1.W, name: "Step Up", sets: "2", reps: "8+8", load: null, rest_time: null, notes: "#mob#", order_index: 3 },
  { section_id: S.w4d1.W, name: "Prono Plank", sets: null, reps: "20''", load: null, rest_time: null, notes: "#att#", order_index: 4 },
  // WEEK 4 DAY 1 - FORZA
  { section_id: S.w4d1.S, name: "KB Goblet Squat", sets: "3", reps: "10", load: "16 KB", rest_time: "60 sec", notes: "#lower#", order_index: 0 },
  // WEEK 4 DAY 1 - ACCESSORI
  { section_id: S.w4d1.A, name: "Step Down", sets: "3", reps: "10+10", load: null, rest_time: "60 sec", notes: null, order_index: 0 },
  { section_id: S.w4d1.A, name: "Ring Row", sets: "3", reps: "12", load: null, rest_time: "60 sec", notes: null, order_index: 1 },
  { section_id: S.w4d1.A, name: "Affondo Laterale", sets: "3", reps: "12", load: null, rest_time: "60 sec", notes: null, order_index: 2 },
  { section_id: S.w4d1.A, name: "DB Overhead Carry", sets: "3", reps: "30 MT", load: null, rest_time: "60 sec", notes: null, order_index: 3 },
  // WEEK 4 DAY 1 - WORKOUT (CARDIO LISS 10')
  { section_id: S.w4d1.WK, name: "Assault Bike LISS", sets: null, reps: "10 min", load: null, rest_time: null, notes: "#cardioliss#", order_index: 0 },
  // WEEK 4 DAY 1 - CORE
  { section_id: S.w4d1.C, name: "Pallof Press", sets: "3", reps: "10+10", load: null, rest_time: null, notes: null, order_index: 0 },
  { section_id: S.w4d1.C, name: "Star Plank", sets: "3", reps: "20''/lato", load: null, rest_time: null, notes: null, order_index: 1 },
  { section_id: S.w4d1.C, name: "Hollow Rock", sets: "3", reps: "30''", load: null, rest_time: null, notes: null, order_index: 2 },

  // WEEK 4 DAY 2 - WARMUP
  { section_id: S.w4d2.W, name: "Assault Bike", sets: null, reps: "4 min", load: null, rest_time: null, notes: "#cardio#", order_index: 0 },
  { section_id: S.w4d2.W, name: "Band Pull Apart", sets: "2", reps: "10", load: null, rest_time: null, notes: "#att#", order_index: 1 },
  { section_id: S.w4d2.W, name: "Banded Row", sets: "2", reps: "10", load: null, rest_time: null, notes: "#att#", order_index: 2 },
  { section_id: S.w4d2.W, name: "Scapular Push Up", sets: "2", reps: "10", load: null, rest_time: null, notes: "#mob#", order_index: 3 },
  { section_id: S.w4d2.W, name: "Hollow Hold", sets: null, reps: "20''", load: null, rest_time: null, notes: "#att#", order_index: 4 },
  // WEEK 4 DAY 2 - FORZA
  { section_id: S.w4d2.S, name: "DB Strict Press", sets: "3", reps: "10", load: "7.5 DB", rest_time: "60 sec", notes: "#upper#", order_index: 0 },
  // WEEK 4 DAY 2 - ACCESSORI
  { section_id: S.w4d2.A, name: "Lat Machine Presa Larga", sets: "3", reps: "12", load: null, rest_time: "60 sec", notes: null, order_index: 0 },
  { section_id: S.w4d2.A, name: "DB Bench Press", sets: "3", reps: "10", load: "10 DB", rest_time: "60 sec", notes: null, order_index: 1 },
  { section_id: S.w4d2.A, name: "Chest Supported Row", sets: "3", reps: "12", load: "12.5 DB", rest_time: "60 sec", notes: null, order_index: 2 },
  { section_id: S.w4d2.A, name: "KB Suitcase Carry", sets: "3", reps: "30 MT", load: "24 KB", rest_time: "60 sec", notes: null, order_index: 3 },
  // WEEK 4 DAY 2 - WORKOUT (AMRAP 8')
  { section_id: S.w4d2.WK, name: "Assault Bike Calories", sets: null, reps: "8", load: null, rest_time: null, notes: "#amrap#", order_index: 0 },
  { section_id: S.w4d2.WK, name: "Sit Up", sets: null, reps: "10", load: null, rest_time: null, notes: "#amrap#", order_index: 1 },
  { section_id: S.w4d2.WK, name: "Push Up", sets: null, reps: "10", load: null, rest_time: null, notes: "#amrap#", order_index: 2 },
  { section_id: S.w4d2.WK, name: "Air Squat", sets: null, reps: "10", load: null, rest_time: null, notes: "#amrap#", order_index: 3 },
  // WEEK 4 DAY 2 - CORE
  { section_id: S.w4d2.C, name: "Dead Bug Dinamico", sets: "2", reps: "10+10", load: null, rest_time: null, notes: null, order_index: 0 },
  { section_id: S.w4d2.C, name: "Bird Dog Dinamico", sets: "2", reps: "10+10", load: null, rest_time: null, notes: "con elastico", order_index: 1 },
  { section_id: S.w4d2.C, name: "Stir The Pot", sets: "2", reps: "15''/lato", load: null, rest_time: null, notes: "con fitball", order_index: 2 },
];

const { error } = await supabase.from("exercises").insert(rows);
if (error) console.error("ERRORE:", error.message);
else console.log(`✅ Week 3 e 4 inseriti! (${rows.length} esercizi su 4 giorni)`);
