"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Client, TrainingMonth, getInitials, MONTH_NAMES } from "@/lib/types";
import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";

// ─── Edit Client Form ────────────────────────────────────────
function EditClientForm({ client, onSuccess, onCancel }: {
  client: Client; onSuccess: () => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: client.name, surname: client.surname,
    email: client.email ?? "", phone: client.phone ?? "",
    subscription_end: client.subscription_end ?? "",
    notes: client.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.surname.trim()) { setError("Nome e cognome obbligatori"); return; }
    setSaving(true);
    const { error: err } = await supabase.from("clients").update({
      name: form.name.trim(), surname: form.surname.trim(),
      email: form.email.trim() || null, phone: form.phone.trim() || null,
      subscription_end: form.subscription_end || null,
      notes: form.notes.trim() || null,
    }).eq("id", client.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Nome *</label><input className="input" value={form.name} onChange={set("name")} /></div>
        <div><label className="label">Cognome *</label><input className="input" value={form.surname} onChange={set("surname")} /></div>
      </div>
      <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={set("email")} /></div>
      <div><label className="label">Telefono</label><input className="input" type="tel" value={form.phone} onChange={set("phone")} /></div>
      <div><label className="label">Scadenza abbonamento</label><input className="input" type="date" value={form.subscription_end} onChange={set("subscription_end")} /></div>
      <div><label className="label">Note</label><textarea className="input resize-none" rows={2} value={form.notes} onChange={set("notes")} /></div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" className="btn-secondary flex-1" onClick={onCancel}>Annulla</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? "Salvo..." : "Salva modifiche"}</button>
      </div>
    </form>
  );
}

// ─── New Month Form ───────────────────────────────────────────
function NewMonthForm({ clientId, onSuccess, onCancel }: {
  clientId: string; onSuccess: () => void; onCancel: () => void;
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const label = `${MONTH_NAMES[month - 1]} ${year}`;
    const { error: err } = await supabase.from("training_months").insert({
      client_id: clientId, label, year, month_num: month,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSuccess();
  };

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Mese</label>
          <select className="input" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Anno</label>
          <select className="input" value={year} onChange={e => setYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <div><label className="label">Note (opzionale)</label>
        <textarea className="input resize-none" rows={2} placeholder="Obiettivi del mese..." value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" className="btn-secondary flex-1" onClick={onCancel}>Annulla</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? "Creo..." : "Crea mese"}</button>
      </div>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function ClientPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;

  const [client, setClient] = useState<Client | null>(null);
  const [months, setMonths] = useState<TrainingMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showNewMonth, setShowNewMonth] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const [{ data: c }, { data: m }] = await Promise.all([
      supabase.from("clients").select("*").eq("id", clientId).single(),
      supabase.from("training_months").select("*").eq("client_id", clientId)
        .order("year", { ascending: false }).order("month_num", { ascending: false }),
    ]);
    setClient(c);
    setMonths(m ?? []);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async () => {
    setDeleting(true);
    await supabase.from("clients").delete().eq("id", clientId);
    router.push("/");
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header backHref="/" title="Caricamento..." />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="card p-5 h-28 bg-gray-100" />
          <div className="card p-5 h-20 bg-gray-100" />
        </div>
      </div>
    </div>
  );

  if (!client) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">Cliente non trovato</p>
        <Link href="/" className="btn-primary">Torna alla dashboard</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        backHref="/"
        title={`${client.name} ${client.surname}`}
        subtitle="Profilo cliente"
        right={
          <button onClick={() => setShowEdit(true)} className="btn-secondary text-xs py-1.5 px-3">
            Modifica
          </button>
        }
      />

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* Client card */}
        <div className="card p-5">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0
                         font-bold text-lg border-2"
              style={{ borderColor: "#D4E600", backgroundColor: "#f9fce0", color: "#111" }}
            >
              {getInitials(client.name, client.surname)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg text-gray-900 dark:text-gray-100">{client.name} {client.surname}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge subscriptionEnd={client.subscription_end} />
              </div>
              {client.email && (
                <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  {client.email}
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  {client.phone}
                </div>
              )}
              {client.notes && (
                <p className="mt-2 text-sm text-gray-400 italic">{client.notes}</p>
              )}
            </div>
          </div>
        </div>

        {/* Months */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="section-label">Programmi di allenamento</p>
            <button onClick={() => setShowNewMonth(true)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Aggiungi mese
            </button>
          </div>

          {months.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="text-3xl mb-2">📅</div>
              <p className="text-sm text-gray-500">Nessun programma ancora.</p>
              <p className="text-sm text-gray-400 mt-1">Crea il primo mese di allenamento</p>
            </div>
          ) : (
            <div className="space-y-3">
              {months.map(m => (
                <Link
                  key={m.id}
                  href={`/clienti/${clientId}/${m.id}`}
                  className="card p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group dark:hover:bg-gray-700"
                >
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{m.label}</div>
                    {m.notes && <div className="text-sm text-gray-400 mt-0.5">{m.notes}</div>}
                  </div>
                  <svg className="text-gray-300 group-hover:text-gray-500 transition-colors"
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Delete — small and discrete at the bottom */}
        <div className="pb-4 text-center">
          {!deleteConfirm ? (
            <button
              className="text-xs text-gray-300 hover:text-red-400 transition-colors"
              onClick={() => setDeleteConfirm(true)}
            >
              Elimina cliente
            </button>
          ) : (
            <div className="card p-4 border-red-100 text-center space-y-3">
              <p className="text-sm text-red-500 font-medium">Eliminare {client.name} {client.surname}?</p>
              <p className="text-xs text-gray-400">Questa azione è irreversibile e cancella tutti gli allenamenti.</p>
              <div className="flex gap-2">
                <button className="btn-secondary flex-1 text-sm" onClick={() => setDeleteConfirm(false)}>Annulla</button>
                <button className="btn-danger flex-1 text-sm" onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Eliminando..." : "Sì, elimina"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Modifica cliente">
        <EditClientForm client={client} onSuccess={() => { setShowEdit(false); fetch(); }} onCancel={() => setShowEdit(false)} />
      </Modal>

      <Modal open={showNewMonth} onClose={() => setShowNewMonth(false)} title="Nuovo mese di allenamento">
        <NewMonthForm clientId={clientId} onSuccess={() => { setShowNewMonth(false); fetch(); }} onCancel={() => setShowNewMonth(false)} />
      </Modal>

    </div>
  );
}
