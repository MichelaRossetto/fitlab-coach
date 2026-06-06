# FitLab Coach — Istruzioni per Claude

## Regole generali

- Non modificare mai dati di clienti (date scadenza, orari, dati operativi) senza ok esplicito dell'utente
- Prima di fare push in produzione, mostrare sempre le modifiche in locale e aspettare conferma
- Segnalare sempre le assunzioni fatte prima di procedere con inserimenti o modifiche

### ⚠️ REGOLA CRITICA — Cancellazione dati DB
**NON cancellare MAI nessun dato dal database** senza che l'utente lo abbia richiesto esplicitamente.
Quando una cancellazione è necessaria (es. per reinserire dati corretti), chiedere conferma con questa formula precisa:

> "MI CONFERMI CHE CANCELLIAMO DAL DB [descrizione esatta di cosa viene cancellato, da quale tabella, per quale cliente/settimana/giorno]?"

Aspettare la conferma esplicita prima di procedere. Mai presumere che una cancellazione sia implicita in una richiesta di modifica o reinserimento.

### ⚠️ REGOLA CRITICA — Modifiche alla libreria esercizi
**NON modificare MAI la tabella `exercise_library`** (UPDATE o INSERT) senza chiedere conferma esplicita prima, specificando:

> "MI CONFERMI CHE AGGIORNO IN LIBRERIA [nome esercizio] — cambio [campo] da [valore attuale] a [nuovo valore]?"

Questo vale per qualsiasi modifica: flag load_pct, default_load, categorie, nomi, ecc.

## Inserimento esercizi nel DB

### Regola 1 — Verifica sempre la libreria
Prima di inserire qualsiasi esercizio via script, fare sempre una query alla tabella `exercise_library` per verificare il nome esatto. Non inventare nomi.

### Regola 2 — Peso doppio
Quando la scheda riporta due pesi (es. "16/20 kg"), usare sempre il più alto (es. "20 KB").

### Regola 3 — Note qualitative e istruzioni
Informazioni qualitative che non entrano nei campi strutturati (intensità, variante, istruzioni) vanno salvate nel campo `notes` dell'esercizio.
**Le istruzioni tecniche della coach vanno sempre copiate COMPLETE nel campo notes — mai abbreviare, troncare o riassumere.** Esempi:
- "INCLINE MEDIA INTENSITÀ" → notes
- "BOX ALTO" → notes
- "PESANTI" → notes
- "con fitball", "con elastico" → notes

### Regola 4 — Esercizio con "rack" nel nome
Se il nome contiene la parola "rack" → di default è con bilanciere (barbell), a meno che non sia specificato diversamente.

### Regola 5 — Assunzioni da segnalare
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
