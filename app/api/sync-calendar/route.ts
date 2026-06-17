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

function parseICalEvents(icalData: string): CalEvent[] {
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

    for (const line of lines) {
      if (/^SUMMARY:/i.test(line)) {
        summary = line.slice(line.indexOf(":") + 1).trim();
      } else if (/^DTSTART/i.test(line)) {
        const colonIdx = line.indexOf(":");
        dtstartIsLocal = line.slice(0, colonIdx).toUpperCase().includes("TZID");
        dtstart = line.slice(colonIdx + 1).trim();
      }
    }

    if (!summary || !dtstart) continue;
    const parsed = parseDtstart(dtstart, dtstartIsLocal);
    if (parsed) events.push({ title: summary, ...parsed });
  }

  return events;
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

  // 3. Fetch eventi PT: da 30 giorni fa a +4 mesi (lookback per aggiornare anche sessioni recenti passate)
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

  // 4. Parse tutti gli eventi
  const allEvents: CalEvent[] = [];
  for (const obj of calObjects) {
    if (!obj.data) continue;
    allEvents.push(...parseICalEvents(obj.data));
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

  // 7. Deduplica per (client_id, event_date, event_time) prima di salvare
  const seen = new Set<string>();
  const dedupedRows = matchedRows.filter(r => {
    const key = `${r.client_id}|${r.event_date}|${r.event_time ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sostituisci eventi dalla finestra lookback in poi (30 gg fa → futuro)
  const lookbackStr = lookbackDate.toISOString().split("T")[0];
  await adminSupabase
    .from("pt_calendar_events")
    .delete()
    .gte("event_date", lookbackStr);

  if (dedupedRows.length > 0) {
    const { error } = await adminSupabase
      .from("pt_calendar_events")
      .insert(dedupedRows);
    if (error) {
      return NextResponse.json({ error: "Errore salvataggio eventi: " + error.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    synced: matchedRows.length,
    events: allEvents.length,
  });
}
