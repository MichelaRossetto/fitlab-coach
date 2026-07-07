import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET — lista feedback (coach)
export async function GET() {
  const { data, error } = await adminSupabase
    .from("feedback")
    .select("id, client_id, type, message, created_at, read, clients(name, surname)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — invia feedback (cliente)
export async function POST(req: NextRequest) {
  const { client_id, type, message } = await req.json();
  if (!client_id || !message?.trim()) return NextResponse.json({ error: "missing fields" }, { status: 400 });
  const { error } = await adminSupabase.from("feedback").insert({ client_id, type, message });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// PATCH — segna come letto
export async function PATCH(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const { error } = await adminSupabase.from("feedback").update({ read: true }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE — elimina messaggio
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const { error } = await adminSupabase.from("feedback").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
