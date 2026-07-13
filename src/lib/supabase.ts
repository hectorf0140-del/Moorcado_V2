/**
 * Cliente de Supabase (singleton).
 * La anon key es pública por diseño — la seguridad real la dan las
 * políticas RLS en la base de datos.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://kgqdygraodpbowtuqvgp.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtncWR5Z3Jhb2RwYm93dHVxdmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMTc1ODUsImV4cCI6MjA5ODc5MzU4NX0.s6xxTb9iu5-IqrSt9WkBVaDFJkq3NLnDcfsfvVtwy1c";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});
