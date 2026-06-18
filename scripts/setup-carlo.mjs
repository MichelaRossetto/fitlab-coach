import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://wltgyvkgevrrgznxtkxc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs"
);

// ── Aggiungi esercizi mancanti ──────────────────────────────────
const { error: libErr } = await supabase.from("exercise_library").insert([
  // Side Plank Pulse
  { name: "Side Plank Pulse", category: "CORE TRAINING", subcategory: "ISOMETRICI",
    unit_min: false, unit_cal: false, unit_rep: true, default_unit: "rep",
    load_pct: false, load_rpe: false, load_kg: false, default_load: null,
    equip_barbell: false, equip_db: false, equip_kb: false, equip_mb: false, equip_sb: false, default_equip: null },
  // Lat Machine (generico)
  { name: "Lat Machine", category: "FORZA", subcategory: "UPPER BODY",
    unit_min: false, unit_cal: false, unit_rep: true, default_unit: "rep",
    load_pct: false, load_rpe: true, load_kg: true, default_load: "kg",
    equip_barbell: false, equip_db: false, equip_kb: false, equip_mb: false, equip_sb: false, default_equip: null },
  { name: "Lat Machine", category: "ACCESSORI", subcategory: "BODYWEIGHT",
    unit_min: false, unit_cal: false, unit_rep: true, default_unit: "rep",
    load_pct: false, load_rpe: true, load_kg: true, default_load: "kg",
    equip_barbell: false, equip_db: false, equip_kb: false, equip_mb: false, equip_sb: false, default_equip: null },
]);
if (libErr) console.error("❌ Libreria:", libErr.message);
else console.log("✅ Side Plank Pulse + Lat Machine aggiunti in libreria");

// ── Verifica struttura Carlo ────────────────────────────────────
const { data: months } = await supabase
  .from("training_months").select("id, label, month_num, year")
  .eq("client_id", "00396972-9cea-4cf9-991d-3c3888512dcc")
  .order("year").order("month_num");

const june = months.find(m => m.month_num === 6 && m.year === 2026);
console.log("\nMese giugno:", june);

const { data: weeks } = await supabase
  .from("training_weeks").select("id, week_number, date_start, date_end")
  .eq("month_id", june.id).order("week_number");
console.log("Settimane:", weeks.map(w => `W${w.week_number}: ${w.date_start} → ${w.date_end}`).join(" | "));

for (const w of weeks) {
  const { data: days } = await supabase
    .from("training_days").select("id, day_number, label")
    .eq("week_id", w.id).order("day_number");
  console.log(`  W${w.week_number}:`, days.map(d => `D${d.day_number}(${d.id.slice(0,8)})`).join(", "));
}
