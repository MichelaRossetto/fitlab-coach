import { createClient } from "@supabase/supabase-js";
const s = createClient("https://wltgyvkgevrrgznxtkxc.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs");
const kws = ["90/90","open book","leg press","calf raise","standing calf","inclined curl","incline curl","push down","pushdown","tricep push","tapis","treadmill","affondi in camm","walking lunge","hip extension","back extension"];
for (const kw of kws) {
  const {data} = await s.from("exercise_library").select("name,category,subcategory").ilike("name",`%${kw}%`).order("name");
  if (data?.length) console.log(`OK "${kw}": ${data.map(e=>e.name).slice(0,4).join(" | ")}`);
  else console.log(`NO "${kw}": NON TROVATO`);
}
