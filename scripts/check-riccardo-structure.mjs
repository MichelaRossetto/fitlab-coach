import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://wltgyvkgevrrgznxtkxc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs"
);

const { data: client } = await supabase
  .from("clients").select("id, name, surname")
  .ilike("name", "%riccardo%").ilike("surname", "%desider%").single();
console.log("Cliente:", client);

if (!client) { console.log("❌ Cliente non trovato"); process.exit(1); }

const { data: months } = await supabase
  .from("training_months").select("id, label, month_num, year")
  .eq("client_id", client.id).order("year").order("month_num");
console.log("\nMesi:", months);

const juneMonth = months?.find(m => m.month_num === 6 && m.year === 2026);
if (!juneMonth) { console.log("❌ Mese giugno non trovato"); process.exit(1); }

const { data: weeks } = await supabase
  .from("training_weeks").select("id, week_number, date_start, date_end")
  .eq("month_id", juneMonth.id).order("week_number");
console.log("\nSettimane giugno:", weeks);

for (const w of weeks || []) {
  const { data: days } = await supabase
    .from("training_days").select("id, day_number, label")
    .eq("week_id", w.id).order("day_number");
  console.log(`  W${w.week_number}:`, days?.map(d => `D${d.day_number}(${d.label ?? ""})`).join(", "));
}
