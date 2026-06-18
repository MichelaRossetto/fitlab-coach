import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://wltgyvkgevrrgznxtkxc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs"
);

// ── Struttura ───────────────────────────────────────────────────
const { data: client } = await supabase.from("clients").select("id, name, surname")
  .ilike("name", "%silvia%").ilike("surname", "%casonato%").single();
console.log("Cliente:", client);
if (!client) process.exit(1);

const { data: months } = await supabase.from("training_months").select("id, label, month_num, year")
  .eq("client_id", client.id).order("year").order("month_num");
console.log("Mesi:", months?.map(m => m.label).join(", "));

// Cerca mese attivo (giugno o più recente con settimane)
for (const m of months || []) {
  const { data: weeks } = await supabase.from("training_weeks").select("id, week_number, date_start, date_end")
    .eq("month_id", m.id).order("week_number");
  if (weeks?.length) {
    console.log(`\n${m.label} (${m.id}):`);
    console.log("  Settimane:", weeks.map(w => `W${w.week_number}: ${w.date_start}→${w.date_end}`).join(" | "));
    for (const w of weeks) {
      const { data: days } = await supabase.from("training_days").select("id, day_number, label").eq("week_id", w.id).order("day_number");
      console.log(`    W${w.week_number}:`, days?.map(d => `D${d.day_number}(${d.id.slice(0,8)})`).join(", "));
    }
  }
}

// ── Check libreria ─────────────────────────────────────────────
console.log("\n── LIBRERIA ──");
const keywords = [
  "cat cow", "shoulder pass", "pass through", "hip hinge",
  "good morning", "back extension", "back extens",
  "box step up", "db step up", "step up",
  "leg raise", "hanging leg", "hanging knee",
  "sumo deadlift", "push press", "belt squat", "ring row",
  "reverse crunch", "soft ball", "suitcase carry",
  "russian twist", "skill mill", "wall ball",
  "burpee", "goblet squat", "ski erg",
  "db press", "shoulder press", "bench press",
  "cop.*plank", "copenhagen"
];
for (const kw of keywords) {
  const { data } = await supabase.from("exercise_library").select("name, category, subcategory")
    .ilike("name", `%${kw}%`).order("name");
  if (data?.length) console.log(`✅ "${kw}": ${data.map(e => e.name).slice(0,4).join(" | ")}`);
  else console.log(`❌ "${kw}": NON TROVATO`);
}
