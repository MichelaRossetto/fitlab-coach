"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Client, getSubscriptionStatus } from "@/lib/types";

// ── Config ────────────────────────────────────────────────────
const START_HOUR = 7;
const END_HOUR   = 21;
const HOUR_PX    = 64;           // px per ora
const TOTAL_PX   = (END_HOUR - START_HOUR) * HOUR_PX;
const TIME_W     = 44;           // px colonna orari
const MIN_COL_W  = 96;           // px minimo per colonna giorno
const EV_DUR     = 55;           // durata stimata overlap (min)
const DAYS       = 5;            // Lun–Ven

// ── Types ─────────────────────────────────────────────────────
interface ScheduleEntry { client_id: string; day_of_week: number; time: string; }
interface PtCalEvent    { client_id: string; event_date: string; event_time: string | null; }
interface CalEvent {
  id: string; client_id: string;
  name: string; surname: string;
  type: "PR" | "PT";
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

// Assegna colonne agli eventi sovrapposti
function layoutEvents(events: Omit<CalEvent, "col"|"cols">[]): CalEvent[] {
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
  const totalCols = colEnds.length;
  return result.map(ev => ({ ...ev, cols: totalCols }));
}

const DAY_LABELS  = ["Lun","Mar","Mer","Gio","Ven","Sab"];
const MONTH_SHORT = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
const TIME_SLOTS  = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

// ── Page ──────────────────────────────────────────────────────
export default function CalendarioPage() {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [clients,  setClients]    = useState<Client[]>([]);
  const [schedule, setSchedule]   = useState<ScheduleEntry[]>([]);
  const [ptEvents, setPtEvents]   = useState<PtCalEvent[]>([]);
  const [showPR,   setShowPR]     = useState(true);
  const [showPT,   setShowPT]     = useState(true);
  const [syncing,  setSyncing]    = useState(false);
  const [syncMsg,  setSyncMsg]    = useState<{ text: string; ok: boolean } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scrolla a 7:00 al montaggio
  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }); }, []);

  // Fetch clienti + schedule (una volta)
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

  // Fetch eventi PT per la settimana
  const fetchPtEvents = useCallback(async (ws: string, we: string) => {
    const { data } = await supabase
      .from("pt_calendar_events")
      .select("client_id, event_date, event_time")
      .gte("event_date", ws)
      .lte("event_date", we);
    setPtEvents(data ?? []);
  }, []);

  useEffect(() => {
    fetchPtEvents(localDs(weekDays[0]), localDs(weekDays[DAYS - 1]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  // Clienti visibili (attivi/in scadenza, non in pausa)
  const visibleIds = new Set(
    clients
      .filter(c => !c.is_paused && ["active","expiring"].includes(getSubscriptionStatus(c.subscription_end)))
      .map(c => c.id)
  );
  const clientMap = new Map(clients.map(c => [c.id, c]));

  // Costruisce eventi per ogni giorno
  const rawByDay = new Map<string, Omit<CalEvent,"col"|"cols">[]>();
  for (const d of weekDays) rawByDay.set(localDs(d), []);

  if (showPR) {
    for (const entry of schedule) {
      if (!visibleIds.has(entry.client_id)) continue;
      const c = clientMap.get(entry.client_id);
      if (!c || c.client_type === "PT") continue;
      if (entry.day_of_week >= DAYS) continue;
      const ds = localDs(weekDays[entry.day_of_week]);
      rawByDay.get(ds)?.push({
        id: `pr-${entry.client_id}`,
        client_id: entry.client_id,
        name: c.name, surname: c.surname,
        type: "PR", startMin: timeToMin(entry.time),
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

  // Sync — prima aggiorna il calendario, poi mostra OK (evita flash di dati stale)
  const handleSync = async () => {
    setSyncing(true); setSyncMsg(null);
    try {
      const res  = await fetch("/api/sync-calendar", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setSyncMsg({ text: data.error ?? "Errore", ok: false });
      } else {
        await fetchPtEvents(localDs(weekDays[0]), localDs(weekDays[DAYS - 1]));
        setSyncMsg({ text: `Sync OK — ${data.synced} sessioni (${data.events} eventi)`, ok: true });
      }
    } catch { setSyncMsg({ text: "Errore di rete", ok: false }); }
    finally   { setSyncing(false); }
  };

  const isToday = (d: Date) => localDs(d) === localDs(new Date());

  const weekLabel = (() => {
    const s = weekDays[0], e = weekDays[DAYS - 1];
    return s.getMonth() === e.getMonth()
      ? `${s.getDate()}–${e.getDate()} ${MONTH_SHORT[s.getMonth()]} ${s.getFullYear()}`
      : `${s.getDate()} ${MONTH_SHORT[s.getMonth()]} – ${e.getDate()} ${MONTH_SHORT[e.getMonth()]} ${s.getFullYear()}`;
  })();

  const prevWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate()-7); return n; });
  const nextWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate()+7); return n; });

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900 overflow-hidden">

      {/* ── Header ── */}
      <header className="border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 z-40 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 py-2.5 flex-wrap">

          {/* Back */}
          <Link href="/" className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </Link>

          {/* Week nav */}
          <div className="flex items-center gap-0.5">
            <button onClick={prevWeek} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 px-1 min-w-[150px] text-center">{weekLabel}</span>
            <button onClick={nextWeek} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            <button onClick={() => setWeekStart(getMonday(new Date()))}
              className="ml-1 text-[11px] px-2 py-1 rounded-full border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              Oggi
            </button>
          </div>

          {/* Filtri + sync */}
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setShowPR(p => !p)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all border-2"
              style={showPR
                ? { backgroundColor:"#C0D738", borderColor:"#C0D738", color:"#1a1a00" }
                : { borderColor:"#e5e7eb", color:"#9ca3af", backgroundColor:"transparent" }}>
              PR
            </button>
            <button onClick={() => setShowPT(p => !p)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all border-2 ${
                showPT ? "bg-indigo-500 border-indigo-500 text-white" : "border-gray-200 dark:border-gray-600 text-gray-400 bg-transparent"
              }`}>
              PT
            </button>
            <button onClick={handleSync} disabled={syncing}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-500 disabled:opacity-50 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={syncing ? "animate-spin" : ""}>
                <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
              </svg>
              {syncing ? "Sync..." : "Sync PT"}
            </button>
          </div>
        </div>

        {syncMsg && (
          <div className={`px-4 py-1.5 text-[11px] ${syncMsg.ok ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"}`}>
            {syncMsg.text}
          </div>
        )}
      </header>

      {/* ── Scrollable grid (header + body insieme per scroll orizzontale sincronizzato) ── */}
      <div className="flex-1 overflow-auto" ref={scrollRef}>
        <div style={{ minWidth: `${TIME_W + DAYS * MIN_COL_W}px` }}>

        {/* Intestazione giorni — sticky top dentro lo scroll container */}
        <div className="sticky top-0 z-20 grid border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
          style={{ gridTemplateColumns: `${TIME_W}px repeat(${DAYS}, 1fr)` }}>
          <div />
          {weekDays.map((d, i) => (
            <div key={i} className={`px-1 py-2 text-center border-l border-gray-100 dark:border-gray-700 ${isToday(d) ? "bg-yellow-50 dark:bg-yellow-900/10" : ""}`}>
              <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{DAY_LABELS[i]}</div>
              <div className={`text-lg font-bold leading-none mt-0.5 ${isToday(d) ? "text-yellow-500 dark:text-yellow-400" : "text-gray-700 dark:text-gray-200"}`}>{d.getDate()}</div>
              <div className="text-[10px] text-gray-300 dark:text-gray-600">{MONTH_SHORT[d.getMonth()]}</div>
            </div>
          ))}
        </div>

        <div className="grid relative"
          style={{ gridTemplateColumns: `${TIME_W}px repeat(${DAYS}, 1fr)`, height: `${TOTAL_PX}px` }}>

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
          {weekDays.map((day, di) => {
            const ds = localDs(day);
            const events = layoutByDay.get(ds) ?? [];
            return (
              <div key={di} className="relative border-l border-gray-100 dark:border-gray-700" style={{ height: `${TOTAL_PX}px` }}>

                {/* Oggi: sfondo tenue */}
                {isToday(day) && <div className="absolute inset-0 bg-yellow-50/40 dark:bg-yellow-900/5 pointer-events-none" />}

                {/* Righe ore */}
                {TIME_SLOTS.map(h => (
                  <div key={h} className="absolute w-full border-t border-gray-100 dark:border-gray-700/50"
                    style={{ top: `${(h - START_HOUR) * HOUR_PX}px` }} />
                ))}
                {/* Righe mezz'ora */}
                {TIME_SLOTS.map(h => (
                  <div key={`hh-${h}`} className="absolute w-full border-t border-gray-50 dark:border-gray-800"
                    style={{ top: `${(h - START_HOUR) * HOUR_PX + HOUR_PX / 2}px` }} />
                ))}

                {/* Eventi */}
                {events.map(ev => {
                  const top    = minToTop(ev.startMin);
                  const height = HOUR_PX - 4;
                  const colW   = 1 / ev.cols;
                  const isPR   = ev.type === "PR";
                  return (
                    <div key={ev.id}
                      className="absolute rounded-lg overflow-hidden select-none"
                      style={{
                        top:    `${top + 2}px`,
                        height: `${height}px`,
                        left:   `${ev.col * colW * 100 + 1}%`,
                        width:  `${colW * 100 - 2}%`,
                        backgroundColor: isPR ? "#C0D738" : "#6366f1",
                        minWidth: "28px",
                        zIndex: 10,
                      }}
                      title={`${ev.name} ${ev.surname}`}
                    >
                      <div className="px-1.5 pt-1 h-full overflow-hidden">
                        <p className="text-[11px] font-bold leading-tight truncate"
                          style={{ color: isPR ? "#1a1f00" : "#fff" }}>
                          {ev.surname}
                        </p>
                        {height > 36 && (
                          <p className="text-[10px] leading-tight truncate mt-0.5"
                            style={{ color: isPR ? "#4a5000" : "#c7d2fe" }}>
                            {ev.name}
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
        </div>{/* end min-width wrapper */}
      </div>
    </div>
  );
}
