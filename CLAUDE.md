# FitLab Coach — Istruzioni per Claude

## Regole generali

- Non modificare mai dati di clienti (date scadenza, orari, dati operativi) senza ok esplicito dell'utente
- Prima di fare push in produzione, mostrare sempre le modifiche in locale e aspettare conferma
- Segnalare sempre le assunzioni fatte prima di procedere con inserimenti o modifiche

## Inserimento esercizi nel DB

### Regola 1 — Verifica sempre la libreria
Prima di inserire qualsiasi esercizio via script, fare sempre una query alla tabella `exercise_library` per verificare il nome esatto. Non inventare nomi.

### Regola 2 — Peso doppio
Quando la scheda riporta due pesi (es. "16/20 kg"), usare sempre il più alto (es. "20 KB").

### Regola 3 — Note qualitative
Informazioni qualitative che non entrano nei campi strutturati (intensità, variante, istruzioni) vanno salvate nel campo `notes` dell'esercizio. Esempi:
- "INCLINE MEDIA INTENSITÀ" → notes
- "BOX ALTO" → notes
- "PESANTI" → notes
- "con fitball", "con elastico" → notes

### Regola 4 — Esercizio con "rack" nel nome
Se il nome contiene la parola "rack" → di default è con bilanciere (barbell), a meno che non sia specificato diversamente.

### Regola 5 — Tag warmup
- Cardio → `#cardio#`
- Mobilità → `#mob#`
- Attivazione → `#att#`

### Regola 6 — Tag forza
- Lower Body → `#lower#`
- Upper Body → `#upper#`
- Full Body → `#full#`

### Regola 7 — Tag workout
- AMRAP → `#amrap#`
- EMOM → `#emom#`
- For Time → `#fortime#`
- Cardio LISS → `#cardioliss#`

### Regola 8 — Peso con attrezzo
Formato carico: `"20 KB"`, `"12.5 DB"`, `"RPE 7"`, `"80%"` — sempre con il suffisso dell'attrezzo se specificato.

### Regola 9 — Assunzioni da segnalare
Segnalare esplicitamente quando si fa un'assunzione su:
- Quale esercizio usare tra opzioni alternative (es. "Row o SkillMill")
- Quale attrezzo usare se non specificato
- Mappatura nomi non esatti in libreria

## Architettura tecnica

- **Stack**: Next.js 14, TypeScript, Supabase
- **Supabase URL**: `https://wltgyvkgevrrgznxtkxc.supabase.co`
- **Service Role Key**: nel file `scripts/create-client-accounts.mjs`
- **Deploy**: Vercel (auto-deploy da push su `main`)
- **Repo**: `https://github.com/MichelaRossetto/fitlab-coach.git`

## Sistema di carico esercizi

Vedere memory file: `project_load_system.md`

## Esercizi aggiunti manualmente in libreria

- `Affondo Posteriore con Bilanciere Front Rack` — FORZA/LOWER BODY + ACCESSORI/BILANCIERE
- `DB Sumo Squat` — FORZA/LOWER BODY + ACCESSORI/MANUBRI
- `Half Kneeling DB Press` — ACCESSORI/MANUBRI
- `KB Gorilla Row` — ACCESSORI/KETTLEBELL + WORKOUT
- `Affondo Laterale` — ACCESSORI/BODYWEIGHT + WARMUP/MOBILITÀ
- `Star Plank` — CORE TRAINING/ISOMETRICI
- `Bike` — WARMUP/CARDIO + WORKOUT/CARDIO LISS
