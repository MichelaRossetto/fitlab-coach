import { createClient } from "@supabase/supabase-js";
const s = createClient("https://wltgyvkgevrrgznxtkxc.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs");

const MONTH_ID = "886c70d7-1fb6-4d33-af2d-d1084ba15a39";
const {data:weeks} = await s.from("training_weeks").select("id").eq("month_id",MONTH_ID);
const weekIds = weeks.map(w=>w.id);
const {data:days} = await s.from("training_days").select("id").in("week_id",weekIds);
const dayIds = days.map(d=>d.id);
const {data:secs} = await s.from("workout_sections").select("id").in("day_id",dayIds).eq("section_type","core");
const secIds = secs.map(s=>s.id);

const notePelvic = "Seduta sulla fitball con piedi ben appoggiati a terra e schiena neutra. Da questa posizione: porta lentamente il bacino in retroversione 'chiudendo' leggermente il bacino e appiattendo la zona lombare, poi ritorna in posizione neutra senza forzare. Movimento lento e controllato. Respirazione fluida. Serve per mobilizzare il bacino e scaricare la tensione lombare.";

const noteHipCircle = "Seduta sulla fitball con postura rilassata. Esegui piccoli cerchi con il bacino: 30'' in senso orario, 30'' in senso antiorario. Il movimento deve essere morbido e continuo. Aiuta mobilità del bacino, decompressione lombare e circolazione.";

const noteRocking = "Seduta sulla fitball o in quadrupedia: esegui un dondolamento morbido del bacino avanti-indietro, in modo lento e controllato. Aiuta a scaricare tensione lombare e migliorare la percezione del bacino.";

const {error:e1} = await s.from("exercises").update({notes:notePelvic}).in("section_id",secIds).eq("name","Pelvic Tilt su Fitball");
if(e1) console.error("❌ Pelvic Tilt:", e1.message);
else console.log("✅ Pelvic Tilt su Fitball — nota completa aggiornata");

const {error:e2} = await s.from("exercises").update({notes:noteHipCircle}).in("section_id",secIds).eq("name","Hip Circle");
if(e2) console.error("❌ Hip Circle:", e2.message);
else console.log("✅ Hip Circle (fitball) — nota completa aggiornata");

const {error:e3} = await s.from("exercises").update({notes:noteRocking}).in("section_id",secIds).eq("name","Rocking Bacino Quadrupedia");
if(e3) console.error("❌ Rocking:", e3.message);
else console.log("✅ Rocking Bacino Quadrupedia — nota aggiornata");
