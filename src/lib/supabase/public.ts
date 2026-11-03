import { createClient } from "@supabase/supabase-js";

/** Cliente anónimo sin sesión. Solo para lecturas públicas (protegidas por RLS), seguro dentro de `"use cache"`. */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en el entorno.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
