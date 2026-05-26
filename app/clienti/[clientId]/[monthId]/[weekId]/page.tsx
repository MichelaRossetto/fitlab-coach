"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { TrainingWeek, TrainingDay, DAY_TYPES, DAY_STATUS_CONFIG, DayStatus, getDefaultDayLabel } from "@/lib/types";
import { Header } from "@/components/Header";
import { Modal } from "@/components/Modal";

// ─── New Day Form ─────────────────────────────────────────────
function NewDayForm({ weekId, existingCount, onSuccess, onCancel }: {
  weekId: string; existingCount: number; onSuccess: () => void; onCancel: () => void;
}) {
  const [dayNum, setDayNum] = useState(existingCount + 1);
  const [label, setLabel] = useState(getDefaultDayLabel(existingCount + 1, existingCount + 1));
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
            setLabel(getDefaultDayLabel(n, n));
          }}>
            {[1, 2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n}>Day {n}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Data (opz.)</label>
          <input className="input" type="date" value={dayDate} onChange={e => setDayDate(e.target.value)} />
        </div>
      </div>
      {/* Type chips */}
      <div>
        <label className="label">Tipologia</label>
        <div className="flex gap-2">
          {DAY_TYPES.map(type => {
            const active = label.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => setLabel(`Day ${dayNum} · ${type}`)}
                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                style={active
                  ? { backgroundColor: "#D4E600", color: "#111" }
                  : { backgroundColor: "#f3f4f6", color: "#9ca3af" }
                }
              >
                {type.replace(" Body", "")}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="label">Etichetta</label>
        <input className="input" value={label} onChange={e => setLabel(e.target.value)} placeholder="es. Day 1 · Lower Body" />
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
  const [isClientView, setIsClientView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNewDay, setShowNewDay] = useState(false);
  const [showEditDates, setShowEditDates] = useState(false);
  const [editDateStart, setEditDateStart] = useState("");
  const [editDateEnd, setEditDateEnd] = useState("");
  const [savingDates, setSavingDates] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingLabelText, setEditingLabelText] = useState("");
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [scheduledDays, setScheduledDays] = useState<number[]>([]);

  const handleEditDates = async () => {
    setSavingDates(true);
    await supabase.from("training_weeks").update({
      date_start: editDateStart || null,
      date_end: editDateEnd || null,
    }).eq("id", weekId);
    setSavingDates(false);
    setShowEditDates(false);
    fetch();
  };

  const fetch = useCallback(async () => {
    setLoading(true);
    const [{ data: w }, { data: d }, { data: m }, { data: c }, { data: userData }, { data: sched }] = await Promise.all([
      supabase.from("training_weeks").select("*").eq("id", weekId).single(),
      supabase.from("training_days").select("*").eq("week_id", weekId).order("day_number"),
      supabase.from("training_months").select("label").eq("id", monthId).single(),
      supabase.from("clients").select("name, surname, email").eq("id", clientId).single(),
      supabase.auth.getUser(),
      supabase.from("client_schedule").select("day_of_week").eq("client_id", clientId).order("day_of_week"),
    ]);
    setWeek(w);
    setDays(d ?? []);
    if (m) setMonthLabel(m.label);
    if (c) {
      setClientName(`${c.name} ${c.surname}`);
      if (c.email === userData.user?.email) {
        setIsClientView(true);
        document.documentElement.classList.add("dark");
      }
    }
    setScheduledDays(sched?.map((s: any) => s.day_of_week) ?? []);
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
    setDeleteConfirmId(null);
  };

  const handleSetType = async (day: TrainingDay, type: string) => {
    const newLabel = `Day ${day.day_number} · ${type}`;
    await supabase.from("training_days").update({ label: newLabel }).eq("id", day.id);
    setDays(prev => prev.map(d => d.id === day.id ? { ...d, label: newLabel } : d));
    setEditingLabelId(null);
  };

  const handleSetStatus = async (day: TrainingDay, status: DayStatus) => {
    await supabase.from("training_days").update({ status }).eq("id", day.id);
    setDays(prev => prev.map(d => d.id === day.id ? { ...d, status } : d));
  };

  const [dateEditError, setDateEditError] = useState<string | null>(null);

  const handleSetDayDate = async (dayId: string, newDate: string) => {
    await supabase.from("training_days").update({ day_date: newDate || null }).eq("id", dayId);
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, day_date: newDate || null } : d));
    setEditingDateId(null);
    setDateEditError(null);
  };

  const startEditDate = (day: TrainingDay, currentDate: Date | null) => {
    setDateEditError(null);
    // Regola 2 giorni per il cliente
    if (isClientView && currentDate) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((currentDate.getTime() - today.getTime()) / 86400000);
      if (diffDays < 2) {
        setDateEditError(day.id);
        return;
      }
    }
    setEditingDateId(day.id);
  };

  // Calcola la data del giorno dalla data di inizio settimana + giorni abituali del cliente
  const getCalculatedDate = (dayNumber: number): Date | null => {
    if (!week?.date_start || scheduledDays.length === 0) return null;
    if (dayNumber > scheduledDays.length) return null;
    const weekStart = new Date(week.date_start);
    weekStart.setHours(12, 0, 0, 0); // evita problemi di fuso
    const offset = scheduledDays[dayNumber - 1]; // 0=Lun, 2=Mer, 4=Ven...
    const date = new Date(weekStart);
    date.setDate(date.getDate() + offset);
    return date;
  };

  // "done" e "skip" espliciti vincono sempre; "pending" (default DB) lascia decidere le date
  const getEffectiveStatus = (day: TrainingDay): DayStatus => {
    if (day.status === "done" || day.status === "skip") return day.status;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (day.day_date && new Date(day.day_date) < today) return "done";
    if (week?.date_end && new Date(week.date_end) < today) return "done";
    return "pending";
  };

  const formatDate = (d: string | null) => d
    ? new Date(d).toLocaleDateString("it-IT", { weekday: "long", day: "2-digit", month: "2-digit" })
    : null;

  const [showWeekCalendar, setShowWeekCalendar] = useState(false);
  const [printing, setPrinting] = useState(false);

  const handlePrintWeek = async () => {
    if (days.length === 0) return;
    setPrinting(true);

    const sectionOrder = ["warmup", "strength", "accessories", "core", "workout"];
    const sectionLabels: Record<string, string> = {
      warmup: "Warm Up", strength: "Forza", accessories: "Accessori",
      core: "Core Training", workout: "Workout",
    };

    // Fetch sezioni + esercizi per ogni giorno in parallelo
    const allDayData = await Promise.all(days.map(async day => {
      const { data: secs } = await supabase
        .from("workout_sections")
        .select("*, exercises(*)")
        .eq("day_id", day.id)
        .order("order_index");
      return { day, sections: secs ?? [] };
    }));

    const WKLABELS: Record<string, string> = { amrap: "AMRAP", emom: "EMOM", fortime: "FOR TIME", cardioliss: "CARDIO LISS" };

    const exRow = (ex: any) => {
      const parts: string[] = [];
      if (ex.sets && ex.reps) parts.push(`${ex.sets} × ${ex.reps}`);
      else if (ex.reps) parts.push(ex.reps);
      if (ex.load && ex.load !== "-") parts.push(ex.load);
      if (ex.rest_time) parts.push(`⏱ ${ex.rest_time}`);
      const cleanNotes = (ex.notes ?? "").replace(/^#\w+#\s*/, "").replace(/^\[.*?\]\s*/, "").trim();
      return `<tr>
        <td style="padding:5px 10px;font-weight:600;color:#111">${ex.name}</td>
        <td style="padding:5px 10px;color:#444;white-space:nowrap">${parts.join(" · ") || "—"}</td>
        <td style="padding:5px 10px;color:#888;font-size:11px">${cleanNotes}</td>
      </tr>`;
    };

    const workoutBlocksHtml = (s: any) => {
      const subtypes: string[] = (s.section_subtype ?? "").split("+").filter(Boolean);
      const capTimes: string[] = (s.cap_time ?? "").split("+");
      const blockInfo: Record<string, { label: string; cap?: string; rounds?: string }> = {};
      subtypes.forEach((sub: string, i: number) => {
        blockInfo[sub] = { label: WKLABELS[sub] ?? sub.toUpperCase(), cap: capTimes[i] || undefined };
      });
      // Rounds fortime
      (s.exercises ?? []).forEach((ex: any) => {
        const tag = (ex.notes ?? "").match(/^#(\w+)#/)?.[1];
        if (tag === "fortime" && ex.sets && blockInfo["fortime"] && !blockInfo["fortime"].rounds)
          blockInfo["fortime"].rounds = ex.sets;
      });
      // Raggruppa per tag
      const groups: Record<string, any[]> = {};
      const groupOrder: string[] = [];
      (s.exercises ?? []).forEach((ex: any) => {
        const tag = (ex.notes ?? "").match(/^#(\w+)#/)?.[1] ?? "";
        if (!groups[tag]) { groups[tag] = []; groupOrder.push(tag); }
        groups[tag].push(ex);
      });
      return groupOrder.map(tag => {
        const info = blockInfo[tag];
        const parts = [info?.label ?? tag.toUpperCase()];
        if (tag === "fortime") {
          if (info?.rounds) parts.push(`${info.rounds} rounds`);
          if (info?.cap) parts.push(`cap ${info.cap} min`);
        } else {
          if (info?.cap) parts.push(`${info.cap} min`);
        }
        return `<div style="margin-bottom:12px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#EA580C;margin-bottom:4px">${parts.join(" · ")}</div>
          <table style="width:100%;border-collapse:collapse;background:#f9f9f9;border-radius:6px;overflow:hidden">
            <tbody>${groups[tag].map(exRow).join("")}</tbody>
          </table>
        </div>`;
      }).join("");
    };

    const daysHtml = allDayData.map(({ day, sections }) => {
      const filled = sectionOrder
        .map(t => (sections as any[]).find((s: any) => s.section_type === t))
        .filter(s => s && (s.exercises?.length ?? 0) > 0);

      if (filled.length === 0) return "";

      const resolvedDateObj = day.day_date
        ? new Date(day.day_date)
        : getCalculatedDate(day.day_number);
      const resolvedDate = resolvedDateObj
        ? resolvedDateObj.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })
        : null;

      const sectionsHtml = filled.map((s: any) => {
        const isWk = s.section_type === "workout";
        const innerHtml = isWk
          ? workoutBlocksHtml(s)
          : `<table style="width:100%;border-collapse:collapse;background:#f9f9f9;border-radius:6px;overflow:hidden">
              <tbody>${(s.exercises ?? []).map(exRow).join("")}</tbody>
             </table>`;
        return `
        <div style="margin-bottom:16px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#8a9a00;margin-bottom:6px">
            ${sectionLabels[s.section_type] ?? s.section_type}
          </div>
          ${innerHtml}
        </div>`;
      }).join("");

      return `
        <div style="margin-bottom:36px;page-break-inside:avoid">
          <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:12px;border-bottom:2px solid #D4E600;padding-bottom:6px">
            <span style="font-size:18px;font-weight:800;color:#111">${day.label}</span>
            ${resolvedDate ? `<span style="font-size:12px;color:#666;text-transform:capitalize">${resolvedDate}</span>` : ""}
          </div>
          ${sectionsHtml}
        </div>`;
    }).join("");

    const weekRange = week?.date_start
      ? `${formatDate(week.date_start)}${week.date_end ? ` — ${formatDate(week.date_end)}` : ""}`
      : `Settimana ${week?.week_number}`;

    const html = `<!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <title>Settimana ${week?.week_number} — ${clientName}</title>
      <style>
        body { font-family: -apple-system, sans-serif; padding: 32px; color: #111; max-width: 720px; margin: 0 auto; }
        h1 { font-size: 22px; margin: 0 0 4px; }
        p  { font-size: 13px; color: #666; margin: 0 0 28px; text-transform: capitalize; }
        tr:nth-child(even) { background: #efefef; }
        td { border: none; }
        @media print { body { padding: 16px; } }
      </style>
    </head><body>
      <h1>${clientName} · Settimana ${week?.week_number}</h1>
      <p>${weekRange}</p>
      ${daysHtml}
    </body></html>`;

    setPrinting(false);
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 300);
  };

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
        clientView={isClientView}
        right={
          <div className="flex items-center gap-2">
            {days.length > 0 && (
              <button
                onClick={handlePrintWeek}
                disabled={printing}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 disabled:opacity-50"
                title="Stampa / Salva PDF settimana"
              >
                {printing
                  ? <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                      <rect x="6" y="14" width="12" height="8"/>
                    </svg>
                }
              </button>
            )}
            {!isClientView && (
              <button onClick={() => setShowNewDay(true)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                Giorno
              </button>
            )}
          </div>
        }
      />

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* Week info */}
        <div className="card overflow-hidden">
          {/* Header cliccabile */}
          <button
            className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            onClick={() => week.date_start && setShowWeekCalendar(v => !v)}
          >
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {week.date_start
                ? <><span className="capitalize">{formatDate(week.date_start)}</span>{week.date_end && <><span>—</span><span className="capitalize">{formatDate(week.date_end)}</span></>}</>
                : <span className="text-gray-400 dark:text-gray-500">Nessuna data</span>
              }
            </div>
            <div className="flex items-center gap-3">
              {!isClientView && (
                <button
                  onClick={e => { e.stopPropagation(); setEditDateStart(week.date_start ?? ""); setEditDateEnd(week.date_end ?? ""); setShowEditDates(true); }}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline underline-offset-2 transition-colors"
                >
                  modifica
                </button>
              )}
              {week.date_start && (
                <svg
                  className={`text-gray-400 transition-transform duration-200 ${showWeekCalendar ? "rotate-180" : ""}`}
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              )}
            </div>
          </button>

          {/* Mini calendario settimanale */}
          {showWeekCalendar && week.date_start && (() => {
            const startDate = new Date(week.date_start);
            startDate.setHours(12, 0, 0, 0);
            // Genera tutti i giorni da lunedì a venerdì (o domenica se c'è data_end)
            const endDate = week.date_end ? new Date(week.date_end) : new Date(startDate);
            endDate.setHours(12, 0, 0, 0);
            const dayNames = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
            const calDays: Date[] = [];
            const cur = new Date(startDate);
            while (cur <= endDate) {
              calDays.push(new Date(cur));
              cur.setDate(cur.getDate() + 1);
            }
            // Map date → training day
            const dayByDate: Record<string, TrainingDay> = {};
            days.forEach(d => {
              const resolved = d.day_date ? new Date(d.day_date) : getCalculatedDate(d.day_number);
              if (resolved) {
                resolved.setHours(12, 0, 0, 0);
                dayByDate[resolved.toISOString().split("T")[0]] = d;
              }
            });
            const today = new Date(); today.setHours(0, 0, 0, 0);
            return (
              <div className="border-t border-gray-100 dark:border-gray-700/50 px-4 pb-4 pt-3">
                <div className="flex gap-2">
                  {calDays.map(date => {
                    const key = date.toISOString().split("T")[0];
                    const td = dayByDate[key];
                    const isToday = date.getTime() === today.getTime();
                    const dotW = date.getDay() === 0 ? 6 : date.getDay() - 1; // 0=Lun
                    const status = td ? getEffectiveStatus(td) : null;
                    return (
                      <div
                        key={key}
                        className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-colors ${
                          td ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/60" : ""
                        } ${isToday ? "ring-1 ring-inset ring-[#D4E600]" : ""}`}
                        onClick={() => { if (td) router.push(`/clienti/${clientId}/${monthId}/${weekId}/${td.id}`); }}
                      >
                        <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase">{dayNames[dotW]}</span>
                        <span className={`text-sm font-bold ${isToday ? "text-[#D4E600]" : "text-gray-700 dark:text-gray-200"}`}>
                          {date.getDate()}
                        </span>
                        {/* Indicatore */}
                        {td ? (
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                            style={
                              status === "done" ? { backgroundColor: "#22c55e", color: "white" } :
                              status === "skip" ? { backgroundColor: "#fb923c", color: "white" } :
                              { backgroundColor: "#D4E600", color: "#111" }
                            }
                          >
                            {status === "done" ? "✓" : status === "skip" ? "✕" : td.day_number}
                          </div>
                        ) : (
                          <div className="w-5 h-5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {week.notes && <p className="text-sm text-gray-500 italic px-4 pb-4 dark:text-gray-400">{week.notes}</p>}
        </div>

        {/* Days */}
        <div>
          <p className="section-label">{days.length} session{days.length === 1 ? "e" : "i"}</p>

          {days.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="text-3xl mb-2">⚡</div>
              <p className="text-sm text-gray-500">Nessun giorno ancora.</p>
              {!isClientView && <button className="btn-primary mt-3 text-sm" onClick={() => setShowNewDay(true)}>Crea Giorno 1</button>}
            </div>
          ) : (
            <div className="space-y-3">
              {days.map(day => {
                const currentStatus = getEffectiveStatus(day);
                const dayTitle = day.label.split(" · ")[0] || day.label;
                const currentType = DAY_TYPES.find(t => day.label.includes(t)) ?? null;
                const dayUrl = `/clienti/${clientId}/${monthId}/${weekId}/${day.id}`;
                // Data: esplicita nel DB oppure calcolata dagli orari abituali
                const resolvedDate = day.day_date
                  ? new Date(day.day_date)
                  : getCalculatedDate(day.day_number);
                const dateLabel = resolvedDate
                  ? resolvedDate.toLocaleDateString("it-IT", { weekday: "long", day: "2-digit", month: "2-digit" })
                  : null;
                return (
                  <div
                    key={day.id}
                    className="card overflow-hidden cursor-pointer"
                    onClick={() => router.push(dayUrl)}
                  >
                    {/* Main row */}
                    <div className="flex items-center gap-3.5 px-4 pt-4 pb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors"
                        style={
                          currentStatus === "done" ? { backgroundColor: "#22c55e", color: "#fff" } :
                          currentStatus === "skip" ? { backgroundColor: "#fb923c", color: "#fff" } :
                          { backgroundColor: "#111", color: "#D4E600" }
                        }
                      >
                        {currentStatus === "done" ? "✓" : currentStatus === "skip" ? "✕" : `D${day.day_number}`}
                      </div>

                      <div className="flex-1 min-w-0">
                        {editingLabelId === day.id ? (
                          <div onClick={e => e.stopPropagation()}>
                            <div className="text-xs text-gray-400 mb-1.5">Day {day.day_number}</div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {DAY_TYPES.map(type => (
                                <button
                                  key={type}
                                  onClick={e => { e.stopPropagation(); handleSetType(day, type); }}
                                  className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all"
                                  style={day.label.includes(type)
                                    ? { backgroundColor: "#D4E600", color: "#111" }
                                    : { backgroundColor: "#f3f4f6", color: "#6b7280" }
                                  }
                                >
                                  {type}
                                </button>
                              ))}
                              <button
                                onClick={e => { e.stopPropagation(); setEditingLabelId(null); }}
                                className="text-xs text-gray-400 hover:text-gray-500 ml-0.5"
                              >✕</button>
                            </div>
                          </div>
                        ) : (
                          <div className="font-semibold text-gray-900 text-sm dark:text-gray-100 flex items-center gap-1.5">
                            <span>{day.label}</span>
                            {!isClientView && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setEditingLabelId(day.id);
                                  setEditingLabelText(day.label);
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 transition-colors"
                                title="Modifica nome"
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Data giorno — cliccabile per tutti */}
                        {editingDateId === day.id ? (
                          <div onClick={e => e.stopPropagation()} className="mt-1">
                            <input
                              type="date"
                              autoFocus
                              defaultValue={day.day_date ?? resolvedDate?.toISOString().split("T")[0] ?? ""}
                              className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-0.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                              onChange={e => handleSetDayDate(day.id, e.target.value)}
                              onBlur={e => handleSetDayDate(day.id, e.target.value)}
                            />
                          </div>
                        ) : dateEditError === day.id ? (
                          <div onClick={e => e.stopPropagation()} className="mt-1">
                            <p className="text-[10px] text-red-400 leading-tight">
                              Modifica non consentita: sessione tra meno di 2 giorni.
                            </p>
                            <button
                              className="text-[10px] text-gray-400 underline mt-0.5"
                              onClick={e => { e.stopPropagation(); setDateEditError(null); }}
                            >
                              Chiudi
                            </button>
                          </div>
                        ) : (
                          <div
                            className="text-xs text-gray-400 mt-0.5 capitalize cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            onClick={e => { e.stopPropagation(); startEditDate(day, resolvedDate); }}
                            title="Clicca per modificare la data"
                          >
                            {dateLabel ?? <span className="text-gray-300 dark:text-gray-600 italic">+ data</span>}
                          </div>
                        )}
                        {day.notes && (
                          <div className="text-xs text-gray-400 mt-0.5 italic">{day.notes}</div>
                        )}
                      </div>

                      <svg className="text-gray-300 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </div>

                    {/* Bottom row — stopPropagation per non navigare al click sui bottoni */}
                    <div
                      className="border-t border-gray-100 dark:border-gray-700/50 px-4 py-2.5 flex items-center justify-between gap-2"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1.5">
                        {DAY_STATUS_CONFIG.map(cfg => {
                          const isActive = currentStatus === cfg.value;
                          return (
                            <button
                              key={cfg.value}
                              onClick={() => handleSetStatus(day, cfg.value)}
                              className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                              style={isActive
                                ? { backgroundColor: "#D4E600", color: "#111" }
                                : { color: "#d1d5db" }
                              }
                            >
                              {cfg.label}
                            </button>
                          );
                        })}
                      </div>

                      {!isClientView && (
                        deleteConfirmId === day.id ? (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-gray-400">Eliminare?</span>
                            <button onClick={() => setDeleteConfirmId(null)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">No</button>
                            <button onClick={() => handleDeleteDay(day.id)} className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors">Sì</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(day.id)}
                            className="text-xs text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                          >
                            Elimina
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete week — solo coach */}
        {!isClientView && <div className="pb-4 text-center">
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
        </div>}
      </main>

      <Modal open={showEditDates} onClose={() => setShowEditDates(false)} title="Modifica date settimana">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Dal</label><input className="input" type="date" value={editDateStart} onChange={e => setEditDateStart(e.target.value)} /></div>
            <div><label className="label">Al</label><input className="input" type="date" value={editDateEnd} onChange={e => setEditDateEnd(e.target.value)} /></div>
          </div>
          <div className="flex gap-2 pt-1">
            <button className="btn-secondary flex-1" onClick={() => setShowEditDates(false)}>Annulla</button>
            <button className="btn-primary flex-1" onClick={handleEditDates} disabled={savingDates}>{savingDates ? "Salvo..." : "Salva"}</button>
          </div>
        </div>
      </Modal>

      <Modal open={showNewDay} onClose={() => setShowNewDay(false)} title="Nuovo giorno">
        <NewDayForm weekId={weekId} existingCount={days.length}
          onSuccess={() => { setShowNewDay(false); fetch(); }} onCancel={() => setShowNewDay(false)} />
      </Modal>
    </div>
  );
}
