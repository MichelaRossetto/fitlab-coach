import { createClient } from "@supabase/supabase-js";
const s = createClient("https://wltgyvkgevrrgznxtkxc.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs");

const {data:clients} = await s.from("clients").select("id,name,surname").ilike("name","%viola%").ilike("surname","%vanni%");
console.log("Cliente:", JSON.stringify(clients));
const client = clients?.[0];
if (!client) { console.log("Non trovata"); process.exit(1); }

const {data:months} = await s.from("training_months").select("id,label,month_num,year,notes").eq("client_id",client.id).order("month_num");
for (const m of months||[]) {
  const {data:weeks} = await s.from("training_weeks").select("id,week_number,date_start,date_end").eq("month_id",m.id).order("week_number");
  if (!weeks?.length) continue;
  console.log(`\n${m.label} (${m.id}) notes=${m.notes?"SI":"null"}:`);
  for (const w of weeks) {
    const {data:days} = await s.from("training_days").select("id,day_number").eq("week_id",w.id).order("day_number");
    console.log(`  W${w.week_number} (${w.date_start}→${w.date_end}):`, days?.map(d=>`D${d.day_number}(${d.id.slice(0,8)})`).join(", "));
  }
}

console.log("\n── LIBRERIA ──");
const kws = [
  "deficit reverse lunge","kb pass through","pass through",
  "l sit","l-sit","l sit hold","quadrupedia.*camminat","bear crawl",
  "scorpion","reverse plank","crunch.*fitball","fitball.*crunch",
  "alzate frontali","front raise","db front raise",
  "kb overhead hold","overhead hold",
  "pendlay row","filly press","hamstring curl fitball",
  "hollow rock","hollow hold","stir the pot",
  "side plank.*reach","side plank con reach",
  "front rack.*lunge","db.*front rack",
  "sumo.*deadlift","cable pull through","romanian deadlift",
  "inverted barbell","barbell inverted","bulgarian split",
  "belt squat","pull up.*elastico","chip up assist","chin up",
  "star plank","leg raise","hanging.*leg","hanging.*knee"
];
for (const kw of kws) {
  const {data} = await s.from("exercise_library").select("name,category").ilike("name",`%${kw.replace(/\.\*/g,"%")}%`).order("name").limit(3);
  if (data?.length) console.log(`OK "${kw}": ${data.map(e=>e.name).join(" | ")}`);
  else console.log(`NO "${kw}": NON TROVATO`);
}
