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
    <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-[11px] text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

// ─── New Client Form ─────────────────────────────────────────
interface NewClientFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function NewClientForm({ onSuccess, onCancel }: NewClientFormProps) {
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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("clients")
      .select("*")
      .order("surname", { ascending: true });
    setClients(data ?? []);
    setLoading(false);
  }, []);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-black text-2xl tracking-tight leading-none">
              <span style={{ color: "#D4E600" }}>FIT</span>
              <span className="text-gray-900">LAB</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Michela · Coach App</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 btn-primary text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Nuovo cliente
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* Stats */}
        {!loading && clients.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Totali" value={stats.total} color="text-gray-900" />
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
            <div className="card divide-y divide-gray-50">
              {sorted.map(client => (
                <Link
                  key={client.id}
                  href={`/clienti/${client.id}`}
                  className="flex items-center gap-3.5 p-4 hover:bg-gray-50 transition-colors group"
                >
                  {/* Avatar */}
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0
                               font-bold text-sm border-2"
                    style={{
                      borderColor: "#D4E600",
                      backgroundColor: "#f9fce0",
                      color: "#111",
                    }}
                  >
                    {getInitials(client.name, client.surname)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">
                      {client.name} {client.surname}
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
          onSuccess={() => { setShowModal(false); fetchClients(); }}
          onCancel={() => setShowModal(false)}
        />
      </Modal>
    </div>
  );
}
