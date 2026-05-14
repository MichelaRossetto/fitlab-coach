import { createBrowserClient } from "@supabase/ssr";

// createBrowserClient salva la sessione nei cookie (leggibile dal middleware)
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
