import { createClient } from "@supabase/supabase-js";
const s = createClient("https://wltgyvkgevrrgznxtkxc.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs");

// Struttura
const {data:clients} = await s.from("clients").select("id,name,surname").ilike("name","%martina%").ilike("surname","%pasian%");
console.log("Clienti:", JSON.stringify(clients));
const client = clients?.[0];
if (!client) { console.log("Non trovata"); process.exit(1); }

const {data:months} = await s.from("training_months").select("id,label,month_num,year").eq("client_id",client.id).order("month_num");
for (const m of months||[]) {
  const {data:weeks} = await s.from("training_weeks").select("id,week_number,date_start,date_end").eq("month_id",m.id).order("week_number");
  if (!weeks?.length) continue;
  console.log(`\n${m.label} (${m.id}):`);
  for (const w of weeks) {
    const {data:days} = await s.from("training_days").select("id,day_number").eq("week_id",w.id).order("day_number");
    console.log(`  W${w.week_number} (${w.date_start}→${w.date_end}):`, days?.map(d=>`D${d.day_number}(${d.id.slice(0,8)})`).join(", "));
  }
}

console.log("\n── LIBRERIA ──");
const kws = [
  "hip flexor stretch","mini band lateral","lateral walk","band lateral",
  "wall sit","ankle mobility","caviglia al muro","mobilità caviglia",
  "side plank.*ginocch","ginocchia a terra","plank.*panca",
  "leg curl fitball","fitball leg curl","glute bridge.*man","hip thrust.*man",
  "db glute bridge","scapular retraction","band external","external rotation",
  "step up","step-up","kb deadlift","goblet squat",
  "push up inclinato","lat machine presa neutra","face pull",
  "dead bug","pallof","farmer carry","belt squat","pulley"
];
for (const kw of kws) {
  const {data} = await s.from("exercise_library").select("name,category").ilike("name",`%${kw.replace(/\.\*/g,"%")}%`).order("name").limit(3);
  if (data?.length) console.log(`OK "${kw}": ${data.map(e=>e.name).join(" | ")}`);
  else console.log(`NO "${kw}": NON TROVATO`);
}
