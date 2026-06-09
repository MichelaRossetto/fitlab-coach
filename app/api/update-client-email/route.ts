import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Admin client con service role — può modificare auth.users
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { oldEmail, newEmail } = await req.json();

  if (!oldEmail || !newEmail || oldEmail === newEmail) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Cerca l'utente Auth con la vecchia email
  const { data: { users }, error: listErr } = await adminSupabase.auth.admin.listUsers();
  if (listErr) {
    return NextResponse.json({ error: listErr.message }, { status: 500 });
  }

  const user = users.find(u => u.email === oldEmail);
  if (!user) {
    // Il cliente non ha ancora un account → nessun problema
    return NextResponse.json({ ok: true, noAuthUser: true });
  }

  // Aggiorna l'email in auth.users (email_confirm:true = nessuna mail di conferma)
  const { error: updateErr } = await adminSupabase.auth.admin.updateUserById(user.id, {
    email: newEmail,
    email_confirm: true,
  });

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
