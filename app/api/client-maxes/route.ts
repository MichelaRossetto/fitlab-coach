import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Server-side client con service role key — bypassa RLS
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get("client_id");
  if (!clientId) return NextResponse.json({ error: "missing client_id" }, { status: 400 });

  const { data, error } = await adminSupabase
    .from("client_maxes")
    .select("exercise_name, weight_kg, recorded_at")
    .eq("client_id", clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { client_id, rows, cleared } = await req.json();
  if (!client_id) return NextResponse.json({ error: "missing client_id" }, { status: 400 });

  if (cleared?.length > 0) {
    const { error } = await adminSupabase
      .from("client_maxes")
      .delete()
      .eq("client_id", client_id)
      .in("exercise_name", cleared);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (rows?.length > 0) {
    const { error } = await adminSupabase
      .from("client_maxes")
      .upsert(rows, { onConflict: "client_id,exercise_name" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
