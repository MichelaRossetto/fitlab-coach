import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://wltgyvkgevrrgznxtkxc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs"
);

// ── Struttura Diana ────────────────────────────────────────────
const { data: client } = await supabase.from("clients").select("id, name, surname")
  .ilike("name", "%diana%").ilike("surname", "%fogoroasi%").single();
console.log("Cliente:", client);

const { data: months } = await supabase.from("training_months").select("id, label, month_num, year")
  .eq("client_id", client.id).order("year").order("month_num");
console.log("Mesi:", months?.map(m => m.label).join(", "));

const june = months?.find(m => m.month_num === 6 && m.year === 2026);
if (june) {
  const { data: weeks } = await supabase.from("training_weeks").select("id, week_number, date_start, date_end")
    .eq("month_id", june.id).order("week_number");
  console.log("\nSettimane giugno:", weeks?.map(w => `W${w.week_number}: ${w.date_start}→${w.date_end}`).join(" | "));
  for (const w of weeks || []) {
    const { data: days } = await supabase.from("training_days").select("id, day_number, label").eq("week_id", w.id).order("day_number");
    console.log(`  W${w.week_number}:`, days?.map(d => `D${d.day_number}(${d.id.slice(0,8)})`).join(", "));
  }
}

// ── Check libreria ─────────────────────────────────────────────
console.log("\n── LIBRERIA ──");
const keywords = [
  "monster walk", "belt squat", "hip thrust", "single leg romanian",
  "weighted sit up", "shoulder cars", "shoulder disloc", "dislocation",
  "db push press", "push press", "slam ball", "slamball",
  "cossack", "affondi camminat", "walking lunge", "landmine squat",
  "burpee box", "db thruster", "thruster", "overhead hold",
  "toes to bar", "double under", "single under", "db clean",
  "clean jerk", "pike leg", "american swing", "gorilla",
  "db press", "strict press", "front squat", "belt squat",
  "leg curl dist", "affondi poster", "affondi in camm",
  "weighted", "wall ball", "jump lunges"
];

for (const kw of keywords) {
  const { data } = await supabase.from("exercise_library").select("name, category, subcategory")
    .ilike("name", `%${kw}%`).order("name");
  if (data?.length) {
    console.log(`✅ "${kw}": ${data.map(e => e.name).join(" | ")}`);
  } else {
    console.log(`❌ "${kw}": NON TROVATO`);
  }
}
