"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { TrainingMonth, TrainingWeek } from "@/lib/types";
import { Header } from "@/components/Header";
import { Modal } from "@/components/Modal";

// ─── New Week Form ────────────────────────────────────────────
function NewWeekForm({ monthId, existingCount, lastWeek, subscriptionEnd, onSuccess, onCancel }: {
  monthId: string; existingCount: number; lastWeek: TrainingWeek | null; subscriptionEnd: string | null; onSuccess: () => void; onCancel: () => void;
}) {
  const [weekNum, setWeekNum] = useState(existingCount + 1);
  const calcNextDates = () => {
    const nextMonday = (from: Date) => {
      const d = new Date(from);
      const day = d.getDay();
      const daysToMonday = day === 1 ? 0 : day === 0 ? 1 : 8 - day;
      d.setDate(d.getDate() + daysToMonday);
      return d;
    };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Candidate 1: giorno dopo l'ultima settimana
    const c1 = lastWeek?.date_end
      ? nextMonday(new Date(new Date(lastWeek.date_end).setDate(new Date(lastWeek.date_end).getDate() + 1)))
      : null;

    // Candidate 2: giorno dopo la scadenza abbonamento
    const c2 = subscriptionEnd
      ? nextMonday(new Date(new Date(subscriptionEnd).setDate(new Date(subscriptionEnd).getDate() + 1)))
      : null;

    // Prendi la data più recente tra i candidati, mai nel passato
    let start = nextMonday(today);
    if (c1 && c1 >= today && c1 > start) start = c1;
    if (c2 && c2 >= today && c2 > start) start = c2;

    const end = new Date(start);
    end.setDate(end.getDate() + 4);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  };
  const next = calcNextDates();
  const [dateStart, setDateStart] = useState(next.start);
  const [dateEnd, setDateEnd] = useState(next.end);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error: err } = await supabase.from("training_weeks").insert({
      month_id: monthId, week_number: weekNum,
      date_start: dateStart || null, date_end: dateEnd || null,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Numero settimana</label>
        <select className="input" value={weekNum} onChange={e => setWeekNum(Number(e.target.value))}>
          {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>Settimana {n}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Dal</label><input className="input" type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} /></div>
        <div><label className="label">Al</label><input className="input" type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} /></div>
      </div>
      <div>
        <label className="label">Note</label>
        <textarea className="input resize-none" rows={2} placeholder="Focus della settimana..." value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" className="btn-secondary flex-1" onClick={onCancel}>Annulla</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? "Creo..." : "Crea settimana"}</button>
      </div>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function MonthPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;
  const monthId = params.monthId as string;

  const [month, setMonth] = useState<TrainingMonth | null>(null);
  const [weeks, setWeeks] = useState<TrainingWeek[]>([]);
  const [lastWeekAny, setLastWeekAny] = useState<TrainingWeek | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [isClientView, setIsClientView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNewWeek, setShowNewWeek] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const [{ data: m }, { data: w }, { data: c }, { data: userData }] = await Promise.all([
      supabase.from("training_months").select("*").eq("id", monthId).single(),
      supabase.from("training_weeks").select("*").eq("month_id", monthId).order("week_number"),
      supabase.from("clients").select("name, surname, subscription_end, email").eq("id", clientId).single(),
      supabase.auth.getUser(),
    ]);
    setMonth(m);
    setWeeks(w ?? []);
    if (c) {
      setClientName(`${c.name} ${c.surname}`);
      setSubscriptionEnd(c.subscription_end ?? null);
      setIsClientView(c.email === userData.user?.email);
    }

    // Ultima settimana con data_end tra tutti i mesi del cliente
    const { data: allWeeks } = await supabase
      .from("training_weeks")
      .select("*, training_months!inner(client_id)")
      .eq("training_months.client_id", clientId)
      .not("date_end", "is", null)
      .order("date_end", { ascending: false })
      .limit(1);
    setLastWeekAny(allWeeks?.[0] ?? null);

    setLoading(false);
  }, [monthId, clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDeleteMonth = async () => {
    setDeleting(true);
    await supabase.from("training_months").delete().eq("id", monthId);
    router.push(`/clienti/${clientId}`);
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }) : "";

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header backHref={`/clienti/${clientId}`} title="Caricamento..." />
      <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse space-y-3">
        {[...Array(3)].map((_, i) => <div key={i} className="card h-20 bg-gray-100" />)}
      </div>
    </div>
  );

  if (!month) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">Mese non trovato</p>
        <Link href={`/clienti/${clientId}`} className="btn-primary">Torna al cliente</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        backHref={`/clienti/${clientId}`}
        title={month.label}
        subtitle={clientName}
        right={!isClientView ? (
          <button onClick={() => setShowNewWeek(true)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Aggiungi
          </button>
        ) : undefined}
      />

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {month.notes && (
          <div className="card p-4 border-l-4" style={{ borderLeftColor: "#D4E600" }}>
            <p className="text-sm text-gray-600 italic dark:text-gray-300">{month.notes}</p>
          </div>
        )}

        {/* Weeks */}
        <div>
          <p className="section-label">{weeks.length} settiman{weeks.length === 1 ? "a" : "e"}</p>

          {weeks.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-sm text-gray-500">Nessuna settimana ancora.</p>
              {!isClientView && <button className="btn-primary mt-3 text-sm" onClick={() => setShowNewWeek(true)}>Crea Settimana 1</button>}
            </div>
          ) : (
            <div className="space-y-3">
              {weeks.map(week => (
                <Link
                  key={week.id}
                  href={`/clienti/${clientId}/${monthId}/${week.id}`}
                  className="card p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group dark:hover:bg-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: "#D4E600", color: "#111" }}
                    >
                      S{week.week_number}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">Settimana {week.week_number}</div>
                      {(week.date_start || week.date_end) && (
                        <div className="text-sm text-gray-400 mt-0.5">
                          {formatDate(week.date_start)} — {formatDate(week.date_end)}
                        </div>
                      )}
                      {week.notes && <div className="text-xs text-gray-400 mt-0.5">{week.notes}</div>}
                    </div>
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

        {/* Delete — solo coach */}
        {!isClientView && <div className="pb-4 text-center">
          {!deleteConfirm ? (
            <button
              className="text-xs text-gray-300 hover:text-red-400 transition-colors"
              onClick={() => setDeleteConfirm(true)}
            >
              Elimina mese
            </button>
          ) : (
            <div className="card p-4 border-red-100 text-center space-y-3">
              <p className="text-sm text-red-500 font-medium">Eliminare {month.label}?</p>
              <p className="text-xs text-gray-400">Questa azione è irreversibile e cancella tutte le settimane e gli allenamenti.</p>
              <div className="flex gap-2">
                <button className="btn-secondary flex-1 text-sm" onClick={() => setDeleteConfirm(false)}>Annulla</button>
                <button className="btn-danger flex-1 text-sm" onClick={handleDeleteMonth} disabled={deleting}>{deleting ? "Eliminando..." : "Sì, elimina"}</button>
              </div>
            </div>
          )}
        </div>}
      </main>

      <Modal open={showNewWeek} onClose={() => setShowNewWeek(false)} title="Nuova settimana">
        <NewWeekForm monthId={monthId} existingCount={weeks.length}
          lastWeek={weeks.length > 0 ? weeks[weeks.length - 1] : lastWeekAny}
          subscriptionEnd={subscriptionEnd}
          onSuccess={() => { setShowNewWeek(false); fetch(); }} onCancel={() => setShowNewWeek(false)} />
      </Modal>
    </div>
  );
}
