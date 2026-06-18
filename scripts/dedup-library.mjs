import { createClient } from "@supabase/supabase-js";
const s = createClient("https://wltgyvkgevrrgznxtkxc.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs");

// Trova tutti i duplicati nella libreria (stesso nome + categoria)
const { data: all } = await s.from("exercise_library").select("id, name, category, subcategory").order("name").order("created_at");

const seen = new Map();
const toDelete = [];
for (const e of all || []) {
  const key = `${e.name}||${e.category}||${e.subcategory}`;
  if (seen.has(key)) {
    toDelete.push(e.id);
  } else {
    seen.set(key, e.id);
  }
}

console.log(`Duplicati trovati: ${toDelete.length}`);
if (toDelete.length > 0) {
  const { error } = await s.from("exercise_library").delete().in("id", toDelete);
  if (error) console.error("❌", error.message);
  else console.log(`✅ Rimossi ${toDelete.length} duplicati dalla libreria`);
} else {
  console.log("Nessun duplicato da rimuovere.");
}
