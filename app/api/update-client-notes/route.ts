import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { client_id, notes } = await req.json();
  if (!client_id) return NextResponse.json({ error: "missing client_id" }, { status: 400 });

  const { error } = await adminSupabase
    .from("clients")
    .update({ notes: notes?.trim() || null })
    .eq("id", client_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
