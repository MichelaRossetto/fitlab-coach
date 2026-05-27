import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Stessi slot del calendario principale
const DISPLAY_SLOTS = ["08:00","09:00","10:00","11:00","12:00","13:00","16:00","17:00","18:00","19:00"];

function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// GET /api/slot-availability?exclude_client=xxx
// Returns: Record<"dow:slot", count> — stessa logica overlap del calendario coach
// Un cliente con orario 18:30 viene contato nello slot 18:00 (overlap di 1h)
export async function GET(req: NextRequest) {
  const excludeClientId = req.nextUrl.searchParams.get("exclude_client");

  let query = adminSupabase.from("client_schedule").select("client_id, day_of_week, time");
  if (excludeClientId) query = query.neq("client_id", excludeClientId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Per ogni slot, set di client_id unici che si sovrappongono (come fa il calendario coach)
  const slotSets: Record<string, Set<string>> = {};

  (data ?? []).forEach((row: { client_id: string; day_of_week: number; time: string }) => {
    const T = timeToMin(row.time.slice(0, 5));
    for (const slot of DISPLAY_SLOTS) {
      const H = timeToMin(slot);
      // Stesso overlap check del calendario: finestra 1h del cliente sovrapposta allo slot 1h
      if (T < H + 60 && T + 60 > H) {
        const key = `${row.day_of_week}:${slot}`;
        if (!slotSets[key]) slotSets[key] = new Set();
        slotSets[key].add(row.client_id);
      }
    }
  });

  const counts: Record<string, number> = {};
  for (const [key, set] of Object.entries(slotSets)) {
    counts[key] = set.size;
  }

  return NextResponse.json(counts);
}
