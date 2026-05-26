import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get("client_id");
  if (!clientId) return NextResponse.json({ error: "missing client_id" }, { status: 400 });

  const { data, error } = await adminSupabase
    .from("client_schedule")
    .select("day_of_week, time")
    .eq("client_id", clientId)
    .order("day_of_week");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { client_id, rows } = await req.json();
  if (!client_id) return NextResponse.json({ error: "missing client_id" }, { status: 400 });

  const { error: delErr } = await adminSupabase
    .from("client_schedule")
    .delete()
    .eq("client_id", client_id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  if (rows?.length > 0) {
    const { error: insErr } = await adminSupabase
      .from("client_schedule")
      .insert(rows);
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
