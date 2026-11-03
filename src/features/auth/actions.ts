"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { message: string };

const loginSchema = z.object({ correo: z.email().max(255), contrasena: z.string().min(1).max(200) });
const INVALID = "Correo o contraseña incorrectos.";

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ correo: formData.get("correo"), contrasena: formData.get("contrasena") });
  if (!parsed.success) return { message: INVALID };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: parsed.data.correo, password: parsed.data.contrasena });
  if (error || !data.user) return { message: INVALID };

  const { data: admin } = await supabase
    .from("administradores")
    .select("id")
    .eq("auth_user_id", data.user.id)
    .eq("activo", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (!admin) {
    await supabase.auth.signOut();
    return { message: INVALID };
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
