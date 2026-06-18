import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://wltgyvkgevrrgznxtkxc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs"
);

const keywords = ["barbell row", "affondi", "reverse lunge", "jump", "rope", "skipping", "corda"];
for (const kw of keywords) {
  const { data } = await supabase.from("exercise_library").select("name, category, subcategory").ilike("name", `%${kw}%`).order("name");
  if (data?.length) {
    console.log(`✅ "${kw}":`);
    data.forEach(e => console.log(`   → ${e.name} [${e.category} / ${e.subcategory ?? "-"}]`));
  } else {
    console.log(`❌ "${kw}": NON TROVATO`);
  }
}
