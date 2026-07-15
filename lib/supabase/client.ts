import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Cliente para usar en componentes de cliente (respeta RLS vía sesión del usuario). */
export function getBrowserSupabase(): SupabaseClient {
  return createClient(url, anonKey);
}

/**
 * Cliente para usar SOLO en route handlers / server actions, con la
 * service role key (bypassea RLS). Nunca importar este archivo desde
 * un componente de cliente ni exponer SUPABASE_SERVICE_ROLE_KEY al browser.
 */
export function getServerSupabase(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
