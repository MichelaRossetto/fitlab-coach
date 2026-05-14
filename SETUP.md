# 🚀 FitLab Coach App — Guida Setup Completa

## Stack utilizzato
- **Next.js 14** → frontend (React moderno, ottimizzato)
- **Supabase** → database PostgreSQL + API automatica
- **Tailwind CSS** → design moderno e responsive
- **Vercel** → hosting gratuito, deploy automatico

---

## STEP 1 — Installa Node.js

1. Vai su https://nodejs.org
2. Scarica la versione **LTS** (quella consigliata)
3. Installa normalmente (Next, Next, Next...)
4. Riavvia il computer
5. Verifica: apri il Terminale (PowerShell) e scrivi `node --version` → deve mostrare un numero

---

## STEP 2 — Configura Supabase

1. Vai su https://supabase.com e fai login
2. Crea un nuovo progetto (es. "fitlab-coach")
3. Scegli la regione **Europe West** (Frankfurt)
4. Aspetta che il progetto sia pronto (~2 minuti)

### Crea il database:
5. Nel menu a sinistra vai su **SQL Editor**
6. Clicca **New query**
7. Copia tutto il contenuto del file `supabase/schema.sql`
8. Incollalo nell'editor e clicca **Run** (o Ctrl+Enter)
9. Deve apparire "Success" verde

### Copia le credenziali:
10. Vai su **Project Settings** → **API**
11. Copia:
    - **Project URL** (es. `https://xxxx.supabase.co`)
    - **anon public** key (stringa lunga che inizia con `eyJ...`)

---

## STEP 3 — Configura l'app

1. Nella cartella PROJ, copia il file `.env.local.example`
2. Rinominalo in `.env.local`
3. Aprilo con Blocco Note e sostituisci i valori:

```
NEXT_PUBLIC_SUPABASE_URL=https://TUO-PROGETTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJtuoKeyCompleta...
```

---

## STEP 4 — Avvia in locale

Apri PowerShell nella cartella PROJ (Shift + click destro → "Apri finestra PowerShell qui") e scrivi:

```bash
npm install
npm run dev
```

La prima volta `npm install` scarica le dipendenze (~2 minuti).
Poi apri il browser su: **http://localhost:3000**

---

## STEP 5 — Deploy su Vercel

1. Vai su https://github.com e crea un account (se non ce l'hai)
2. Crea un nuovo repository chiamato `fitlab-coach`
3. Carica tutti i file della cartella PROJ su GitHub

   Oppure da PowerShell:
   ```bash
   git init
   git add .
   git commit -m "FitLab Coach App"
   git remote add origin https://github.com/TUO-USERNAME/fitlab-coach.git
   git push -u origin main
   ```

4. Vai su https://vercel.com → **New Project**
5. Importa il repository GitHub `fitlab-coach`
6. Nella sezione **Environment Variables** aggiungi:
   - `NEXT_PUBLIC_SUPABASE_URL` → il tuo URL Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → la tua chiave anon
7. Clicca **Deploy**!

In 2 minuti l'app è online su un link tipo: `https://fitlab-coach.vercel.app`

---

## Struttura del progetto

```
PROJ/
├── app/                          ← Pagine dell'app
│   ├── page.tsx                  ← Dashboard clienti (homepage)
│   └── clienti/
│       └── [clientId]/
│           ├── page.tsx          ← Profilo cliente + mesi
│           └── [monthId]/
│               ├── page.tsx      ← Settimane del mese
│               └── [weekId]/
│                   ├── page.tsx  ← Giorni della settimana
│                   └── [dayId]/
│                       └── page.tsx  ← Scheda allenamento
├── components/                   ← Componenti riutilizzabili
│   ├── Header.tsx
│   ├── StatusBadge.tsx
│   └── Modal.tsx
├── lib/
│   ├── supabase.ts               ← Connessione al database
│   └── types.ts                  ← Tipi TypeScript
├── supabase/
│   └── schema.sql                ← SQL per creare il database
└── .env.local                    ← Credenziali (NON caricare su GitHub!)
```

---

## Database Schema

```
clients
  ├── id, name, surname, email, phone
  ├── subscription_end (data scadenza abbonamento)
  └── notes

training_months (collegato a clients)
  └── label, year, month_num, notes

training_weeks (collegato a training_months)
  └── week_number, date_start, date_end, notes

training_days (collegato a training_weeks)
  └── day_number, label, day_date, notes

workout_sections (collegato a training_days)
  └── section_type: warmup | strength | accessories | workout

exercises (collegato a workout_sections)
  └── name, sets, reps, load, rest_time, notes
```

---

## Funzionalità implementate (MVP)

- [x] Dashboard clienti con ricerca e badge abbonamento
- [x] Aggiunta/modifica/eliminazione clienti
- [x] Struttura gerarchica: Mese → Settimana → Giorno → Workout
- [x] 4 sezioni per ogni allenamento: Warm Up, Forza, Accessori, Workout
- [x] Aggiunta/modifica/eliminazione esercizi (inline, senza ricaricare)
- [x] Campi esercizio: nome, serie, reps, carico, recupero, note
- [x] Design responsive (mobile + desktop)
- [x] Badge scadenza abbonamento (Attivo / In scadenza / Scaduto)

## Prossime funzionalità (future)

- [ ] Login clienti (accesso personalizzato)
- [ ] Upload video esercizi
- [ ] Progress tracking (peso, misure)
- [ ] Notifiche rinnovo abbonamento (email automatica)
- [ ] App mobile (React Native / Expo)
- [ ] Duplica settimana/mese
- [ ] Stampa/esporta scheda PDF
