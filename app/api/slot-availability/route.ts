import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/slot-availability?exclude_client=xxx
// Returns: Record<"dow:time", count> — number of clients in each slot, excluding the given client
export async function GET(req: NextRequest) {
  const excludeClientId = req.nextUrl.searchParams.get("exclude_client");

  let query = adminSupabase.from("client_schedule").select("day_of_week, time");
  if (excludeClientId) query = query.neq("client_id", excludeClientId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const counts: Record<string, number> = {};
  (data ?? []).forEach((row: { day_of_week: number; time: string }) => {
    const normalizedTime = row.time.slice(0, 5); // "18:00:00" → "18:00"
    const key = `${row.day_of_week}:${normalizedTime}`;
    counts[key] = (counts[key] ?? 0) + 1;
  });

  return NextResponse.json(counts);
}
