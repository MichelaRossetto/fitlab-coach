import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DISPLAY_SLOTS = ["08:00","09:00","10:00","11:00","12:00","13:00","16:00","17:00","18:00","19:00"];

function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function slotForTime(t: string): string | null {
  const T = timeToMin(t);
  for (const slot of DISPLAY_SLOTS) {
    const H = timeToMin(slot);
    if (T >= H && T < H + 60) return slot;
  }
  return null;
}

// 0=lun … 6=dom (same convention as client_schedule.day_of_week)
function dowFromDate(dateStr: string): number {
  const jsDay = new Date(dateStr + "T12:00:00").getDay(); // 0=dom … 6=sab
  return jsDay === 0 ? 6 : jsDay - 1;
}

function weekRange(dateStr: string): { start: string; end: string } {
  const d = new Date(dateStr + "T12:00:00");
  const jsDay = d.getDay(); // 0=dom
  const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (x: Date) => x.toISOString().split("T")[0];
  return { start: fmt(monday), end: fmt(sunday) };
}

// GET /api/slot-availability?exclude_client=xxx&target_date=YYYY-MM-DD
// Returns: Record<"dow:slot", count>
// Se target_date è fornito, applica gli override training_days della settimana target
export async function GET(req: NextRequest) {
  const excludeClientId = req.nextUrl.searchParams.get("exclude_client");
  const targetDate = req.nextUrl.searchParams.get("target_date");

  // Conta base da client_schedule (ricorrente)
  let query = adminSupabase.from("client_schedule").select("client_id, day_of_week, time");
  if (excludeClientId) query = query.neq("client_id", excludeClientId);

  const { data: schedData, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mappa client_id → { dow, slot } dal recurring schedule
  const clientRecurring: Record<string, { dow: number; slot: string }[]> = {};
  for (const row of (schedData ?? []) as { client_id: string; day_of_week: number; time: string }[]) {
    const slot = slotForTime(row.time.slice(0, 5));
    if (!slot) continue;
    if (!clientRecurring[row.client_id]) clientRecurring[row.client_id] = [];
    clientRecurring[row.client_id].push({ dow: row.day_of_week, slot });
  }

  // Costruisci conteggi base dai ricorrenti
  // slotSets["dow:slot"] = Set di client_id presenti in quello slot
  const slotSets: Record<string, Set<string>> = {};
  for (const [clientId, entries] of Object.entries(clientRecurring)) {
    for (const { dow, slot } of entries) {
      const key = `${dow}:${slot}`;
      if (!slotSets[key]) slotSets[key] = new Set();
      slotSets[key].add(clientId);
    }
  }

  // Se target_date: applica override training_days della settimana
  if (targetDate) {
    const { start, end } = weekRange(targetDate);

    const { data: overrides } = await adminSupabase
      .from("training_days")
      .select("day_date, day_time, day_number, status, training_weeks!inner(training_months!inner(client_id))")
      .gte("day_date", start)
      .lte("day_date", end)
      .not("day_date", "is", null);

    for (const ov of (overrides ?? []) as any[]) {
      const clientId = ov.training_weeks?.training_months?.client_id as string | undefined;
      if (!clientId) continue;
      if (clientId === excludeClientId) continue;

      const newDow = dowFromDate(ov.day_date);
      const newSlot = ov.day_time ? slotForTime(ov.day_time.slice(0, 5)) : null;
      const isSaltato = ov.status === "skip" || ov.status === "saltato";

      // Rimuovi il cliente dal suo slot ricorrente per questo DOW
      // (usa day_number per trovare quale slot ricorrente viene spostato)
      const recurring = clientRecurring[clientId] ?? [];
      for (const { dow: recDow, slot: recSlot } of recurring) {
        // Se il giorno override coincide col dow ricorrente, rimuovi da lì
        if (recDow === newDow || ov.day_number) {
          // Rimuovi dal ricorrente originale (il giorno della settimana di schedule corrispondente a day_number)
          // Per semplicità: rimuoviamo dal DOW target se saltato, altrimenti gestiamo lo spostamento
          if (isSaltato && recDow === newDow) {
            slotSets[`${recDow}:${recSlot}`]?.delete(clientId);
          }
        }
      }

      if (!isSaltato && newSlot) {
        // Override reale (spostamento): trova il DOW originale dal ricorrente
        // Rimuovi dal ricorrente di quel giorno e aggiungi al nuovo slot
        for (const { dow: recDow, slot: recSlot } of recurring) {
          // Rimuovi dal ricorrente (il cliente non è nel suo slot normale questa settimana)
          slotSets[`${recDow}:${recSlot}`]?.delete(clientId);
        }
        // Aggiungi al nuovo slot
        const newKey = `${newDow}:${newSlot}`;
        if (!slotSets[newKey]) slotSets[newKey] = new Set();
        slotSets[newKey].add(clientId);
      }
    }
  }

  const counts: Record<string, number> = {};
  for (const [key, set] of Object.entries(slotSets)) {
    counts[key] = set.size;
  }

  return NextResponse.json(counts);
}
