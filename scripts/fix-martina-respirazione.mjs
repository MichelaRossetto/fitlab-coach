import { createClient } from "@supabase/supabase-js";
const s = createClient("https://wltgyvkgevrrgznxtkxc.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs");

const MONTH_ID = "aa7e364c-708e-4ecd-8a74-6d69e08445a6";
const { data: weeks } = await s.from("training_weeks").select("id,week_number").eq("month_id", MONTH_ID).order("week_number");

for (const w of weeks) {
  const { data: days } = await s.from("training_days").select("id,day_number").eq("week_id", w.id).order("day_number");
  for (const day of days) {
    const { data: sec } = await s.from("workout_sections").select("id").eq("day_id", day.id).eq("section_type", "core").single();
    if (!sec) continue;

    // Trova l'ultimo order_index in CORE
    const { data: exs } = await s.from("exercises").select("order_index").eq("section_id", sec.id).order("order_index", { ascending: false }).limit(1);
    const nextIdx = (exs?.[0]?.order_index ?? -1) + 1;

    const { error } = await s.from("exercises").insert({
      section_id: sec.id,
      name: "Respirazione Diaframmatica",
      sets: null,
      reps: "2 min",
      load: null,
      rest_time: null,
      notes: "da supina — defaticamento",
      order_index: nextIdx,
    });

    if (error) console.error(`❌ W${w.week_number}D${day.day_number}:`, error.message);
    else console.log(`✅ W${w.week_number}D${day.day_number} — respirazione aggiunta`);
  }
}
