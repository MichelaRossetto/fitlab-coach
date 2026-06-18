import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://wltgyvkgevrrgznxtkxc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs"
);

// ── Struttura Ivan ──────────────────────────────────────────────
const { data: client } = await supabase.from("clients").select("id, name, surname")
  .ilike("name", "%ivan%").ilike("surname", "%momesso%").single();
console.log("Cliente:", client);
if (!client) process.exit(1);

const { data: months } = await supabase.from("training_months").select("id, label, month_num, year")
  .eq("client_id", client.id).order("year").order("month_num");
console.log("Mesi:", months?.map(m => m.label).join(", "));

for (const m of months || []) {
  const { data: weeks } = await supabase.from("training_weeks").select("id, week_number, date_start, date_end")
    .eq("month_id", m.id).order("week_number");
  if (weeks?.length) {
    console.log(`\n${m.label} (${m.id}):`);
    for (const w of weeks) {
      const { data: days } = await supabase.from("training_days").select("id, day_number, label").eq("week_id", w.id).order("day_number");
      console.log(`  W${w.week_number} (${w.date_start}→${w.date_end}):`, days?.map(d => `D${d.day_number}(${d.label ?? ""})(${d.id.slice(0,8)})`).join(", "));
    }
  }
}

// ── Check libreria ─────────────────────────────────────────────
console.log("\n── LIBRERIA ──");
const kws = [
  "90/90", "open book", "leg press", "standing calf", "calf raise",
  "incline bench", "shoulder press", "alzate laterali", "lateral raise",
  "curl.*inclin", "inclined.*curl", "push down", "pushdown", "tricep",
  "tapis roulant", "treadmill", "sumo deadlift", "romanian deadlift",
  "dead bug", "bird dog", "hollow hold", "suitcase", "pallof",
  "hip hinge", "scapular push", "shoulder cars", "open book", "lat machine"
];
for (const kw of kws) {
  const { data } = await supabase.from("exercise_library").select("name, category, subcategory")
    .ilike("name", `%${kw.replace(/\.\*/g, "%")}%`).order("name");
  if (data?.length) console.log(`✅ "${kw}": ${data.map(e => e.name).slice(0,3).join(" | ")}`);
  else console.log(`❌ "${kw}": NON TROVATO`);
}
