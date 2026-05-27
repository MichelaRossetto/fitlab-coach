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
function ClientCalendarCard({ clientId, scheduleOverride, coachView }: {
  clientId: string;
  scheduleOverride?: Record<number, string> | null;
  coachView?: boolean;
}) {
  const [schedule, setSchedule] = useState<Record<number, string>>({});
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [open, setOpen] = useState(false);
  // Coach: lista sessioni per editing date
  const [sessionList, setSessionList] = useState<{ dayId: string; dayNumber: number; weekId: string; label: string; dateStr: string | null; dayTime: string | null; weekLabel: string; weekDateStart: string | null }[]>([]);
  const [showEditSessions, setShowEditSessions] = useState(false);
  const [reschedulingDayId, setReschedulingDayId] = useState<string | null>(null);
  const [reschedulingDow, setReschedulingDow] = useState<number | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [allSlotCounts, setAllSlotCounts] = useState<Record<string, number>>({});
  const [rescheduleSaving, setRescheduleSaving] = useState(false);

  // Fetch schedule
  useEffect(() => {
    fetch(`/api/client-schedule?client_id=${clientId}`)
      .then(r => r.json())
      .then((data: { day_of_week: number; time: string }[]) => {
        const map: Record<number, string> = {};
        (data ?? []).forEach(r => { map[r.day_of_week] = r.time; });
        setSchedule(map);
      });
  }, [clientId]);

  useEffect(() => {
    if (scheduleOverride != null) setSchedule(scheduleOverride);
  }, [scheduleOverride]);

  // Fetch lista sessioni per editing (coach + client)
  const loadSessionList = useCallback(async () => {
    const schedDays = Object.keys(schedule).map(Number).sort((a: number, b: number) => a - b);

    // Step 1: prendi tutte le settimane del cliente (via training_months)
    const { data: weeks, error: weeksErr } = await supabase
      .from("training_weeks")
      .select("id, date_start, week_number, month_id, training_months!inner(client_id, label)")
      .eq("training_months.client_id", clientId);

    if (weeksErr || !weeks || weeks.length === 0) return;

    // Step 2: prendi tutti i training_days di quelle settimane
    const weekIds = (weeks as any[]).map((w: any) => w.id);
    const { data: days, error: daysErr } = await supabase
      .from("training_days")
      .select("id, day_number, day_date, day_time, label, status, week_id")
      .in("week_id", weekIds)
      .order("day_number");

    if (daysErr || !days) return;

    // Mappa weekId → info settimana
    const weekMap: Record<string, any> = {};
    for (const w of weeks as any[]) weekMap[w.id] = w;

    const list: { dayId: string; dayNumber: number; weekId: string; label: string; dateStr: string | null; dayTime: string | null; weekLabel: string; weekDateStart: string | null }[] = [];
    for (const day of days as any[]) {
      const week = weekMap[day.week_id];
      if (!week) continue;
      const monthLabel = (week["training_months"] as any)?.label ?? "";

      let dateStr: string | null = day.day_date ?? null;
      if (!dateStr && week.date_start && schedDays.length > 0 && day.day_number <= schedDays.length) {
        const ws = new Date(week.date_start); ws.setHours(12, 0, 0, 0);
        ws.setDate(ws.getDate() + schedDays[day.day_number - 1]);
        dateStr = ws.toISOString().split("T")[0];
      }
      list.push({
        dayId: day.id,
        dayNumber: day.day_number,
        weekId: day.week_id,
        label: day.label,
        dateStr,
        dayTime: day.day_time ? day.day_time.slice(0, 5) : null,
        weekLabel: `${monthLabel} · Sett. ${week.week_number}`,
        weekDateStart: week.date_start ?? null,
      });
    }

    list.sort((a, b) => {
      if (!a.dateStr && !b.dateStr) return 0;
      if (!a.dateStr) return 1;
      if (!b.dateStr) return -1;
      return a.dateStr.localeCompare(b.dateStr);
    });
    setSessionList(list);
  }, [coachView, clientId, schedule]);

  useEffect(() => {
    if (open) loadSessionList();
  }, [open, loadSessionList]);

  const checkRescheduleSlot = async (newDate: string) => {
    setRescheduleDate(newDate);
    setRescheduleTime("");
    setAllSlotCounts({});
    if (!newDate) return;
    const res = await window.fetch(`/api/slot-availability?exclude_client=${clientId}`);
    const counts: Record<string, number> = await res.json();
    // DEBUG — rimuovere dopo
    const d = new Date(newDate + "T12:00:00");
    const jsDay = d.getDay();
    const ourDow = jsDay === 0 ? 6 : jsDay - 1;
    console.log("Date:", newDate, "jsDay:", jsDay, "ourDow:", ourDow);
    console.log("AllCounts:", counts);
    console.log("Key 18:00:", `${ourDow}:18:00`, "→", counts[`${ourDow}:18:00`]);
    setAllSlotCounts(counts);
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) return;
    setRescheduleSaving(true);

    let targetDayId: string | null = (reschedulingDayId && !reschedulingDayId.startsWith("virtual-"))
      ? reschedulingDayId
      : null;

    // Sessione virtuale (no training_day trovato per data): cerca per week + day_number
    if (!targetDayId && reschedulingDow !== null) {
      const schedDows = Object.keys(schedule).map(Number).sort((a: number, b: number) => a - b);
      const dayNum = schedDows.indexOf(reschedulingDow) + 1;
      const ws = localDateStr(weekDays[0]);
      const we = localDateStr(weekDays[4]);

      // 1. Cerca in sessionList per weekDateStart + day_number
      const match = sessionList.find(s =>
        s.weekDateStart && s.weekDateStart >= ws && s.weekDateStart <= we && s.dayNumber === dayNum
      );
      targetDayId = match?.dayId ?? null;

      // 2. Fallback: query diretta al DB
      if (!targetDayId) {
        const weekIdsRaw = sessionList.filter(s => s.weekDateStart && s.weekDateStart >= ws && s.weekDateStart <= we).map(s => s.weekId);
        const weekIds = weekIdsRaw.filter((id, i) => weekIdsRaw.indexOf(id) === i);
        if (weekIds.length > 0) {
          const { data } = await supabase.from("training_days").select("id").in("week_id", weekIds).eq("day_number", dayNum).maybeSingle();
          targetDayId = data?.id ?? null;
        }
      }
    }

    if (!targetDayId) {
      setRescheduleSaving(false);
      return;
    }

    await supabase.from("training_days").update({ day_date: rescheduleDate, day_time: rescheduleTime }).eq("id", targetDayId);
    resetReschedule();
    setShowEditSessions(false);
    await loadSessionList();
    setRescheduleSaving(false);
  };

  const cancelReschedule = () => { setReschedulingDayId(null); setReschedulingDow(null); setRescheduleDate(""); setRescheduleTime(""); setAllSlotCounts({}); };

  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return d;
  });

  const localDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

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

  const hasTraining = (day: number, slot: string) => {
    const t = schedule[day]; if (!t) return false;
    const T = timeToMin(t), H = timeToMin(slot);
    return T >= H && T < H + 60;
  };

  const TrainingCell = ({ day, slot }: { day: number; slot: string }) => {
    const thisDayDate = localDateStr(weekDays[day]);
    const ws = localDateStr(weekDays[0]);
    const we = localDateStr(weekDays[4]);
    const weekHasSessions = sessionList.some(s => s.dateStr && s.dateStr >= ws && s.dateStr <= we);

    // Sessione effettiva su questo giorno (può avere dayTime override)
    const sessionOnDay = sessionList.find(s => s.dateStr === thisDayDate);
    const hasSessionOnThisDay = !!sessionOnDay;

    // Se la sessione ha un dayTime esplicito, usa quello per decidere quale slot mostrare
    const overrideTime = sessionOnDay?.dayTime ?? null;
    const T = overrideTime ? timeToMin(overrideTime) : null;
    const H = timeToMin(slot);
    const isOverrideSlot = T !== null && T < H + 60 && T + 60 > H;

    // Dot ricorrente: mostra se non c'è override oppure se l'override coincide con il ricorrente
    const recurringActive = hasTraining(day, slot);
    const showRecurring = recurringActive && (!weekHasSessions || (hasSessionOnThisDay && (overrideTime === null || isOverrideSlot)));

    // Dot indaco: sessione spostata su giorno non ricorrente, oppure stessa giorno con orario diverso
    const showMoved = hasSessionOnThisDay && !recurringActive && isOverrideSlot;
    // Caso: stesso giorno ricorrente ma orario cambiato
    const showMovedSameDay = hasSessionOnThisDay && recurringActive && overrideTime !== null && !hasTraining(day, slot) && isOverrideSlot;

    const showDot = showMoved || showMovedSameDay;
    const dotTime = overrideTime ?? schedule[day];

    return (
      <div className="border-l border-gray-700 flex items-center justify-center min-h-[34px] px-1">
        {showRecurring && (
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#C0D738" }} />
            <span className="text-[9px] font-bold tabular-nums" style={{ color: "#C0D738" }}>{dotTime}</span>
          </div>
        )}
        {showDot && (
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-2 h-2 rounded-full bg-indigo-400" />
            <span className="text-[9px] font-bold text-indigo-400">{overrideTime}</span>
          </div>
        )}
      </div>
    );
  };

  const todayMonday = getMonday(new Date());
  const isFuture = weekStart.getTime() > todayMonday.getTime();
  const isPast   = weekStart.getTime() < todayMonday.getTime();
  const resetReschedule = () => { setReschedulingDayId(null); setReschedulingDow(null); setRescheduleDate(""); setRescheduleTime(""); setAllSlotCounts({}); };
  const prevWeek = () => { resetReschedule(); setShowEditSessions(false); setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; }); };
  const nextWeek = () => { resetReschedule(); setShowEditSessions(false); setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; }); };
  const goToday  = () => { resetReschedule(); setShowEditSessions(false); setWeekStart(getMonday(new Date())); };

  const backBtn = (
    <button onClick={goToday}
      className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-600 text-gray-400 hover:bg-gray-700 transition-colors whitespace-nowrap">
      {isFuture ? "← settimana corrente" : "settimana corrente →"}
    </button>
  );

  const SlotSection = ({ slots, label }: { slots: string[]; label: string }) => (
    <div className={label === "Mattina" ? "border-b border-gray-700" : ""}>
      <div className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide bg-gray-800/50">{label}</div>
      {slots.map(slot => (
        <div key={slot} className="grid grid-cols-[48px_repeat(5,1fr)] border-b border-gray-700/50 last:border-0">
          <div className="p-2 text-[11px] text-gray-500 flex items-center justify-end pr-3 font-mono">{slot}</div>
          {[0,1,2,3,4].map(day => <TrainingCell key={day} day={day} slot={slot} />)}
        </div>
      ))}
    </div>
  );

  return (
    <div className="card overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-700/50 transition-colors">
        <span className="font-semibold text-sm text-gray-200">Calendario</span>
        <svg className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {open && (
        <>
          <div className="flex items-center justify-between px-3 py-2 border-t border-b border-gray-700 bg-gray-800">
            <div className="flex items-center gap-2 min-w-[110px]">
              <button onClick={prevWeek} className="p-1 rounded-lg hover:bg-gray-700 text-gray-400 transition-colors">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              {isFuture && backBtn}
            </div>
            <span className="text-sm font-semibold text-gray-200">{weekLabel}</span>
            <div className="flex items-center gap-2 justify-end min-w-[110px]">
              {isPast && backBtn}
              <button onClick={nextWeek} className="p-1 rounded-lg hover:bg-gray-700 text-gray-400 transition-colors">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </div>

          {/* Bottone modifica orari + pannello sessioni settimana corrente */}
          <div className="border-t border-gray-700">
            <button
              onClick={() => { setShowEditSessions(s => !s); resetReschedule(); }}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-700/40 transition-colors"
            >
              <div className="flex items-center gap-2 text-[11px] font-medium text-gray-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Modifica orari settimana
              </div>
              <svg className={`text-gray-500 transition-transform ${showEditSessions ? "rotate-180" : ""}`}
                width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>

            {showEditSessions && (() => {
              const ws = localDateStr(weekDays[0]);
              const we = localDateStr(weekDays[4]);
              const schedDows = Object.keys(schedule).map(Number).sort((a, b) => a - b).filter(d => d >= 0 && d <= 4);

              // Costruisci lista sempre dall'orario ricorrente, con lookup flessibile del training_day
              type DisplaySession = { key: string; dow: number; dayNum: number; dateStr: string; dayId: string | null; label: string; dayTime: string | null };
              const recurringDisplay: DisplaySession[] = schedDows.map((dow, idx) => {
                const dayNum = idx + 1;
                const dateStr = localDateStr(weekDays[dow]);

                // Lookup 1: match diretto per day_date
                let actual = sessionList.find(s => s.dateStr === dateStr);
                // Lookup 2: match per weekDateStart + day_number (sessioni senza day_date)
                if (!actual) actual = sessionList.find(s =>
                  s.weekDateStart && s.weekDateStart >= ws && s.weekDateStart <= we && s.dayNumber === dayNum
                );
                return { key: `dow-${dow}`, dow, dayNum, dateStr, dayId: actual?.dayId ?? null, label: actual?.label ?? `${CAL_DAY_LABELS[dow]}`, dayTime: actual?.dayTime ?? null };
              });

              // Sessioni spostate IN questa settimana da fuori (dateStr in range, dow non ricorrente)
              const movedIn: DisplaySession[] = sessionList
                .filter(s => {
                  if (!s.dateStr || s.dateStr < ws || s.dateStr > we) return false;
                  const jsD = new Date(s.dateStr + "T12:00:00").getDay();
                  const ourDow = jsD === 0 ? 6 : jsD - 1;
                  return !schedDows.includes(ourDow);
                })
                .map(s => {
                  const jsD = new Date(s.dateStr! + "T12:00:00").getDay();
                  const ourDow = jsD === 0 ? 6 : jsD - 1;
                  return { key: s.dayId, dow: ourDow, dayNum: s.dayNumber, dateStr: s.dateStr!, dayId: s.dayId, label: s.label, dayTime: s.dayTime };
                });

              const weekSessions = [...recurringDisplay, ...movedIn].sort((a, b) => a.dateStr.localeCompare(b.dateStr));
              const today = new Date(); today.setHours(0, 0, 0, 0);

              return (
                <div className="border-t border-gray-700/50">
                  {weekSessions.length === 0 ? (
                    <div className="px-3 py-3 text-[11px] text-gray-500 italic text-center">
                      Nessun allenamento in questa settimana
                    </div>
                  ) : weekSessions.map(session => {
                    const sessionDate = new Date(session.dateStr + "T12:00:00");
                    const diffDays = Math.floor((sessionDate.getTime() - today.getTime()) / 86400000);
                    const clientBlocked = !coachView && diffDays < 2;
                    const isRescheduling = !!reschedulingDayId && (reschedulingDayId === session.dayId || reschedulingDayId === `virtual-${session.dow}`);

                    return (
                      <div key={session.key} className="border-b border-gray-700/50 last:border-0">
                        {/* Riga principale */}
                        <div className="flex items-center justify-between px-3 py-2.5 gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-gray-200 truncate">{session.label}</div>
                            <div className="text-[10px] text-gray-500">
                              {new Date(session.dateStr + "T12:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "2-digit", month: "2-digit" })}
                            </div>
                          </div>
                          {clientBlocked ? (
                            <span className="text-[10px] text-gray-600 italic shrink-0">entro 2 giorni</span>
                          ) : isRescheduling ? (
                            <button onClick={cancelReschedule} className="text-[10px] text-gray-500 hover:text-gray-300 shrink-0">Annulla</button>
                          ) : (
                            <button
                              onClick={() => {
                                // Se abbiamo un dayId reale, usalo; altrimenti marca come virtual
                                if (session.dayId) {
                                  setReschedulingDayId(session.dayId);
                                  setReschedulingDow(null);
                                } else {
                                  setReschedulingDayId(`virtual-${session.dow}`);
                                  setReschedulingDow(session.dow);
                                }
                                checkRescheduleSlot(session.dateStr);
                              }}
                              className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors shrink-0"
                            >
                              Sposta
                            </button>
                          )}
                        </div>

                        {/* Pannello spostamento */}
                        {isRescheduling && (() => {
                          const newJsDay = rescheduleDate ? new Date(rescheduleDate + "T12:00:00").getDay() : null;
                          const newOurDow = newJsDay !== null ? (newJsDay === 0 ? 6 : newJsDay - 1) : null;
                          const MAX_SLOTS = 5;
                          const allSlots = [...MORNING_SLOTS, ...AFTERNOON_SLOTS];
                          const slotsFull = rescheduleTime
                            ? (allSlotCounts[`${newOurDow}:${rescheduleTime}`] ?? 0) >= MAX_SLOTS && !coachView
                            : false;
                          return (
                            <div className="px-3 pb-3 space-y-3">
                              <div>
                                <label className="text-[10px] text-gray-400 block mb-1">Nuova data</label>
                                <input
                                  type="date"
                                  autoFocus
                                  value={rescheduleDate}
                                  min={coachView ? undefined : localDateStr((() => { const d = new Date(); d.setDate(d.getDate() + 2); return d; })())}
                                  className="w-full text-xs border border-gray-600 rounded-lg px-2 py-1.5 bg-gray-900 text-gray-200"
                                  onChange={e => checkRescheduleSlot(e.target.value)}
                                />
                              </div>

                              {rescheduleDate && newOurDow !== null && (
                                <div>
                                  <label className="text-[10px] text-gray-400 block mb-1.5">Scegli orario</label>
                                  <div className="grid grid-cols-4 gap-1">
                                    {allSlots.map(slot => {
                                      const count = allSlotCounts[`${newOurDow}:${slot}`] ?? 0;
                                      const full = count >= MAX_SLOTS;
                                      const selected = rescheduleTime === slot;
                                      const blocked = full && !coachView;
                                      return (
                                        <button
                                          key={slot}
                                          disabled={blocked}
                                          onClick={() => setRescheduleTime(selected ? "" : slot)}
                                          className="relative py-1.5 rounded-lg text-[10px] font-bold transition-all"
                                          style={selected
                                            ? { backgroundColor: "#D4E600", color: "#111" }
                                            : blocked
                                              ? { backgroundColor: "#1f2937", color: "#4b5563" }
                                              : { backgroundColor: "#374151", color: full ? "#f87171" : count >= MAX_SLOTS - 1 ? "#fb923c" : "#d1d5db" }
                                          }
                                        >
                                          {slot}
                                          <span className="block text-[8px] opacity-70">{count}/{MAX_SLOTS}</span>
                                          {full && coachView && (
                                            <span className="absolute -top-1 -right-1 text-[7px] bg-red-500 text-white rounded-full px-0.5">!</span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              <button
                                onClick={handleConfirmReschedule}
                                disabled={!rescheduleDate || !rescheduleTime || rescheduleSaving || slotsFull}
                                className="w-full py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                                style={{ backgroundColor: "#D4E600", color: "#111" }}
                              >
                                {rescheduleSaving ? "Salvo..." : "Conferma spostamento"}
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Intestazione giorni */}
          <div className="grid grid-cols-[48px_repeat(5,1fr)] border-b border-gray-700 bg-gray-800">
            <div className="p-2" />
            {weekDays.map((date, i) => {
              const ds = localDateStr(date);
              const hasMoved = sessionList.some(s => s.dateStr === ds && !schedule[i]);
              const hasSession = sessionList.some(s => s.dateStr === ds);
              return (
                <div key={i} className={`border-l border-gray-700 text-center p-2 ${isToday(date) ? "bg-yellow-900/20" : ""}`}>
                  <div className="text-[10px] text-gray-400 font-medium">{CAL_DAY_LABELS[i]}</div>
                  <div className={`text-sm font-bold mt-0.5 ${isToday(date) ? "text-yellow-400" : "text-gray-200"}`}>
                    {date.getDate()}
                  </div>
                  {hasSession && (
                    <div className="w-1.5 h-1.5 rounded-full mx-auto mt-0.5"
                      style={{ backgroundColor: schedule[i] ? "#C0D738" : "#818cf8" }}
                      title={schedule[i] ? "Sessione ricorrente" : "Sessione spostata"} />
                  )}
                </div>
              );
            })}
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
const MAX_PER_SLOT = 5;

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
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [availability, setAvailability] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

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

  const startEdit = async () => {
    setEditSchedule({ ...schedule });
    setSaveError("");
    setEditing(true);
    // Carica disponibilità slot per entrambe le viste
    setLoadingAvail(true);
    const res = await fetch(`/api/slot-availability?exclude_client=${clientId}`);
    const data = await res.json();
    setAvailability(data ?? {});
    setLoadingAvail(false);
  };

  const cancelEdit = () => { setEditing(false); setSaveError(""); };

  const toggleDay = (day: number) =>
    setEditSchedule(prev => {
      if (prev[day] !== undefined) { const n = { ...prev }; delete n[day]; return n; }
      return { ...prev, [day]: "10:00" };
    });

  const setTime = (day: number, time: string) =>
    setEditSchedule(prev => ({ ...prev, [day]: time }));

  const slotCount = (dow: number, time: string) => availability[`${dow}:${time}`] ?? 0;
  const slotFull  = (dow: number, time: string) => slotCount(dow, time) >= MAX_PER_SLOT;

  const handleSave = async () => {
    setSaveError("");

    // ── Regola 2 giorni (solo vista cliente) ──────────────────
    if (isClientView && Object.keys(schedule).length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const jsDay = today.getDay(); // 0=Dom
      const ourDay = jsDay === 0 ? 6 : jsDay - 1; // 0=Lun…6=Dom

      for (const dow of Object.keys(schedule).map(Number)) {
        let daysUntil = dow - ourDay;
        if (daysUntil < 0) daysUntil += 7;
        if (daysUntil < 2) {
          setSaveError(
            `Non puoi modificare l'orario: la prossima sessione è tra meno di 2 giorni.\nContatta la coach per cambi urgenti.`
          );
          return;
        }
      }
    }

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

    // ── Aggiorna day_date delle prossime training_days ─────────
    const newScheduledDays = Object.keys(saved).map(Number).sort((a, b) => a - b);
    if (newScheduledDays.length > 0) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split("T")[0];
      const { data: upWeeks } = await supabase
        .from("training_weeks")
        .select("id, date_start, month_id, training_days(id, day_number, day_date), training_months!inner(client_id)")
        .eq("training_months.client_id", clientId)
        .gte("date_start", todayStr)
        .not("date_start", "is", null);
      if (upWeeks) {
        for (const week of upWeeks as any[]) {
          const weekStart = new Date(week.date_start);
          weekStart.setHours(12, 0, 0, 0);
          for (const day of (week.training_days ?? []) as any[]) {
            if (day.day_number > newScheduledDays.length) continue;
            const offset = newScheduledDays[day.day_number - 1];
            const newDate = new Date(weekStart);
            newDate.setDate(newDate.getDate() + offset);
            const newDateStr = newDate.toISOString().split("T")[0];
            if (day.day_date !== newDateStr) {
              await supabase.from("training_days").update({ day_date: newDateStr }).eq("id", day.id);
            }
          }
        }
      }
    }

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
                    <div key={day}
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
                <button onClick={startEdit}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline underline-offset-2 transition-colors">
                  modifica orari
                </button>
              </div>
            </div>
          ) : (
            /* Vista modifica */
            <div className="px-4 py-3 space-y-4">

              {/* Chip giorni */}
              <div className="flex gap-1.5">
                {DAY_NAMES_SHORT.map((name, i) => (
                  <button key={i} onClick={() => toggleDay(i)}
                    className="flex-1 py-1.5 rounded-xl text-xs font-bold transition-all"
                    style={editSchedule[i] !== undefined
                      ? { backgroundColor: "#D4E600", color: "#111" }
                      : { backgroundColor: "#f3f4f6", color: "#9ca3af" }
                    }>
                    {name}
                  </button>
                ))}
              </div>

              {/* Orari — slot picker visivo con disponibilità (uguale per coach e cliente, regole diverse) */}
              {editDays.length > 0 && (
                loadingAvail ? (
                  <div className="text-xs text-gray-400 text-center py-2">Carico disponibilità...</div>
                ) : (
                  <div className="space-y-4">
                    {editDays.map(day => (
                      <div key={day}>
                        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                          {DAY_NAMES_SHORT[day]}
                        </div>
                        {[
                          { label: "Mattina", slots: TIME_SLOTS_MORNING },
                          { label: "Pomeriggio", slots: TIME_SLOTS_AFTERNOON },
                        ].map(({ label, slots }) => (
                          <div key={label} className="mb-3">
                            <div className="text-[10px] text-gray-400 mb-1.5 uppercase tracking-widest">{label}</div>
                            <div className="flex flex-wrap gap-1.5">
                              {slots.map(time => {
                                const count = slotCount(day, time);
                                const full = slotFull(day, time);
                                const selected = editSchedule[day] === time;
                                const spotsLeft = MAX_PER_SLOT - count;
                                // Cliente: slot pieno → bloccato. Coach: cliccabile ma warning rosso
                                const blocked = full && !selected && isClientView;
                                return (
                                  <button
                                    key={time}
                                    disabled={blocked}
                                    onClick={() => { if (!blocked) setTime(day, time); }}
                                    className={`text-xs px-2.5 py-1.5 rounded-xl font-medium transition-all border ${
                                      selected
                                        ? "border-transparent font-bold shadow-sm"
                                        : blocked
                                        ? "border-gray-100 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50"
                                        : full && !isClientView
                                        ? "border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        : spotsLeft === 1
                                        ? "border-orange-200 dark:border-orange-800 text-orange-500 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                        : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    }`}
                                    style={selected ? { backgroundColor: "#D4E600", color: "#111", borderColor: "transparent" } : {}}
                                  >
                                    {time}
                                    {/* Coach: slot pieno → ⚠ con conteggio */}
                                    {!selected && full && !isClientView && (
                                      <span className="ml-1 text-[9px] font-bold text-red-400">⚠ {count}/{MAX_PER_SLOT}</span>
                                    )}
                                    {/* Cliente: slot pieno → ✕ */}
                                    {!selected && blocked && (
                                      <span className="ml-1 text-[9px] text-gray-300">✕</span>
                                    )}
                                    {/* Quasi pieno */}
                                    {!selected && !full && spotsLeft <= 2 && (
                                      <span className={`ml-1 text-[9px] font-bold ${spotsLeft === 1 ? "text-orange-500" : "text-gray-400"}`}>
                                        {spotsLeft === 1 ? "1 posto" : `${spotsLeft}`}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      {isClientView
                        ? <>Slot con ✕ = al completo · <span className="text-orange-400">1 posto</span> = ultimo disponibile</>
                        : <>Slot in <span className="text-red-400">rosso ⚠</span> = al completo (puoi comunque assegnarlo)</>
                      }
                    </p>
                  </div>
                )
              )}

              {/* Errore 2 giorni */}
              {saveError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">⚠️ Modifica non consentita</p>
                  <p className="text-xs text-red-500 dark:text-red-400 mt-0.5 whitespace-pre-line">{saveError}</p>
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
        <ClientCalendarCard clientId={clientId} scheduleOverride={calendarSchedule} coachView={!isClientView} />

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
