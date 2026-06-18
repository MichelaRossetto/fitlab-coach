import { createClient } from "@supabase/supabase-js";
const s = createClient("https://wltgyvkgevrrgznxtkxc.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs");

const clients = [
  { name: "Nicola", surname: "Redigolo" },
  { name: "Carlo", surname: "Pagotto" },
  { name: "Diana", surname: "Fogoroasi" },
  { name: "Silvia", surname: "Casonato" },
  { name: "Ivan", surname: "Momesso" },
  { name: "Ester", surname: "Carrer" },
  { name: "Matteo", surname: "Schioppalalba" },
  { name: "Martina", surname: "Pasian" },
  { name: "Lucia", surname: "De Pieri" },
];

for (const c of clients) {
  const { data: clientData } = await s.from("clients").select("id").eq("name", c.name).eq("surname", c.surname).maybeSingle();
  if (!clientData) { console.log(`\n❌ ${c.name} ${c.surname}: non trovato`); continue; }

  // Prendi mese giugno 2026
  const { data: month } = await s.from("training_months").select("id").eq("client_id", clientData.id).eq("month_num", 6).eq("year", 2026).maybeSingle();
  if (!month) { console.log(`\n⚠️  ${c.name} ${c.surname}: nessun giugno 2026`); continue; }

  console.log(`\n${"═".repeat(60)}`);
  console.log(`👤 ${c.name} ${c.surname}`);

  const { data: weeks } = await s.from("training_weeks").select("id,week_number").eq("month_id", month.id).order("week_number");
  for (const w of weeks) {
    const { data: days } = await s.from("training_days").select("id,day_number").eq("week_id", w.id).order("day_number");
    for (const day of days) {
      const { data: secs } = await s.from("workout_sections").select("id,section_type").eq("day_id", day.id);
      let totalEx = 0;
      const secSummary = [];
      for (const sec of secs || []) {
        const { data: exs } = await s.from("exercises").select("name,order_index").eq("section_id", sec.id).order("order_index");
        if (exs?.length) {
          totalEx += exs.length;
          secSummary.push(`${sec.section_type}(${exs.length}): ${exs.map(e=>e.name).join(", ")}`);
        }
      }
      console.log(`\n  W${w.week_number}D${day.day_number} — ${totalEx} esercizi totali`);
      for (const ss of secSummary) console.log(`    • ${ss}`);
    }
  }
}
