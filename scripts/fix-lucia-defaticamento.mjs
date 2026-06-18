import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://wltgyvkgevrrgznxtkxc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs"
);

// ── Aggiungi in libreria ────────────────────────────────────────
const { error: libErr } = await supabase.from("exercise_library").insert([
  { name:"Child's Pose", category:"WARMUP", subcategory:"MOBILITÀ",
    unit_min:false,unit_cal:false,unit_rep:true,default_unit:"rep",
    load_pct:false,load_rpe:false,load_kg:false,default_load:null,
    equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
  { name:"Respirazione Diaframmatica", category:"CORE TRAINING", subcategory:"ISOMETRICI",
    unit_min:true,unit_cal:false,unit_rep:false,default_unit:"min",
    load_pct:false,load_rpe:false,load_kg:false,default_load:null,
    equip_barbell:false,equip_db:false,equip_kb:false,equip_mb:false,equip_sb:false,default_equip:null },
]);
if (libErr) console.error("❌ Libreria:", libErr.message);
else console.log("✅ Child's Pose + Respirazione Diaframmatica aggiunti in libreria");

// ── Aggiorna i 4 giorni: sostituisce il defaticamento in CORE ───
const MONTH_ID = "3c843797-a5c5-48b8-b76d-e3e585facd00";
const { data: weeks } = await supabase.from("training_weeks").select("id,week_number").eq("month_id", MONTH_ID).order("week_number");

for (const w of weeks) {
  const { data: days } = await supabase.from("training_days").select("id").eq("week_id", w.id);
  for (const day of days) {
    // Trova la sezione CORE
    const { data: secs } = await supabase.from("workout_sections").select("id").eq("day_id", day.id).eq("section_type", "core").single();
    if (!secs) continue;
    const cid = secs.id;

    // Cancella solo gli esercizi di defaticamento esistenti (order_index >= 3)
    await supabase.from("exercises").delete().eq("section_id", cid).gte("order_index", 3);

    // Reinserisce defaticamento completo
    const { error } = await supabase.from("exercises").insert([
      { section_id: cid, name: "Child's Pose",              sets: "1", reps: "45''",     load: null, rest_time: null, notes: "Defaticamento", order_index: 3 },
      { section_id: cid, name: "Hip Flexor Stretch",        sets: "1", reps: "30''/lato",load: null, rest_time: null, notes: "Affondo statico con stretching psoas", order_index: 4 },
      { section_id: cid, name: "Hamstring Stretch Dinamico",sets: "1", reps: "10+10",    load: null, rest_time: null, notes: "Defaticamento", order_index: 5 },
      { section_id: cid, name: "Respirazione Diaframmatica",sets: null,reps: "1-2 min",  load: null, rest_time: null, notes: "da supina", order_index: 6 },
    ]);
    if (error) console.error(`❌ W${w.week_number}:`, error.message);
    else console.log(`✅ W${w.week_number} defaticamento aggiornato`);
  }
}
