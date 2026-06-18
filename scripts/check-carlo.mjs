import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://wltgyvkgevrrgznxtkxc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs"
);

const keywords = [
  "hip opener", "squat to stand", "bodyweight squat", "wall slide",
  "push up incl", "leg raise", "renegade", "snatch", "romanian deadlift",
  "trazione", "pull up", "v up", "vup", "goblet", "side plank pulse",
  "devil press", "russian twist", "face pull", "ski erg", "ski sprint",
  "db walking lunge", "walking lunge"
];

for (const kw of keywords) {
  const { data } = await supabase.from("exercise_library").select("name, category, subcategory").ilike("name", `%${kw}%`).order("name");
  if (data?.length) {
    console.log(`✅ "${kw}":`);
    data.forEach(e => console.log(`   → ${e.name} [${e.category} / ${e.subcategory ?? "-"}]`));
  } else {
    console.log(`❌ "${kw}": NON TROVATO`);
  }
}

// Verifica struttura Carlo
const { data: client } = await supabase.from("clients").select("id, name, surname").ilike("name", "%carlo%").ilike("surname", "%pagotto%").single();
console.log("\n── Cliente:", client);
if (client) {
  const { data: months } = await supabase.from("training_months").select("id, label, month_num, year").eq("client_id", client.id).order("year").order("month_num");
  console.log("Mesi:", months?.map(m => m.label).join(", "));
}
