import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

/**
 * Cliente Supabase server-side, usando a chave de serviço (bypassa RLS).
 * Nunca importar este módulo em código que roda no navegador.
 */
export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
