"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Client, TrainingMonth, TrainingWeek, ClientMax, getInitials, MONTH_NAMES,
  DAY_NAMES_SHORT, TIME_SLOTS_MORNING, TIME_SLOTS_AFTERNOON,
  getDefaultDayLabel, PERFORMANCE_EXERCISES,
} from "@/lib/types";
import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";

// ─── Helpers calendario ──────────────────────────────────────
const CAL_DAY_LABELS  = ["Lun", "Mar", "Mer", "Gio", "Ven"];
const CAL_MONTH_SHORT = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
const MORNING_SLOTS   = ["08:00","09:00","10:00","11:00","12:00","13:00"];
const AFTERNOON_SLOTS = ["16:00","17:00","18:00","19:00"];

function getMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
}

function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// ─── Client Calendar Card ─────────────────────────────────────
function ClientCalendarCard({ clientId, scheduleOverride }: {
  clientId: string;
  scheduleOverride?: Record<number, string> | null;
}) {
  const [schedule, setSchedule] = useState<Record<number, string>>({});
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));

  // Fetch iniziale
  useEffect(() => {
    fetch(`/api/client-schedule?client_id=${clientId}`)
      .then(r => r.json())
      .then((data: { day_of_week: number; time: string }[]) => {
        const map: Record<number, string> = {};
        (data ?? []).forEach(r => { map[r.day_of_week] = r.time; });
        setSchedule(map);
      });
  }, [clientId]);

  // Aggiornamento in tempo reale quando la ScheduleSection salva
  useEffect(() => {
    if (scheduleOverride != null) setSchedule(scheduleOverride);
  }, [scheduleOverride]);

  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const isToday = (d: Date) => {
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  };

  const weekLabel = (() => {
    const s = weekDays[0], e = weekDays[4];
    if (s.getMonth() === e.getMonth())
      return `${s.getDate()}–${e.getDate()} ${CAL_MONTH_SHORT[s.getMonth()]} ${s.getFullYear()}`;
    return `${s.getDate()} ${CAL_MONTH_SHORT[s.getMonth()]} – ${e.getDate()} ${CAL_MONTH_SHORT[e.getMonth()]} ${e.getFullYear()}`;
  })();

  // Controlla se il cliente si allena in un determinato slot (±60min)
  const hasTraining = (day: number, slot: string) => {
    const t = schedule[day];
    if (!t) return false;
    const T = timeToMin(t), H = timeToMin(slot);
    return T >= H && T < H + 60;
  };

  const TrainingCell = ({ day, slot }: { day: number; slot: string }) => {
    const active = hasTraining(day, slot);
    return (
      <div className="border-l border-gray-700 flex items-center justify-center min-h-[34px] px-1">
        {active && (
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#C0D738" }} />
            <span className="text-[9px] font-bold tabular-nums" style={{ color: "#C0D738" }}>
              {schedule[day]}
            </span>
          </div>
        )}
      </div>
    );
  };

  const todayMonday = getMonday(new Date());
  const isFuture = weekStart.getTime() > todayMonday.getTime();
  const isPast   = weekStart.getTime() < todayMonday.getTime();
  const prevWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
  const nextWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
  const goToday  = () => setWeekStart(getMonday(new Date()));

  const backBtn = (
    <button onClick={goToday}
      className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-600 text-gray-400 hover:bg-gray-700 transition-colors whitespace-nowrap">
      {isFuture ? "← settimana corrente" : "settimana corrente →"}
    </button>
  );

  const SlotSection = ({ slots, label }: { slots: string[]; label: string }) => (
    <div className={label === "Mattina" ? "border-b border-gray-700" : ""}>
      <div className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide bg-gray-800/50">
        {label}
      </div>
      {slots.map(slot => (
        <div key={slot} className="grid grid-cols-[48px_repeat(5,1fr)] border-b border-gray-700/50 last:border-0">
          <div className="p-2 text-[11px] text-gray-500 flex items-center justify-end pr-3 font-mono">{slot}</div>
          {[0,1,2,3,4].map(day => <TrainingCell key={day} day={day} slot={slot} />)}
        </div>
      ))}
    </div>
  );

  const [open, setOpen] = useState(false);

  return (
    <div className="card overflow-hidden">
      {/* Titolo collassabile */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-700/50 transition-colors"
      >
        <span className="font-semibold text-sm text-gray-200">Calendario</span>
        <svg className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {open && (
        <>
          {/* Header navigazione settimana */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-b border-gray-700 bg-gray-800">
            <div className="flex items-center gap-2 min-w-[110px]">
              <button onClick={prevWeek}
                className="p-1 rounded-lg hover:bg-gray-700 text-gray-400 transition-colors">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              {isFuture && backBtn}
            </div>
            <span className="text-sm font-semibold text-gray-200">{weekLabel}</span>
            <div className="flex items-center gap-2 justify-end min-w-[110px]">
              {isPast && backBtn}
              <button onClick={nextWeek}
                className="p-1 rounded-lg hover:bg-gray-700 text-gray-400 transition-colors">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </div>

          {/* Intestazione giorni */}
          <div className="grid grid-cols-[48px_repeat(5,1fr)] border-b border-gray-700 bg-gray-800">
            <div className="p-2" />
            {weekDays.map((date, i) => (
              <div key={i} className={`p-2 text-center border-l border-gray-700 ${isToday(date) ? "bg-yellow-900/20" : ""}`}>
                <div className="text-[10px] text-gray-400 font-medium">{CAL_DAY_LABELS[i]}</div>
                <div className={`text-sm font-bold mt-0.5 ${isToday(date) ? "text-yellow-400" : "text-gray-200"}`}>
                  {date.getDate()}
                </div>
              </div>
            ))}
          </div>

          <SlotSection slots={MORNING_SLOTS}   label="Mattina" />
          <SlotSection slots={AFTERNOON_SLOTS} label="Pomeriggio" />
        </>
      )}
    </div>
  );
}

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
  const [isPaused, setIsPaused] = useState(!!client.is_paused);
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
      is_paused: isPaused,
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

      {/* Toggle pausa */}
      <div>
        <label className="label">Stato allenamento</label>
        <button type="button" onClick={() => setIsPaused(p => !p)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
            isPaused
              ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
              : "border-gray-200 dark:border-gray-600 bg-transparent"
          }`}>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
            isPaused ? "border-indigo-500 bg-indigo-500" : "border-gray-300"
          }`}>
            {isPaused && <span className="text-white text-[10px] font-bold">✓</span>}
          </div>
          <div className="text-left">
            <p className={`text-sm font-semibold ${isPaused ? "text-indigo-700 dark:text-indigo-300" : "text-gray-600 dark:text-gray-300"}`}>
              {isPaused ? "In pausa" : "Attivo"}
            </p>
            <p className="text-xs text-gray-400">{isPaused ? "Non compare nel calendario" : "Regolare, compare nel calendario"}</p>
          </div>
        </button>
      </div>

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
            label: getDefaultDayLabel(j + 1, daysPerWeek),
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
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        {weekCount > 0 && (
          <>
            <div className="flex items-center justify-between">
              <label className="label mb-0 text-gray-700 dark:text-gray-300">Giorni per settimana</label>
              <select className="input w-20 text-center" value={daysPerWeek} onChange={e => setDaysPerWeek(Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{n}</option>)}
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
const DAY_ABBREV = ["L", "M", "M", "G", "V"];

function ScheduleSection({ clientId, isClientView, onScheduleChange }: {
  clientId: string;
  isClientView: boolean;
  onScheduleChange?: (s: Record<number, string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [schedule, setSchedule] = useState<Record<number, string>>({});
  const [editSchedule, setEditSchedule] = useState<Record<number, string>>({});
  const [loadingS, setLoadingS] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/client-schedule?client_id=${clientId}`);
      const data = await res.json();
      const map: Record<number, string> = {};
      (data ?? []).forEach((r: any) => { map[r.day_of_week] = r.time; });
      setSchedule(map);
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
    const rows = Object.entries(editSchedule).map(([day, time]) => ({
      client_id: clientId, day_of_week: Number(day), time,
    }));
    await fetch("/api/client-schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, rows }),
    });
    const saved = { ...editSchedule };
    setSchedule(saved);
    onScheduleChange?.(saved);
    setEditing(false);
    setOpen(false);
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
              <div className="mt-2 text-right">
                <button
                  onClick={startEdit}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline underline-offset-2 transition-colors"
                >
                  modifica orari
                </button>
              </div>
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

// ─── Performance Section ─────────────────────────────────────
function PerformanceSection({ clientId, isClientView }: { clientId: string; isClientView: boolean }) {
  const [maxes, setMaxes] = useState<Record<string, string>>({});
  const [editMaxes, setEditMaxes] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/client-maxes?client_id=${clientId}`);
      const data = await res.json();
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: ClientMax) => {
        if (r.weight_kg != null) map[r.exercise_name] = String(r.weight_kg);
      });
      setMaxes(map);
      setLoading(false);
    };
    load();
  }, [clientId]);

  const handleSave = async () => {
    setSaving(true);
    const rows = Object.entries(editMaxes)
      .filter(([, v]) => v !== "" && !isNaN(Number(v)))
      .map(([exercise_name, weight_kg]) => ({
        client_id: clientId,
        exercise_name,
        weight_kg: Number(weight_kg),
        recorded_at: new Date().toISOString().split("T")[0],
      }));
    const cleared = Object.entries(editMaxes).filter(([, v]) => v === "").map(([k]) => k);
    await fetch("/api/client-maxes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, rows, cleared }),
    });
    const newMaxes = { ...editMaxes };
    cleared.forEach(k => delete newMaxes[k]);
    setMaxes(newMaxes);
    setEditing(false);
    setSaving(false);
  };

  const setCount = Object.keys(maxes).length;
  const allExercises = Object.values(PERFORMANCE_EXERCISES).flat();

  if (loading) return null;

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => { setOpen(o => !o); if (editing) setEditing(false); }}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">Performance · Massimali</span>
        <div className="flex items-center gap-2">
          {setCount > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              {setCount}/{allExercises.length}
            </span>
          )}
          <svg className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-4 space-y-5">
          {!editing ? (
            <>
              {/* Vista lettura */}
              {Object.entries(PERFORMANCE_EXERCISES).map(([group, exercises]) => (
                <div key={group}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{group}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {exercises.map(ex => (
                      <div key={ex} className={`flex items-center justify-between px-3 py-2 rounded-xl border ${
                        maxes[ex]
                          ? "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                          : "border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                      }`}>
                        <span className={`text-xs font-medium truncate pr-2 ${maxes[ex] ? "text-gray-700 dark:text-gray-200" : "text-gray-400"}`}>{ex}</span>
                        {maxes[ex]
                          ? <span className="text-xs font-bold text-gray-900 dark:text-gray-100 flex-shrink-0">{maxes[ex]} kg</span>
                          : <span className="text-xs text-gray-300 flex-shrink-0">—</span>
                        }
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={() => { setEditMaxes({ ...maxes }); setEditing(true); }}
                className="btn-secondary w-full text-sm">
                Modifica massimali
              </button>
            </>
          ) : (
            <>
              {/* Vista modifica */}
              {Object.entries(PERFORMANCE_EXERCISES).map(([group, exercises]) => (
                <div key={group}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{group}</p>
                  <div className="space-y-2">
                    {exercises.map(ex => (
                      <div key={ex} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 dark:text-gray-300 flex-1 min-w-0 truncate">{ex}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="500"
                            placeholder="—"
                            value={editMaxes[ex] ?? ""}
                            onChange={e => setEditMaxes(p => ({ ...p, [ex]: e.target.value }))}
                            className="input w-20 text-center py-1.5 text-sm"
                          />
                          <span className="text-xs text-gray-400 w-5">kg</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditing(false)} className="btn-secondary flex-1 text-sm">Annulla</button>
                <button onClick={handleSave} className="btn-primary flex-1 text-sm" disabled={saving}>
                  {saving ? "Salvo..." : "Salva"}
                </button>
              </div>
            </>
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
  const [calendarSchedule, setCalendarSchedule] = useState<Record<number, string> | null>(null);
  const [nextWorkout, setNextWorkout] = useState<{ url: string; date: Date; label: string; isToday: boolean } | null>(null);
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

    // Se l'utente loggato è il cliente stesso → vista sola lettura + dark mode forzata
    if (c && userData.user?.email === c.email) {
      setIsClientView(true);
      document.documentElement.classList.add("dark");
    }

    const { data: allWeeks } = await supabase
      .from("training_weeks")
      .select("*, training_months!inner(client_id)")
      .eq("training_months.client_id", clientId)
      .not("date_end", "is", null)
      .order("date_end", { ascending: false })
      .limit(1);
    setLastWeekAny(allWeeks?.[0] ?? null);

    // ─── Trova il prossimo allenamento (oggi o il primo futuro non saltato) ───
    const monthIds = (m ?? []).map(mo => mo.id);
    if (monthIds.length > 0) {
      // Fetch schedule
      const schedRes = await window.fetch(`/api/client-schedule?client_id=${clientId}`);
      const schedData = await schedRes.json();
      const scheduledDays: number[] = (schedData ?? []).map((r: any) => r.day_of_week);

      // Fetch tutte le settimane con i loro giorni
      const { data: weeksData } = await supabase
        .from("training_weeks")
        .select("id, date_start, month_id, training_days(id, day_number, day_date, status, label)")
        .in("month_id", monthIds)
        .not("date_start", "is", null)
        .order("date_start");

      if (weeksData) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        let best: { date: Date; url: string; label: string; isToday: boolean } | null = null;

        for (const week of weeksData as any[]) {
          const weekStart = new Date(week.date_start);
          weekStart.setHours(12, 0, 0, 0);
          const days = [...(week.training_days ?? [])].sort((a: any, b: any) => a.day_number - b.day_number);

          for (const day of days as any[]) {
            if (day.status === "skip") continue;

            let dayDate: Date | null = null;
            if (day.day_date) {
              dayDate = new Date(day.day_date);
              dayDate.setHours(0, 0, 0, 0);
            } else if (scheduledDays.length > 0 && day.day_number <= scheduledDays.length) {
              dayDate = new Date(weekStart);
              dayDate.setDate(dayDate.getDate() + scheduledDays[day.day_number - 1]);
              dayDate.setHours(0, 0, 0, 0);
            }

            if (!dayDate || dayDate < today) continue;

            if (!best || dayDate < best.date) {
              best = {
                date: dayDate,
                url: `/clienti/${clientId}/${week.month_id}/${week.id}/${day.id}`,
                label: day.label,
                isToday: dayDate.getTime() === today.getTime(),
              };
            }
          }
        }
        setNextWorkout(best);
      }
    }

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
        clientView={isClientView}
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

        {/* ─── Bottone allenamento del giorno ─── */}
        {nextWorkout && (() => {
          const dateLabel = nextWorkout.date.toLocaleDateString("it-IT", {
            weekday: "long", day: "numeric", month: "long",
          });
          return (
            <button
              onClick={() => router.push(nextWorkout.url)}
              className="w-full rounded-2xl overflow-hidden transition-all active:scale-[0.98] shadow-sm hover:shadow-md group"
              style={{ backgroundColor: "#D4E600" }}
            >
              <div className="flex items-center gap-4 px-5 py-4">
                {/* Icona */}
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(0,0,0,0.12)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                </div>
                {/* Testi */}
                <div className="flex-1 text-left min-w-0">
                  <div className="font-bold text-base text-gray-900 leading-tight">
                    {nextWorkout.isToday ? "Allenamento di oggi" : "Prossimo allenamento"}
                  </div>
                  <div className="text-sm font-medium text-gray-700 mt-0.5 capitalize truncate">
                    {nextWorkout.label} · {dateLabel}
                  </div>
                </div>
                {/* Freccia */}
                <svg className="flex-shrink-0 text-gray-700 group-hover:translate-x-0.5 transition-transform"
                  width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </button>
          );
        })()}

        {/* Orari abituali */}
        <ScheduleSection clientId={clientId} isClientView={isClientView} onScheduleChange={setCalendarSchedule} />
        {isClientView && <ClientCalendarCard clientId={clientId} scheduleOverride={calendarSchedule} />}

        {/* Performance / Massimali */}
        <PerformanceSection clientId={clientId} isClientView={isClientView} />

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
