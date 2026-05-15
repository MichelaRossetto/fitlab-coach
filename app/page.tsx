"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Client, getInitials, getSubscriptionStatus, MONTH_NAMES } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";

// ─── Stat card ───────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 text-center dark:bg-gray-800 dark:border-gray-700">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-[11px] text-gray-500 mt-0.5 dark:text-gray-400">{label}</div>
    </div>
  );
}

// ─── New Client Form ─────────────────────────────────────────
interface NewClientFormProps {
  trainerId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function NewClientForm({ trainerId, onSuccess, onCancel }: NewClientFormProps) {
  const [form, setForm] = useState({
    name: "", surname: "", email: "", phone: "",
    subscription_end: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.surname.trim()) {
      setError("Nome e cognome sono obbligatori");
      return;
    }
    setSaving(true);
    setError("");
    const { error: err } = await supabase.from("clients").insert({
      name: form.name.trim(),
      surname: form.surname.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      subscription_end: form.subscription_end || null,
      notes: form.notes.trim() || null,
      trainer_id: trainerId,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSuccess();
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Nome *</label>
          <input className="input" placeholder="es. Diana" value={form.name} onChange={set("name")} />
        </div>
        <div>
          <label className="label">Cognome *</label>
          <input className="input" placeholder="es. Fogoarosi" value={form.surname} onChange={set("surname")} />
        </div>
      </div>
      <div>
        <label className="label">Email</label>
        <input className="input" type="email" placeholder="email@esempio.com" value={form.email} onChange={set("email")} />
      </div>
      <div>
        <label className="label">Telefono</label>
        <input className="input" type="tel" placeholder="+39 333 000 0000" value={form.phone} onChange={set("phone")} />
      </div>
      <div>
        <label className="label">Scadenza abbonamento</label>
        <input className="input" type="date" value={form.subscription_end} onChange={set("subscription_end")} />
      </div>
      <div>
        <label className="label">Note</label>
        <textarea className="input resize-none" rows={2} placeholder="Obiettivi, infortuni, note..." value={form.notes} onChange={set("notes")} />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" className="btn-secondary flex-1" onClick={onCancel}>Annulla</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>
          {saving ? "Salvataggio..." : "Aggiungi cliente"}
        </button>
      </div>
    </form>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [scheduleDays, setScheduleDays] = useState<Record<string, number[]>>({});
  const [trainerId, setTrainerId] = useState<string>("");
  const [trainerEmail, setTrainerEmail] = useState<string>("");

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (user) {
      setTrainerId(user.id);
      setTrainerEmail(user.email ?? "");

      // Se l'utente è un cliente (email presente nella tabella clients), redirect al suo piano
      const { data: clientMatch } = await supabase
        .from("clients")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();
      if (clientMatch) {
        router.replace(`/clienti/${clientMatch.id}`);
        return;
      }
    }
    const [{ data }, { data: schedData }] = await Promise.all([
      supabase.from("clients").select("*").order("surname", { ascending: true }),
      supabase.from("client_schedule").select("client_id, day_of_week").order("day_of_week"),
    ]);
    setClients(data ?? []);
    const days: Record<string, number[]> = {};
    schedData?.forEach((s: any) => {
      if (!days[s.client_id]) days[s.client_id] = [];
      days[s.client_id].push(s.day_of_week);
    });
    setScheduleDays(days);
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const filtered = clients.filter(c =>
    `${c.name} ${c.surname}`.toLowerCase().includes(search.toLowerCase())
  );

  // Sort: expired first, then expiring, then active
  const sorted = [...filtered].sort((a, b) => {
    const order = { expired: 0, expiring: 1, active: 2 };
    return order[getSubscriptionStatus(a.subscription_end)] - order[getSubscriptionStatus(b.subscription_end)];
  });

  const stats = {
    total: clients.length,
    expiring: clients.filter(c => getSubscriptionStatus(c.subscription_end) === "expiring").length,
    expired: clients.filter(c => getSubscriptionStatus(c.subscription_end) === "expired").length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 dark:bg-gray-900 dark:border-gray-700">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-black text-2xl tracking-tight leading-none">
              <span style={{ color: "#C0D738" }}>FIT</span>
              <span className="text-gray-900 dark:text-white">LAB</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">{trainerEmail || "Coach App"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1"
            >
              <svg className="dark:hidden" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
              <svg className="hidden dark:block" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            </button>
            <Link href="/esercizi" className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1" title="Libreria esercizi">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </Link>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-400 transition-colors p-1"
              title="Logout"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 btn-primary text-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Nuovo cliente
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* Stats */}
        {!loading && clients.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Totali" value={stats.total} color="text-gray-900 dark:text-gray-100" />
            <StatCard label="In scadenza" value={stats.expiring} color="text-amber-600" />
            <StatCard label="Scaduti" value={stats.expired} color="text-red-500" />
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="input pl-10"
            placeholder="Cerca cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoComplete="off"
          />
        </div>

        {/* Client list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-4 flex items-center gap-3 animate-pulse">
                <div className="w-11 h-11 rounded-full bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-100 rounded w-40" />
                  <div className="h-3 bg-gray-100 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="card p-10 text-center">
            {search ? (
              <>
                <div className="text-3xl mb-3">🔍</div>
                <p className="text-gray-500">Nessun cliente trovato per &ldquo;{search}&rdquo;</p>
              </>
            ) : (
              <>
                <div className="text-3xl mb-3">👋</div>
                <p className="font-medium text-gray-700 mb-1">Nessun cliente ancora</p>
                <p className="text-sm text-gray-400 mb-4">Aggiungi il tuo primo cliente per iniziare</p>
                <button className="btn-primary mx-auto" onClick={() => setShowModal(true)}>
                  Aggiungi cliente
                </button>
              </>
            )}
          </div>
        ) : (
          <div>
            <p className="section-label">{sorted.length} client{sorted.length === 1 ? "e" : "i"}</p>
            <div className="card divide-y divide-gray-50 dark:divide-gray-700">
              {sorted.map(client => (
                <Link
                  key={client.id}
                  href={`/clienti/${client.id}`}
                  className="flex items-center gap-3.5 p-4 hover:bg-gray-50 transition-colors group dark:hover:bg-gray-700"
                >
                  {/* Avatar */}
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0
                               font-bold text-sm border-2"
                    style={{
                      borderColor: "#C0D738",
                      backgroundColor: "#f9fce0",
                      color: "#111",
                    }}
                  >
                    {getInitials(client.name, client.surname)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm truncate dark:text-gray-100">
                        {client.name} {client.surname}
                      </span>
                      {scheduleDays[client.id]?.length > 0 && (
                        <span className="text-[11px] font-medium flex-shrink-0 flex items-center gap-0.5" style={{ color: "#8a9a00" }}>
                          {scheduleDays[client.id].map((d, i) => (
                            <span key={d}>
                              {["L","M","M","G","V"][d]}
                              {i < scheduleDays[client.id].length - 1 && <span className="text-gray-400 mx-0.5">·</span>}
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                    <div className="mt-1">
                      <StatusBadge subscriptionEnd={client.subscription_end} />
                    </div>
                  </div>

                  {/* Arrow */}
                  <svg className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0"
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* New client modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuovo cliente">
        <NewClientForm
          trainerId={trainerId}
          onSuccess={() => { setShowModal(false); fetchClients(); }}
          onCancel={() => setShowModal(false)}
        />
      </Modal>
    </div>
  );
}
