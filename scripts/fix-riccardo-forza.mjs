import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://wltgyvkgevrrgznxtkxc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs"
);

const DAY_IDS = {
  w1d1: 'c7c8f2dd-f114-477e-aed1-a42738c525f2',
  w1d2: 'ab5fbaf8-e898-4c5a-9f2e-e65748c61ad1',
  w2d1: 'd227217b-1fa4-4663-8bc9-157b0b41fe8a',
  w2d2: '8342b6b1-26ea-4b34-92a6-52c995521213',
  w3d1: '344e76ab-cdf1-457d-839c-c86790045534',
  w3d2: '87a5bfa3-94f4-486d-a962-a358f19a3a52',
  w4d1: 'f8e86af8-bf3c-4aef-a858-126c6faf7162',
  w4d2: 'ab98ca8e-2c49-41ee-8b2c-3b0681737c51',
};

// Trova section IDs strength per ogni giorno
const strengthIds = {};
for (const [key, dayId] of Object.entries(DAY_IDS)) {
  const { data } = await supabase.from("workout_sections").select("id").eq("day_id", dayId).eq("section_type", "strength").single();
  strengthIds[key] = data.id;
}

// Cancella tutti gli esercizi di forza esistenti
await supabase.from("exercises").delete().in("section_id", Object.values(strengthIds));
console.log("✅ Forza cancellata");

const ex = (sid, name, sets, reps, load, rest, notes, idx) =>
  ({ section_id: sid, name, sets, reps, load, rest_time: rest, notes, order_index: idx });

// Helper bench wave con nota solo sull'ultima riga
const bench = (sid, p5, p3, p1, startIdx = 1) => [
  ex(sid, "Bench Press", "1", "5", `${p5}%`, "120 sec", "#upper#", startIdx),
  ex(sid, "Bench Press", "1", "3", `${p3}%`, "120 sec", "#upper#", startIdx + 1),
  ex(sid, "Bench Press", "1", "1", `${p1}%`, "120 sec", `#upper# 5@${p5}% · 3@${p3}% · 1@${p1}% — ONDA × 2`, startIdx + 2),
];

const rows = [

  // ── W1D1: Back Squat + Bench Press ───────────────────────────
  ex(strengthIds.w1d1, "Back Squat", "1", "5", "80%",     "120 sec", "#lower#", 0),
  ex(strengthIds.w1d1, "Back Squat", "3", "5", "72-75%",  "120 sec", "#lower#", 1),
  ...bench(strengthIds.w1d1, 75, 80, 85, 2),

  // ── W1D2: Deadlift + Strict Press ────────────────────────────
  ex(strengthIds.w1d2, "Deadlift", "1", "5", "80%",     "120 sec", "#lower#", 0),
  ex(strengthIds.w1d2, "Deadlift", "3", "5", "72-75%",  "120 sec", "#lower#", 1),
  ex(strengthIds.w1d2, "Strict Press Bilanciere", "5", "5", "75%", "90 sec", "#upper#", 2),

  // ── W2D1: Back Squat + Bench Press ───────────────────────────
  ex(strengthIds.w2d1, "Back Squat", "1", "4", "85%",     "120 sec", "#lower#", 0),
  ex(strengthIds.w2d1, "Back Squat", "4", "4", "77-80%",  "120 sec", "#lower#", 1),
  ...bench(strengthIds.w2d1, 77, 82, 87, 2),

  // ── W2D2: Deadlift + Strict Press ────────────────────────────
  ex(strengthIds.w2d2, "Deadlift", "1", "4", "85%",     "150 sec", "#lower#", 0),
  ex(strengthIds.w2d2, "Deadlift", "4", "4", "77-80%",  "150 sec", "#lower#", 1),
  ex(strengthIds.w2d2, "Strict Press Bilanciere", "5", "4", "80%", "90 sec", "#upper#", 2),

  // ── W3D1: Back Squat + Bench Press ───────────────────────────
  ex(strengthIds.w3d1, "Back Squat", "1", "3", "88-90%",  "150 sec", "#lower#", 0),
  ex(strengthIds.w3d1, "Back Squat", "4", "3", "80-82%",  "150 sec", "#lower#", 1),
  ...bench(strengthIds.w3d1, 80, 85, 90, 2),

  // ── W3D2: Deadlift + Strict Press ────────────────────────────
  ex(strengthIds.w3d2, "Deadlift", "1", "3", "88-90%",  "150 sec", "#lower#", 0),
  ex(strengthIds.w3d2, "Deadlift", "4", "3", "80-82%",  "150 sec", "#lower#", 1),
  ex(strengthIds.w3d2, "Strict Press Bilanciere", "5", "3", "85%", "90 sec", `#upper# Rec 90-120"`, 2),

  // ── W4D1: Back Squat + Bench Press (scarico, un solo gruppo) ─
  ex(strengthIds.w4d1, "Back Squat",  "3", "5", "65-70%", "120 sec", "#lower#", 0),
  ex(strengthIds.w4d1, "Bench Press", "3", "5", "65-70%", "120 sec", "#upper#", 1),

  // ── W4D2: Deadlift + Strict Press (scarico, un solo gruppo) ──
  ex(strengthIds.w4d2, "Deadlift",              "3", "5", "65-70%", "120 sec", "#lower#", 0),
  ex(strengthIds.w4d2, "Strict Press Bilanciere","3", "5", "65-70%", "90 sec",  "#upper#", 1),
];

const { error } = await supabase.from("exercises").insert(rows);
if (error) console.error("❌ ERRORE:", error.message);
else console.log(`✅ Forza aggiornata! (${rows.length} esercizi)`);
