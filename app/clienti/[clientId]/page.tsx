"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Client, TrainingMonth, TrainingWeek, getInitials, MONTH_NAMES,
  DAY_NAMES_SHORT, TIME_SLOTS_MORNING, TIME_SLOTS_AFTERNOON,
} from "@/lib/types";
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
function NewMonthForm({ clientId, existingMonths, lastWeekAny, subscriptionEnd, onSuccess, onCancel }: {
  clientId: string; existingMonths: TrainingMonth[]; lastWeekAny: TrainingWeek | null; subscriptionEnd: string | null; onSuccess: () => void; onCancel: () => void;
}) {
  const now = new Date();
  const nextMonth = (() => {
    if (existingMonths.length === 0) return { year: now.getFullYear(), month: now.getMonth() + 1 };
    const latest = existingMonths.reduce((a, b) =>
      a.year !== b.year ? (a.year > b.year ? a : b) : (a.month_num > b.month_num ? a : b)
    );
    return latest.month_num === 12
      ? { year: latest.year + 1, month: 1 }
      : { year: latest.year, month: latest.month_num + 1 };
  })();

  const calcStartDate = () => {
    const nextMonday = (from: Date) => {
      const d = new Date(from);
      const day = d.getDay();
      const daysToMonday = day === 1 ? 0 : day === 0 ? 1 : 8 - day;
      d.setDate(d.getDate() + daysToMonday);
      return d;
    };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const c1 = lastWeekAny?.date_end
      ? nextMonday(new Date(new Date(lastWeekAny.date_end).setDate(new Date(lastWeekAny.date_end).getDate() + 1)))
      : null;
    const c2 = subscriptionEnd
      ? nextMonday(new Date(new Date(subscriptionEnd).setDate(new Date(subscriptionEnd).getDate() + 1)))
      : null;
    let start = nextMonday(today);
    if (c1 && c1 >= today && c1 > start) start = c1;
    if (c2 && c2 >= today && c2 > start) start = c2;
    return start.toISOString().split("T")[0];
  };

  const [year, setYear] = useState(nextMonth.year);
  const [month, setMonth] = useState(nextMonth.month);
  const [notes, setNotes] = useState("");
  const [weekCount, setWeekCount] = useState(4);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [startDate, setStartDate] = useState(calcStartDate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setStartDate(calcStartDate());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastWeekAny, subscriptionEnd]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const label = `${MONTH_NAMES[month - 1]} ${year}`;
    const { data: newMonth, error: err } = await supabase.from("training_months").insert({
      client_id: clientId, label, year, month_num: month,
      notes: notes.trim() || null,
    }).select().single();
    if (err) { setSaving(false); setError(err.message); return; }

    if (weekCount > 0 && newMonth) {
      const weeksToInsert = [];
      let cur = new Date(startDate);
      for (let i = 0; i < weekCount; i++) {
        const end = new Date(cur);
        end.setDate(end.getDate() + 4);
        weeksToInsert.push({
          month_id: newMonth.id,
          week_number: i + 1,
          date_start: cur.toISOString().split("T")[0],
          date_end: end.toISOString().split("T")[0],
          notes: null,
        });
        cur = new Date(cur);
        cur.setDate(cur.getDate() + 7);
      }
      const { data: createdWeeks } = await supabase.from("training_weeks").insert(weeksToInsert).select();

      if (daysPerWeek > 0 && createdWeeks) {
        const daysToInsert = createdWeeks.flatMap(w =>
          Array.from({ length: daysPerWeek }, (_, j) => ({
            week_id: w.id,
            day_number: j + 1,
            label: `Giorno ${j + 1}`,
            day_date: null,
            notes: null,
          }))
        );
        await supabase.from("training_days").insert(daysToInsert);
      }
    }

    setSaving(false);
    onSuccess();
  };

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1, now.getFullYear() + 2];

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

      {/* Auto-generate weeks */}
      <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="label mb-0 text-gray-700 dark:text-gray-300">Settimane da creare</label>
          <select className="input w-20 text-center" value={weekCount} onChange={e => setWeekCount(Number(e.target.value))}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        {weekCount > 0 && (
          <>
            <div className="flex items-center justify-between">
              <label className="label mb-0 text-gray-700 dark:text-gray-300">Giorni per settimana</label>
              <select className="input w-20 text-center" value={daysPerWeek} onChange={e => setDaysPerWeek(Number(e.target.value))}>
                {[0, 1, 2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="label">A partire dal (lunedì)</label>
              <input className="input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              <p className="text-xs text-gray-400 mt-1.5">
                {weekCount} settiman{weekCount === 1 ? "a" : "e"} lun–ven
                {daysPerWeek > 0 ? ` · ${daysPerWeek} giorn${daysPerWeek === 1 ? "o" : "i"}/sett. · ${weekCount * daysPerWeek} giorni totali` : ""}
              </p>
            </div>
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" className="btn-secondary flex-1" onClick={onCancel}>Annulla</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>
          {saving ? "Creo..." : weekCount > 0
            ? `Crea mese + ${weekCount}sett${daysPerWeek > 0 ? ` + ${daysPerWeek}gg/sett` : ""}`
            : "Crea mese"}
        </button>
      </div>
    </form>
  );
}

// ─── Schedule Section ─────────────────────────────────────────
const DAY_ABBREV = ["L", "M", "M", "G", "V", "S"];

function ScheduleSection({ clientId, isClientView }: { clientId: string; isClientView: boolean }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [schedule, setSchedule] = useState<Record<number, string>>({});
  const [editSchedule, setEditSchedule] = useState<Record<number, string>>({});
  const [loadingS, setLoadingS] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("client_schedule")
        .select("*")
        .eq("client_id", clientId)
        .order("day_of_week");
      if (data && data.length > 0) {
        const map: Record<number, string> = {};
        data.forEach((r: any) => { map[r.day_of_week] = r.time; });
        setSchedule(map);
      } else {
        setSchedule({ 0: "10:00", 2: "10:00", 4: "10:00" });
      }
      setLoadingS(false);
    };
    load();
  }, [clientId]);

  const startEdit = () => { setEditSchedule({ ...schedule }); setEditing(true); };
  const cancelEdit = () => { setEditing(false); };

  const toggleDay = (day: number) =>
    setEditSchedule(prev => {
      if (prev[day] !== undefined) { const n = { ...prev }; delete n[day]; return n; }
      return { ...prev, [day]: "10:00" };
    });

  const setTime = (day: number, time: string) =>
    setEditSchedule(prev => ({ ...prev, [day]: time }));

  const handleSave = async () => {
    setSaving(true);
    await supabase.from("client_schedule").delete().eq("client_id", clientId);
    const rows = Object.entries(editSchedule).map(([day, time]) => ({
      client_id: clientId, day_of_week: Number(day), time,
    }));
    if (rows.length > 0) await supabase.from("client_schedule").insert(rows);
    setSchedule({ ...editSchedule });
    setEditing(false);
    setSaving(false);
  };

  const selectedDays = Object.keys(schedule).map(Number).sort((a, b) => a - b);
  const editDays = Object.keys(editSchedule).map(Number).sort((a, b) => a - b);

  if (loadingS) return null;

  return (
    <div className="card overflow-hidden">
      {/* ── Header ── */}
      <button
        onClick={() => { setOpen(o => !o); if (editing) cancelEdit(); }}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">Orari abituali</span>

        <div className="flex items-center gap-2">
          {/* Pallini giorni — visibili solo da chiuso */}
          {!open && selectedDays.length > 0 && (
            <div className="flex items-center gap-1">
              {selectedDays.map((d, idx) => (
                <span key={d}>
                  <span className="text-xs font-bold" style={{ color: "#8a9a00" }}>{DAY_ABBREV[d]}</span>
                  {idx < selectedDays.length - 1 && <span className="text-gray-300 text-xs mx-0.5">·</span>}
                </span>
              ))}
              <span className="ml-1.5 text-[11px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                {selectedDays.length}x
              </span>
            </div>
          )}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`text-gray-400 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}>
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </button>

      {/* ── Contenuto ── */}
      {open && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          {!editing ? (
            /* Vista lettura */
            <div className="px-4 py-3">
              {selectedDays.length > 0 ? (
                <div className="flex flex-col gap-0">
                  {selectedDays.map((day, idx) => (
                    <div
                      key={day}
                      className={`flex items-center justify-between py-2 ${idx < selectedDays.length - 1 ? "border-b border-gray-50 dark:border-gray-700/50" : ""}`}
                    >
                      <span className="text-sm text-gray-500 dark:text-gray-400">{DAY_NAMES_SHORT[day]}</span>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 tabular-nums">{schedule[day]}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 py-1">Nessun orario impostato</p>
              )}
              {!isClientView && (
                <div className="mt-2 text-right">
                  <button
                    onClick={startEdit}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline underline-offset-2 transition-colors"
                  >
                    modifica orari
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Vista modifica */
            <div className="px-4 py-3 space-y-3">
              {/* Chip giorni */}
              <div className="flex gap-1.5">
                {DAY_NAMES_SHORT.map((name, i) => (
                  <button
                    key={i}
                    onClick={() => toggleDay(i)}
                    className="flex-1 py-1.5 rounded-xl text-xs font-bold transition-all"
                    style={
                      editSchedule[i] !== undefined
                        ? { backgroundColor: "#D4E600", color: "#111" }
                        : { backgroundColor: "#f3f4f6", color: "#9ca3af" }
                    }
                  >
                    {name}
                  </button>
                ))}
              </div>

              {/* Orari */}
              {editDays.length > 0 && (
                <div className="space-y-1.5">
                  {editDays.map(day => (
                    <div key={day} className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-gray-500 w-8">{DAY_NAMES_SHORT[day]}</span>
                      <select
                        className="input text-sm w-24 py-1.5"
                        value={editSchedule[day]}
                        onChange={e => setTime(day, e.target.value)}
                      >
                        <optgroup label="Mattina">
                          {TIME_SLOTS_MORNING.map(t => <option key={t} value={t}>{t}</option>)}
                        </optgroup>
                        <optgroup label="Pomeriggio">
                          {TIME_SLOTS_AFTERNOON.map(t => <option key={t} value={t}>{t}</option>)}
                        </optgroup>
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {/* Azioni */}
              <div className="flex gap-2 pt-1">
                <button onClick={cancelEdit} className="btn-secondary flex-1 text-sm">Annulla</button>
                <button onClick={handleSave} className="btn-primary flex-1 text-sm" disabled={saving}>
                  {saving ? "Salvo..." : "Salva"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function ClientPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;

  const [client, setClient] = useState<Client | null>(null);
  const [months, setMonths] = useState<TrainingMonth[]>([]);
  const [lastWeekAny, setLastWeekAny] = useState<TrainingWeek | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClientView, setIsClientView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showNewMonth, setShowNewMonth] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const [{ data: c }, { data: m }, { data: userData }] = await Promise.all([
      supabase.from("clients").select("*").eq("id", clientId).single(),
      supabase.from("training_months").select("*").eq("client_id", clientId)
        .order("year", { ascending: false }).order("month_num", { ascending: false }),
      supabase.auth.getUser(),
    ]);
    setClient(c);
    setMonths(m ?? []);

    // Se l'utente loggato è il cliente stesso → vista sola lettura
    if (c && userData.user?.email === c.email) {
      setIsClientView(true);
    }

    const { data: allWeeks } = await supabase
      .from("training_weeks")
      .select("*, training_months!inner(client_id)")
      .eq("training_months.client_id", clientId)
      .not("date_end", "is", null)
      .order("date_end", { ascending: false })
      .limit(1);
    setLastWeekAny(allWeeks?.[0] ?? null);

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
        backHref={isClientView ? undefined : "/"}
        title={`${client.name} ${client.surname}`}
        subtitle={isClientView ? "Il tuo piano" : "Profilo cliente"}
        right={
          !isClientView ? (
            <button onClick={() => setShowEdit(true)} className="btn-secondary text-xs py-1.5 px-3">
              Modifica
            </button>
          ) : undefined
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

        {/* Orari abituali */}
        <ScheduleSection clientId={clientId} isClientView={isClientView} />

        {/* Months */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="section-label">Programmi di allenamento</p>
            {!isClientView && (
              <button onClick={() => setShowNewMonth(true)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                Aggiungi mese
              </button>
            )}
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

        {/* Bottone PayPal — solo vista cliente */}
        {isClientView && client.paypal_link && (
          <div className="pb-2">
            <a
              href={client.paypal_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#003087" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.79A.859.859 0 0 1 5.79 2.1h7.373c2.573 0 4.35.565 5.278 1.68.894 1.073.894 2.48.457 4.128-.018.065-.035.13-.054.196C17.976 11.174 16.02 13 12.26 13H9.833a.859.859 0 0 0-.848.722l-.97 6.115a.641.641 0 0 1-.633.54h-.306z"/>
                <path d="M20.995 7.503c-.018.113-.038.228-.06.345-.994 5.105-4.395 6.872-8.737 6.872H9.833a.859.859 0 0 0-.848.722l-1.272 8.057a.641.641 0 0 0 .633.74h4.44a.752.752 0 0 0 .743-.634l.03-.163.588-3.727.038-.205a.752.752 0 0 1 .743-.634h.468c3.03 0 5.403-1.23 6.097-4.79.29-1.487.14-2.728-.626-3.6a2.99 2.99 0 0 0-.855-.983z"/>
              </svg>
              Paga abbonamento con PayPal
            </a>
          </div>
        )}

        {/* Delete — solo per coach */}
        {!isClientView && (
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
        )}
      </main>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Modifica cliente">
        <EditClientForm client={client} onSuccess={() => { setShowEdit(false); fetch(); }} onCancel={() => setShowEdit(false)} />
      </Modal>

      <Modal open={showNewMonth} onClose={() => setShowNewMonth(false)} title="Nuovo mese di allenamento">
        <NewMonthForm clientId={clientId} existingMonths={months}
          lastWeekAny={lastWeekAny} subscriptionEnd={client?.subscription_end ?? null}
          onSuccess={() => { setShowNewMonth(false); fetch(); }} onCancel={() => setShowNewMonth(false)} />
      </Modal>

    </div>
  );
}
