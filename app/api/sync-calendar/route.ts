import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createDAVClient } from "tsdav";

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── iCal parsing ──────────────────────────────────────────────

interface CalEvent {
  title: string;
  date: string;        // YYYY-MM-DD
  time: string | null; // HH:MM ora locale
}

function parseDtstart(
  dtstart: string,
  isLocal: boolean
): { date: string; time: string | null } | null {
  const m = dtstart.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?/);
  if (!m) return null;
  const [, year, month, day, hour, min, , utcFlag] = m;
  const date = `${year}-${month}-${day}`;
  if (!hour) return { date, time: null };

  let h = parseInt(hour, 10);
  if (utcFlag === "Z" && !isLocal) {
    // Converti UTC → ora di Roma (CET +1 / CEST +2)
    const mo = parseInt(month, 10);
    h = (h + (mo >= 4 && mo <= 10 ? 2 : 1)) % 24;
  }

  return { date, time: `${String(h).padStart(2, "0")}:${min}` };
}

// Estrae YYYY-MM-DD da un valore EXDATE
function exdateToDateStr(val: string): string | null {
  const m = val.match(/(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

// Espande un RRULE WEEKLY in date individuali all'interno del range
function expandRRule(
  dtstart: { date: string; time: string | null },
  rrule: string,
  exdates: string[],
  rangeStart: Date,
  rangeEnd: Date
): { date: string; time: string | null }[] {
  const parts: Record<string, string> = {};
  rrule.replace(/^RRULE:/i, "").split(";").forEach(p => {
    const [k, v] = p.split("=");
    if (k && v) parts[k.toUpperCase()] = v;
  });

  // Gestisce solo FREQ=WEEKLY per ora (il caso più comune per sessioni PT)
  if (parts.FREQ?.toUpperCase() !== "WEEKLY") return [];

  const interval = parseInt(parts.INTERVAL ?? "1", 10);

  // UNTIL
  let until: Date | null = null;
  if (parts.UNTIL) {
    const u = parts.UNTIL.replace(/[TZ]/g, "");
    until = new Date(`${u.slice(0,4)}-${u.slice(4,6)}-${u.slice(6,8)}T12:00:00`);
  }
  const count = parts.COUNT ? parseInt(parts.COUNT, 10) : null;

  // BYDAY → giorni della settimana (0=Dom, 1=Lun, ..., 6=Sab)
  const dayMap: Record<string, number> = { SU:0, MO:1, TU:2, WE:3, TH:4, FR:5, SA:6 };
  let targetDows: number[] = [];
  if (parts.BYDAY) {
    targetDows = parts.BYDAY.split(",")
      .map(d => dayMap[d.trim().toUpperCase().slice(-2)])
      .filter((d): d is number => d !== undefined);
  }

  const exdateSet = new Set(exdates);
  const dtStartDate = new Date(dtstart.date + "T12:00:00");
  const endLimit = until && until < rangeEnd ? until : rangeEnd;
  const dows = targetDows.length > 0
    ? [...targetDows].sort((a, b) => a - b)
    : [dtStartDate.getDay()]; // se BYDAY assente, stesso giorno di DTSTART

  const results: { date: string; time: string | null }[] = [];
  let occurrenceCount = 0;

  // Parte dalla domenica della settimana di DTSTART
  const weekCursor = new Date(dtStartDate);
  weekCursor.setDate(weekCursor.getDate() - weekCursor.getDay());

  while (weekCursor <= endLimit) {
    for (const dow of dows) {
      const candidate = new Date(weekCursor);
      candidate.setDate(candidate.getDate() + dow);

      if (candidate < dtStartDate) continue; // prima di DTSTART
      if (candidate > endLimit) continue;
      if (count !== null && occurrenceCount >= count) return results;

      const dateStr = [
        candidate.getFullYear(),
        String(candidate.getMonth() + 1).padStart(2, "0"),
        String(candidate.getDate()).padStart(2, "0"),
      ].join("-");

      occurrenceCount++;
      if (exdateSet.has(dateStr)) continue; // data esclusa (sessione cancellata)
      if (candidate >= rangeStart) {
        results.push({ date: dateStr, time: dtstart.time });
      }
    }
    weekCursor.setDate(weekCursor.getDate() + 7 * interval);
  }

  return results;
}

function parseICalEvents(icalData: string, rangeStart: Date, rangeEnd: Date): CalEvent[] {
  const unfolded = icalData.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
  const events: CalEvent[] = [];
  const blocks = unfolded.split(/BEGIN:VEVENT/i).slice(1);

  for (const block of blocks) {
    const end = block.search(/END:VEVENT/i);
    if (end === -1) continue;
    const lines = block.slice(0, end).split(/\r?\n/).filter(Boolean);

    let summary = "";
    let dtstart = "";
    let dtstartIsLocal = false;
    let rrule = "";
    const exdates: string[] = [];

    for (const line of lines) {
      if (/^SUMMARY:/i.test(line)) {
        summary = line.slice(line.indexOf(":") + 1).trim();
      } else if (/^DTSTART/i.test(line)) {
        const colonIdx = line.indexOf(":");
        dtstartIsLocal = line.slice(0, colonIdx).toUpperCase().includes("TZID");
        dtstart = line.slice(colonIdx + 1).trim();
      } else if (/^RRULE:/i.test(line)) {
        rrule = line.trim();
      } else if (/^EXDATE/i.test(line)) {
        // Raccoglie date escluse (sessioni cancellate dalla serie ricorrente)
        const colonIdx = line.indexOf(":");
        const vals = line.slice(colonIdx + 1).trim().split(",");
        for (const v of vals) {
          const d = exdateToDateStr(v);
          if (d) exdates.push(d);
        }
      }
    }

    if (!summary || !dtstart) continue;
    const parsed = parseDtstart(dtstart, dtstartIsLocal);
    if (!parsed) continue;

    if (rrule) {
      // Evento ricorrente: espandi tutte le occorrenze nel range
      const expanded = expandRRule(parsed, rrule, exdates, rangeStart, rangeEnd);
      for (const e of expanded) {
        events.push({ title: summary, ...e });
      }
    } else {
      // Evento singolo
      events.push({ title: summary, ...parsed });
    }
  }

  return events;
}

// ── Debug: mostra tutti gli eventi PT senza salvare ──────────

async function debugSync() {
  const appleId = process.env.ICLOUD_APPLE_ID;
  const appPassword = process.env.ICLOUD_APP_PASSWORD;
  if (!appleId || !appPassword) {
    return NextResponse.json({ error: "Credenziali iCloud non configurate" }, { status: 500 });
  }

  let davClient: Awaited<ReturnType<typeof createDAVClient>>;
  try {
    davClient = await createDAVClient({
      serverUrl: "https://caldav.icloud.com",
      credentials: { username: appleId, password: appPassword },
      authMethod: "Basic",
      defaultAccountType: "caldav",
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: "Connessione fallita: " + String(e) }, { status: 500 });
  }

  const calendars = await davClient.fetchCalendars();
  const ptCalendar = calendars.find(
    (c) => String(c.displayName ?? "").trim().toUpperCase() === "PT"
  );
  if (!ptCalendar) {
    const names = calendars.map((c) => String(c.displayName ?? "?")).join(", ");
    return NextResponse.json({ error: `Calendario "PT" non trovato. Disponibili: ${names}` }, { status: 404 });
  }

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const lookbackDate = new Date(todayDate);
  lookbackDate.setDate(lookbackDate.getDate() - 30);
  const endDate = new Date(todayDate);
  endDate.setMonth(endDate.getMonth() + 4);

  const calObjects = await davClient.fetchCalendarObjects({
    calendar: ptCalendar,
    timeRange: { start: lookbackDate.toISOString(), end: endDate.toISOString() },
  });

  const allEvents: CalEvent[] = [];
  for (const obj of calObjects) {
    if (!obj.data) continue;
    allEvents.push(...parseICalEvents(obj.data, lookbackDate, endDate));
  }

  allEvents.sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    calendars: calendars.map(c => String(c.displayName ?? "?")),
    calObjects: calObjects.length,
    events: allEvents.map(e => ({ date: e.date, time: e.time, title: e.title })),
  });
}

// ── Cron entry-point (GET) ────────────────────────────────────

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("debug") === "true") {
    return debugSync();
  }
  return POST();
}

// ── Main sync ─────────────────────────────────────────────────

export async function POST() {
  const appleId = process.env.ICLOUD_APPLE_ID;
  const appPassword = process.env.ICLOUD_APP_PASSWORD;

  if (!appleId || !appPassword) {
    return NextResponse.json(
      { error: "Credenziali iCloud non configurate (ICLOUD_APPLE_ID / ICLOUD_APP_PASSWORD)" },
      { status: 500 }
    );
  }

  // 1. Connessione CalDAV iCloud
  let davClient: Awaited<ReturnType<typeof createDAVClient>>;
  try {
    davClient = await createDAVClient({
      serverUrl: "https://caldav.icloud.com",
      credentials: { username: appleId, password: appPassword },
      authMethod: "Basic",
      defaultAccountType: "caldav",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Connessione iCloud fallita: " + msg }, { status: 500 });
  }

  // 2. Trova il calendario "PT"
  const calendars = await davClient.fetchCalendars();
  const ptCalendar = calendars.find(
    (c) => String(c.displayName ?? "").trim().toUpperCase() === "PT"
  );
  if (!ptCalendar) {
    const names = calendars.map((c) => String(c.displayName ?? "?")).join(", ");
    return NextResponse.json(
      { error: `Calendario "PT" non trovato. Disponibili: ${names}` },
      { status: 404 }
    );
  }

  // 3. Fetch eventi PT: da 30 giorni fa a +4 mesi
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const lookbackDate = new Date(todayDate);
  lookbackDate.setDate(lookbackDate.getDate() - 30);
  const endDate = new Date(todayDate);
  endDate.setMonth(endDate.getMonth() + 4);

  const calObjects = await davClient.fetchCalendarObjects({
    calendar: ptCalendar,
    timeRange: { start: lookbackDate.toISOString(), end: endDate.toISOString() },
  });

  // 4. Parse tutti gli eventi (incluse ricorrenze espanse)
  const allEvents: CalEvent[] = [];
  for (const obj of calObjects) {
    if (!obj.data) continue;
    allEvents.push(...parseICalEvents(obj.data, lookbackDate, endDate));
  }

  // 5. Carica clienti PT
  const { data: ptClients } = await adminSupabase
    .from("clients")
    .select("id, name, surname")
    .eq("client_type", "PT");

  if (!ptClients?.length) {
    return NextResponse.json({ ok: true, synced: 0, events: allEvents.length });
  }

  // 6. Abbina ogni evento a un cliente PT (case-insensitive su nome + cognome)
  const matchedRows: { client_id: string; event_date: string; event_time: string | null; synced_at: string }[] = [];
  const now = new Date().toISOString();

  for (const event of allEvents) {
    for (const client of ptClients) {
      const fullName = `${client.name} ${client.surname}`.toLowerCase();
      if (event.title.toLowerCase().includes(fullName)) {
        matchedRows.push({
          client_id: client.id,
          event_date: event.date,
          event_time: event.time,
          synced_at: now,
        });
        break;
      }
    }
  }

  // 7. Deduplica per (client_id, event_date, event_time)
  const seen = new Set<string>();
  const dedupedRows = matchedRows.filter(r => {
    const key = `${r.client_id}|${r.event_date}|${r.event_time ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 8. Cancella e re-inserisce solo gli eventi trovati
  if (dedupedRows.length > 0) {
    for (const r of dedupedRows) {
      await adminSupabase
        .from("pt_calendar_events")
        .delete()
        .eq("client_id", r.client_id)
        .eq("event_date", r.event_date);
    }
    const { error } = await adminSupabase
      .from("pt_calendar_events")
      .insert(dedupedRows);
    if (error) {
      return NextResponse.json({ error: "Errore salvataggio eventi: " + error.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    synced: dedupedRows.length,
    events: allEvents.length,
  });
}
