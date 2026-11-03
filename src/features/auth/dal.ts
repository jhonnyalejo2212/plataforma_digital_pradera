import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type Admin = { id: number; nombre: string; correo: string };

/** Administrador activo asociado a la sesión actual, o null. Verifica el token con Supabase Auth. */
export const getAdmin = cache(async (): Promise<Admin | null> => {
  await connection(); // marca el acceso como dinámico: Supabase compara la expiración del token con la hora actual
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("administradores")
    .select("id, nombre, correo")
    .eq("auth_user_id", user.id)
    .eq("activo", true)
    .is("deleted_at", null)
    .maybeSingle();
  return data;
});

export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
