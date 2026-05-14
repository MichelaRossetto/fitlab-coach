"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { TrainingWeek, TrainingDay } from "@/lib/types";
import { Header } from "@/components/Header";
import { Modal } from "@/components/Modal";

// ─── New Day Form ─────────────────────────────────────────────
function NewDayForm({ weekId, existingCount, onSuccess, onCancel }: {
  weekId: string; existingCount: number; onSuccess: () => void; onCancel: () => void;
}) {
  const [dayNum, setDayNum] = useState(existingCount + 1);
  const [label, setLabel] = useState(`Giorno ${existingCount + 1}`);
  const [dayDate, setDayDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) { setError("Il nome del giorno è obbligatorio"); return; }
    setSaving(true);
    const { error: err } = await supabase.from("training_days").insert({
      week_id: weekId, day_number: dayNum,
      label: label.trim(), day_date: dayDate || null,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Numero giorno</label>
          <select className="input" value={dayNum} onChange={e => {
            const n = Number(e.target.value);
            setDayNum(n);
            setLabel(`Giorno ${n}`);
          }}>
            {[1, 2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n}>Giorno {n}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Data (opz.)</label>
          <input className="input" type="date" value={dayDate} onChange={e => setDayDate(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Etichetta</label>
        <input className="input" value={label} onChange={e => setLabel(e.target.value)} placeholder="es. Day 1 · Lunedì 20" />
      </div>
      <div>
        <label className="label">Note</label>
        <textarea className="input resize-none" rows={2} placeholder="Focus del giorno..." value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" className="btn-secondary flex-1" onClick={onCancel}>Annulla</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? "Creo..." : "Crea giorno"}</button>
      </div>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function WeekPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;
  const monthId = params.monthId as string;
  const weekId = params.weekId as string;

  const [week, setWeek] = useState<TrainingWeek | null>(null);
  const [days, setDays] = useState<TrainingDay[]>([]);
  const [monthLabel, setMonthLabel] = useState("");
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNewDay, setShowNewDay] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const [{ data: w }, { data: d }, { data: m }, { data: c }] = await Promise.all([
      supabase.from("training_weeks").select("*").eq("id", weekId).single(),
      supabase.from("training_days").select("*").eq("week_id", weekId).order("day_number"),
      supabase.from("training_months").select("label").eq("id", monthId).single(),
      supabase.from("clients").select("name, surname").eq("id", clientId).single(),
    ]);
    setWeek(w);
    setDays(d ?? []);
    if (m) setMonthLabel(m.label);
    if (c) setClientName(`${c.name} ${c.surname}`);
    setLoading(false);
  }, [weekId, monthId, clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDeleteWeek = async () => {
    setDeleting(true);
    await supabase.from("training_weeks").delete().eq("id", weekId);
    router.push(`/clienti/${clientId}/${monthId}`);
  };

  const handleDeleteDay = async (dayId: string) => {
    await supabase.from("training_days").delete().eq("id", dayId);
    setDays(prev => prev.filter(d => d.id !== dayId));
  };

  const formatDate = (d: string | null) => d
    ? new Date(d).toLocaleDateString("it-IT", { weekday: "long", day: "2-digit", month: "2-digit" })
    : null;

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header backHref={`/clienti/${clientId}/${monthId}`} title="Caricamento..." />
      <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse space-y-3">
        {[...Array(3)].map((_, i) => <div key={i} className="card h-24 bg-gray-100" />)}
      </div>
    </div>
  );

  if (!week) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">Settimana non trovata</p>
        <Link href={`/clienti/${clientId}/${monthId}`} className="btn-primary">Torna al mese</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        backHref={`/clienti/${clientId}/${monthId}`}
        title={`Settimana ${week.week_number}`}
        subtitle={`${clientName} · ${monthLabel}`}
        right={
          <button onClick={() => setShowNewDay(true)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Giorno
          </button>
        }
      />

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* Week info */}
        {(week.date_start || week.date_end || week.notes) && (
          <div className="card p-4">
            {(week.date_start || week.date_end) && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {week.date_start && <span className="capitalize">{formatDate(week.date_start)}</span>}
                {week.date_start && week.date_end && <span>—</span>}
                {week.date_end && <span className="capitalize">{formatDate(week.date_end)}</span>}
              </div>
            )}
            {week.notes && <p className="text-sm text-gray-500 italic mt-1">{week.notes}</p>}
          </div>
        )}

        {/* Days */}
        <div>
          <p className="section-label">{days.length} session{days.length === 1 ? "e" : "i"}</p>

          {days.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="text-3xl mb-2">⚡</div>
              <p className="text-sm text-gray-500">Nessun giorno ancora.</p>
              <button className="btn-primary mt-3 text-sm" onClick={() => setShowNewDay(true)}>Crea Giorno 1</button>
            </div>
          ) : (
            <div className="space-y-3">
              {days.map(day => (
                <div key={day.id} className="card overflow-hidden">
                  <Link
                    href={`/clienti/${clientId}/${monthId}/${weekId}/${day.id}`}
                    className="flex items-center gap-3.5 p-4 hover:bg-gray-50 transition-colors group dark:hover:bg-gray-700"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: "#111", color: "#D4E600" }}
                    >
                      D{day.day_number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm dark:text-gray-100">{day.label}</div>
                      {day.day_date && (
                        <div className="text-xs text-gray-400 mt-0.5 capitalize">{formatDate(day.day_date)}</div>
                      )}
                      {day.notes && <div className="text-xs text-gray-400 mt-0.5 italic">{day.notes}</div>}
                    </div>
                    <svg className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0"
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </Link>
                  {/* Quick delete row */}
                  <div className="px-4 pb-3 flex justify-end">
                    <button
                      onClick={() => handleDeleteDay(day.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      Elimina giorno
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete week */}
        <div className="pb-4 text-center">
          {!deleteConfirm ? (
            <button
              className="text-xs text-gray-300 hover:text-red-400 transition-colors"
              onClick={() => setDeleteConfirm(true)}
            >
              Elimina settimana
            </button>
          ) : (
            <div className="card p-4 border-red-100 text-center space-y-3">
              <p className="text-sm text-red-500 font-medium">Eliminare la settimana {week.week_number}?</p>
              <p className="text-xs text-gray-400">Questa azione è irreversibile e cancella tutti i giorni e gli allenamenti.</p>
              <div className="flex gap-2">
                <button className="btn-secondary flex-1 text-sm" onClick={() => setDeleteConfirm(false)}>Annulla</button>
                <button className="btn-danger flex-1 text-sm" onClick={handleDeleteWeek} disabled={deleting}>{deleting ? "Eliminando..." : "Sì, elimina"}</button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Modal open={showNewDay} onClose={() => setShowNewDay(false)} title="Nuovo giorno">
        <NewDayForm weekId={weekId} existingCount={days.length}
          onSuccess={() => { setShowNewDay(false); fetch(); }} onCancel={() => setShowNewDay(false)} />
      </Modal>
    </div>
  );
}
