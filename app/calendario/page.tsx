"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Client, getSubscriptionStatus } from "@/lib/types";

// ── Config ────────────────────────────────────────────────────
const START_HOUR = 7;
const END_HOUR   = 21;
const HOUR_PX    = 64;
const TOTAL_PX   = (END_HOUR - START_HOUR) * HOUR_PX;
const TIME_W     = 44;
const MIN_COL_W  = 96;
const EV_DUR     = 55;
const DAYS       = 5;

type ViewMode = "week" | "day";

interface ScheduleEntry { client_id: string; day_of_week: number; time: string; }
interface PtCalEvent    { client_id: string; event_date: string; event_time: string | null; }
interface RawOverride   { client_id: string; day_date: string; day_time: string | null; day_number: number; saltato: boolean; }
interface CalEvent {
  id: string; client_id: string;
  name: string; surname: string;
  type: "PR" | "PT";
  saltato?: boolean;
  startMin: number;
  col: number; cols: number;
}

// ── Utils ─────────────────────────────────────────────────────
function getMonday(d: Date): Date {
  const r = new Date(d); r.setHours(0, 0, 0, 0);
  const day = r.getDay();
  r.setDate(r.getDate() - (day === 0 ? 6 : day - 1));
  return r;
}
function localDs(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number); return h * 60 + m;
}
function minToTop(min: number): number {
  return ((min - START_HOUR * 60) / 60) * HOUR_PX;
}
function layoutEvents(events: Omit<CalEvent,"col"|"cols">[]): CalEvent[] {
  const sorted = [...events].sort((a, b) => a.startMin - b.startMin);
  const colEnds: number[] = [];
  const result: (CalEvent & { _col: number })[] = [];
  for (const ev of sorted) {
    const end = ev.startMin + EV_DUR;
    let col = colEnds.findIndex(e => e <= ev.startMin);
    if (col === -1) { col = colEnds.length; colEnds.push(end); }
    else colEnds[col] = end;
    result.push({ ...ev, col, cols: 0, _col: col });
  }
  const totalCols = colEnds.length || 1;
  return result.map(ev => ({ ...ev, cols: totalCols }));
}

const DAY_LABELS_LONG = ["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"];
const DAY_LABELS  = ["Lun","Mar","Mer","Gio","Ven","Sab"];
const MONTH_SHORT = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
const TIME_SLOTS  = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

// ── Page ──────────────────────────────────────────────────────
export default function CalendarioPage() {
  const [weekStart,   setWeekStart]   = useState(() => getMonday(new Date()));
  const [viewMode,    setViewMode]    = useState<ViewMode>("week");
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [clients,     setClients]     = useState<Client[]>([]);
  const [schedule,    setSchedule]    = useState<ScheduleEntry[]>([]);
  const [ptEvents,    setPtEvents]    = useState<PtCalEvent[]>([]);
  const [rawOverrides, setRawOverrides] = useState<RawOverride[]>([]);
  const [showPR,      setShowPR]      = useState(true);
  const [showPT,      setShowPT]      = useState(true);
  const [syncing,     setSyncing]     = useState(false);
  const [syncMsg,     setSyncMsg]     = useState<{ text: string; ok: boolean } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Default to day view on mobile
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setViewMode("day");
    }
  }, []);

  // Scroll to current time on mount
  useEffect(() => {
    const now = new Date();
    const topPx = minToTop(now.getHours() * 60 + now.getMinutes()) - 100;
    scrollRef.current?.scrollTo({ top: Math.max(0, topPx) });
  }, []);

  // Fetch clients + schedule once
  useEffect(() => {
    const load = async () => {
      const [{ data: c }, schedRes] = await Promise.all([
        supabase.from("clients").select("*"),
        fetch("/api/schedules"),
      ]);
      setClients(c ?? []);
      setSchedule((await schedRes.json()) ?? []);
    };
    load();
  }, []);

  const weekDays = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return d;
  });

  // displayDays: 5 giorni in vista settimana, 1 giorno in vista giorno
  const displayDays = viewMode === "day" ? [selectedDay] : weekDays;
  const DAYS_SHOW   = displayDays.length;

  // Fetch PT events (copertura della settimana visualizzata)
  const fetchPtEvents = useCallback(async (ws: string, we: string) => {
    const { data } = await supabase
      .from("pt_calendar_events")
      .select("client_id, event_date, event_time")
      .gte("event_date", ws)
      .lte("event_date", we);
    setPtEvents(data ?? []);
  }, []);

  useEffect(() => {
    if (viewMode === "week") {
      fetchPtEvents(localDs(weekDays[0]), localDs(weekDays[DAYS - 1]));
    } else {
      // Carica tutta la settimana del giorno selezionato per navigazione fluida tra giorni
      const mon = getMonday(selectedDay);
      const fri = new Date(mon); fri.setDate(fri.getDate() + 4);
      fetchPtEvents(localDs(mon), localDs(fri));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart, viewMode, selectedDay.toDateString()]);

  // Fetch override training_days (spostamenti PR all'interno della settimana)
  const fetchOverrides = useCallback(async (ws: string, we: string) => {
    const { data } = await supabase
      .from("training_days")
      .select("day_date, day_time, day_number, status, training_weeks!inner(training_months!inner(client_id))")
      .gte("day_date", ws)
      .lte("day_date", we)
      .not("day_date", "is", null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setRawOverrides((data ?? []).map((td: any) => ({
      client_id: td.training_weeks?.training_months?.client_id as string,
      day_date: td.day_date as string,
      day_time: td.day_time as string | null,
      day_number: td.day_number as number,
      saltato: td.status === "saltato",
    })).filter((o: RawOverride) => o.client_id));
  }, []);

  useEffect(() => {
    if (viewMode === "week") {
      fetchOverrides(localDs(weekDays[0]), localDs(weekDays[DAYS - 1]));
    } else {
      const mon = getMonday(selectedDay);
      const fri = new Date(mon); fri.setDate(fri.getDate() + 4);
      fetchOverrides(localDs(mon), localDs(fri));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart, viewMode, selectedDay.toDateString()]);

  // Clienti visibili
  const visibleIds = new Set(
    clients
      .filter(c => !c.is_paused && ["active","expiring"].includes(getSubscriptionStatus(c.subscription_end)))
      .map(c => c.id)
  );
  const clientMap = new Map(clients.map(c => [c.id, c]));

  // Calcola override da training_days (PR che hanno spostato la sessione nella settimana corrente)
  const processedOverrides = rawOverrides.map(td => {
    const d = new Date(td.day_date + "T12:00:00");
    const jsDay = d.getDay();
    const newDow = jsDay === 0 ? 6 : jsDay - 1;
    const clientSched = schedule
      .filter(e => e.client_id === td.client_id && e.day_of_week < DAYS)
      .sort((a, b) => a.day_of_week - b.day_of_week);
    const origEntry = clientSched[td.day_number - 1];
    const origDow = origEntry?.day_of_week ?? newDow;
    const newTime = td.day_time?.slice(0, 5) ?? origEntry?.time?.slice(0, 5) ?? "08:00";
    return { client_id: td.client_id, newDate: td.day_date, newTime, origDow, saltato: td.saltato };
  });

  const suppressedDows: Record<string, Set<number>> = {};
  for (const ov of processedOverrides) {
    if (!suppressedDows[ov.client_id]) suppressedDows[ov.client_id] = new Set();
    suppressedDows[ov.client_id].add(ov.origDow);
  }

  // Costruisce rawByDay per i giorni visualizzati
  const rawByDay = new Map<string, Omit<CalEvent,"col"|"cols">[]>();
  for (const d of displayDays) rawByDay.set(localDs(d), []);

  if (showPR) {
    for (const entry of schedule) {
      if (!visibleIds.has(entry.client_id)) continue;
      const c = clientMap.get(entry.client_id);
      if (!c || c.client_type === "PT") continue;
      if (entry.day_of_week >= DAYS) continue;
      // Salta il giorno ricorrente se questa settimana è stato spostato
      if (suppressedDows[entry.client_id]?.has(entry.day_of_week)) continue;

      if (viewMode === "week") {
        const ds = localDs(weekDays[entry.day_of_week]);
        rawByDay.get(ds)?.push({
          id: `pr-${entry.client_id}`,
          client_id: entry.client_id,
          name: c.name, surname: c.surname,
          type: "PR", startMin: timeToMin(entry.time),
        });
      } else {
        const jsDay = selectedDay.getDay();
        const selDow = jsDay === 0 ? 6 : jsDay - 1;
        if (entry.day_of_week === selDow) {
          rawByDay.get(localDs(selectedDay))?.push({
            id: `pr-${entry.client_id}`,
            client_id: entry.client_id,
            name: c.name, surname: c.surname,
            type: "PR", startMin: timeToMin(entry.time),
          });
        }
      }
    }

    // Aggiunge le sessioni spostate nella nuova posizione
    for (const ov of processedOverrides) {
      if (!visibleIds.has(ov.client_id)) continue;
      const c = clientMap.get(ov.client_id);
      if (!c || c.client_type === "PT") continue;
      rawByDay.get(ov.newDate)?.push({
        id: `pr-ov-${ov.client_id}-${ov.newDate}`,
        client_id: ov.client_id,
        name: c.name, surname: c.surname,
        type: "PR", startMin: timeToMin(ov.newTime),
        saltato: ov.saltato,
      });
    }
  }

  if (showPT) {
    for (const ev of ptEvents) {
      if (!visibleIds.has(ev.client_id)) continue;
      const c = clientMap.get(ev.client_id);
      if (!c) continue;
      rawByDay.get(ev.event_date)?.push({
        id: `pt-${ev.client_id}-${ev.event_date}-${ev.event_time}`,
        client_id: ev.client_id,
        name: c.name, surname: c.surname,
        type: "PT", startMin: timeToMin(ev.event_time ?? "08:00"),
      });
    }
  }

  const layoutByDay = new Map<string, CalEvent[]>();
  Array.from(rawByDay).forEach(([ds, evs]) => layoutByDay.set(ds, layoutEvents(evs)));

  // Sync
  const handleSync = async () => {
    setSyncing(true); setSyncMsg(null);
    try {
      const res  = await fetch("/api/sync-calendar", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setSyncMsg({ text: data.error ?? "Errore", ok: false });
      } else {
        if (viewMode === "week") {
          await fetchPtEvents(localDs(weekDays[0]), localDs(weekDays[DAYS - 1]));
        } else {
          const mon = getMonday(selectedDay); const fri = new Date(mon); fri.setDate(fri.getDate() + 4);
          await fetchPtEvents(localDs(mon), localDs(fri));
        }
        setSyncMsg({ text: `Sync OK — ${data.synced} sessioni (${data.events} eventi)`, ok: true });
      }
    } catch { setSyncMsg({ text: "Errore di rete", ok: false }); }
    finally   { setSyncing(false); }
  };

  const isToday = (d: Date) => localDs(d) === localDs(new Date());

  // Navigazione
  const prevWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate()-7); return n; });
  const nextWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate()+7); return n; });
  const prevDay  = () => setSelectedDay(d => { const n = new Date(d); n.setDate(n.getDate()-1); return n; });
  const nextDay  = () => setSelectedDay(d => { const n = new Date(d); n.setDate(n.getDate()+1); return n; });

  const openDay = (d: Date) => { setSelectedDay(new Date(d)); setViewMode("day"); };
  const goToday = () => { const t = new Date(); setWeekStart(getMonday(t)); setSelectedDay(t); };
  const toggleView = () => {
    if (viewMode === "day") { setWeekStart(getMonday(selectedDay)); setViewMode("week"); }
    else { setViewMode("day"); }
  };

  const weekLabel = (() => {
    const s = weekDays[0], e = weekDays[DAYS - 1];
    return s.getMonth() === e.getMonth()
      ? `${s.getDate()}–${e.getDate()} ${MONTH_SHORT[s.getMonth()]} ${s.getFullYear()}`
      : `${s.getDate()} ${MONTH_SHORT[s.getMonth()]} – ${e.getDate()} ${MONTH_SHORT[e.getMonth()]} ${s.getFullYear()}`;
  })();

  const dayLabel = (() => {
    const jsDay = selectedDay.getDay();
    const dow = jsDay === 0 ? 6 : jsDay - 1;
    return `${DAY_LABELS_LONG[dow]} ${selectedDay.getDate()} ${MONTH_SHORT[selectedDay.getMonth()]}`;
  })();

  const gridCols = `${TIME_W}px repeat(${DAYS_SHOW}, 1fr)`;
  const minWidth = viewMode === "week" ? `${TIME_W + DAYS * MIN_COL_W}px` : undefined;

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900 overflow-hidden">

      {/* ── Header ── */}
      <header className="border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 z-40 flex-shrink-0">
        <div className="flex items-center gap-1.5 px-3 py-2.5">

          {/* Torna al dashboard */}
          <Link href="/" className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </Link>

          {/* Navigazione settimana / giorno */}
          <div className="flex items-center gap-0.5 flex-1 min-w-0">
            <button onClick={viewMode === "week" ? prevWeek : prevDay}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 px-1 text-center flex-1 truncate">
              {viewMode === "week" ? weekLabel : dayLabel}
            </span>
            <button onClick={viewMode === "week" ? nextWeek : nextDay}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>

          {/* Controlli destra */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={goToday}
              className="text-[11px] px-2 py-1 rounded-full border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              Oggi
            </button>
            <button onClick={toggleView}
              className="text-[11px] px-2 py-1 rounded-full border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              {viewMode === "week" ? "Giorno" : "Settimana"}
            </button>
            <button onClick={() => setShowPR(p => !p)}
              className="text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all border-2"
              style={showPR
                ? { backgroundColor:"#C0D738", borderColor:"#C0D738", color:"#1a1a00" }
                : { borderColor:"#e5e7eb", color:"#9ca3af", backgroundColor:"transparent" }}>
              PR
            </button>
            <button onClick={() => setShowPT(p => !p)}
              className={`text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all border-2 ${
                showPT ? "bg-indigo-500 border-indigo-500 text-white" : "border-gray-200 dark:border-gray-600 text-gray-400 bg-transparent"
              }`}>
              PT
            </button>
            <button onClick={handleSync} disabled={syncing}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-500 disabled:opacity-50 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={syncing ? "animate-spin" : ""}>
                <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
              </svg>
              <span className="hidden sm:inline">{syncing ? "Sync..." : "Sync PT"}</span>
            </button>
          </div>
        </div>

        {syncMsg && (
          <div className={`px-4 py-1.5 text-[11px] ${syncMsg.ok ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"}`}>
            {syncMsg.text}
          </div>
        )}
      </header>

      {/* ── Grid scrollabile ── */}
      <div className="flex-1 overflow-auto" ref={scrollRef}>
        <div style={minWidth ? { minWidth } : {}}>

          {/* Intestazione giorni — sticky top */}
          <div className="sticky top-0 z-20 grid border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            style={{ gridTemplateColumns: gridCols }}>
            <div />
            {displayDays.map((d, i) => {
              const jsDay = d.getDay();
              const dow = jsDay === 0 ? 6 : jsDay - 1;
              return (
                <button key={i}
                  onClick={() => viewMode === "week" && openDay(d)}
                  className={`px-1 py-2 text-center border-l border-gray-100 dark:border-gray-700 w-full transition-colors
                    ${isToday(d) ? "bg-yellow-50 dark:bg-yellow-900/10" : ""}
                    ${viewMode === "week" ? "hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer active:bg-gray-100" : "cursor-default"}
                  `}>
                  <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{DAY_LABELS[dow]}</div>
                  <div className={`text-lg font-bold leading-none mt-0.5 ${isToday(d) ? "text-yellow-500 dark:text-yellow-400" : "text-gray-700 dark:text-gray-200"}`}>{d.getDate()}</div>
                  <div className="text-[10px] text-gray-300 dark:text-gray-600">{MONTH_SHORT[d.getMonth()]}</div>
                </button>
              );
            })}
          </div>

          {/* Grid body */}
          <div className="grid relative"
            style={{ gridTemplateColumns: gridCols, height: `${TOTAL_PX}px` }}>

            {/* Colonna orari */}
            <div className="relative select-none">
              {TIME_SLOTS.map(h => (
                <div key={h} className="absolute w-full flex justify-end pr-2"
                  style={{ top: `${(h - START_HOUR) * HOUR_PX}px`, transform: "translateY(-50%)" }}>
                  <span className="text-[10px] text-gray-400 font-mono">{String(h).padStart(2,"0")}:00</span>
                </div>
              ))}
            </div>

            {/* Colonne giorni */}
            {displayDays.map((day, di) => {
              const ds     = localDs(day);
              const events = layoutByDay.get(ds) ?? [];
              const isDay  = viewMode === "day";
              return (
                <div key={di} className="relative border-l border-gray-100 dark:border-gray-700" style={{ height: `${TOTAL_PX}px` }}>
                  {isToday(day) && <div className="absolute inset-0 bg-yellow-50/40 dark:bg-yellow-900/5 pointer-events-none" />}

                  {TIME_SLOTS.map(h => (
                    <div key={h} className="absolute w-full border-t border-gray-100 dark:border-gray-700/50"
                      style={{ top: `${(h - START_HOUR) * HOUR_PX}px` }} />
                  ))}
                  {TIME_SLOTS.map(h => (
                    <div key={`hh-${h}`} className="absolute w-full border-t border-gray-50 dark:border-gray-800"
                      style={{ top: `${(h - START_HOUR) * HOUR_PX + HOUR_PX / 2}px` }} />
                  ))}

                  {events.map(ev => {
                    const top    = minToTop(ev.startMin);
                    const height = HOUR_PX - 4;
                    const colW   = 1 / ev.cols;
                    const isPR   = ev.type === "PR";
                    const bgColor = ev.saltato ? "#9ca3af" : isPR ? "#C0D738" : "#6366f1";
                    const textColor = ev.saltato ? "#fff" : isPR ? "#1a1f00" : "#fff";
                    const subColor  = ev.saltato ? "#e5e7eb" : isPR ? "#4a5000" : "#c7d2fe";
                    return (
                      <div key={ev.id}
                        className="absolute rounded-lg overflow-hidden select-none"
                        style={{
                          top:    `${top + 2}px`,
                          height: `${height}px`,
                          left:   `${ev.col * colW * 100 + 1}%`,
                          width:  `${colW * 100 - 2}%`,
                          backgroundColor: bgColor,
                          minWidth: "28px",
                          zIndex: 10,
                          opacity: ev.saltato ? 0.7 : 1,
                        }}
                        title={`${ev.name} ${ev.surname}${ev.saltato ? " — Non presente" : ""}`}
                      >
                        <div className="px-1.5 pt-1 h-full overflow-hidden">
                          <p className={`font-bold leading-tight truncate ${isDay ? "text-[14px]" : "text-[11px]"}`}
                            style={{ color: textColor }}>
                            {ev.surname}
                          </p>
                          {height > 30 && (
                            <p className={`leading-tight truncate mt-0.5 ${isDay ? "text-[12px]" : "text-[10px]"}`}
                              style={{ color: subColor }}>
                              {ev.saltato ? "Non presente" : ev.name}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
