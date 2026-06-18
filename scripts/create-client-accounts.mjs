import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wltgyvkgevrrgznxtkxc.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGd5dmtnZXZycmd6bnh0a3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDA2NCwiZXhwIjoyMDk0MjYwMDY0fQ.pUaqBTSJx6wYDbSkjRu4iNd0itTPCS7KW8my4LcPtKs";
const DEFAULT_PASSWORD = "Fitlab2026!";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: clients, error } = await admin
  .from("clients")
  .select("id, name, surname, email")
  .not("email", "is", null);

if (error) { console.error("Errore fetch clienti:", error.message); process.exit(1); }

const withEmail = clients.filter(c => c.email?.trim());
console.log(`\nClienti con email: ${withEmail.length}\n`);

for (const client of withEmail) {
  const email = client.email.trim().toLowerCase();
  const name = `${client.name} ${client.surname}`;

  // Prova a creare l'utente
  const { data, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: DEFAULT_PASSWORD,
    email_confirm: true, // nessuna email di conferma necessaria
  });

  if (createErr) {
    if (createErr.message.includes("already been registered") || createErr.message.includes("already exists")) {
      console.log(`⏭️  ${name} (${email}) — account già esistente`);
    } else {
      console.log(`❌  ${name} (${email}) — errore: ${createErr.message}`);
    }
  } else {
    console.log(`✅  ${name} (${email}) — account creato`);
  }
}

console.log(`\n✨ Done! Password default: ${DEFAULT_PASSWORD}\n`);
