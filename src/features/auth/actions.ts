"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/features/auth/dal";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { message: string };
export type RecoveryState = { message: string; sent?: boolean };
export type PasswordState = { ok: boolean; message: string; fieldErrors?: Partial<Record<"contrasena" | "confirmar", string>> };

const loginSchema = z.object({ correo: z.email().max(255), contrasena: z.string().min(1).max(200) });
const recoverySchema = z.object({ correo: z.email().max(255) });
const passwordSchema = z
  .object({
    contrasena: z.string().min(8, "Usa al menos 8 caracteres.").max(200),
    confirmar: z.string().max(200),
  })
  .refine((d) => d.contrasena === d.confirmar, { message: "Las contraseñas no coinciden.", path: ["confirmar"] });
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

/** Envía el correo de recuperación. Responde siempre igual para no revelar si el correo existe. */
export async function solicitarRecuperacion(_prev: RecoveryState, formData: FormData): Promise<RecoveryState> {
  const parsed = recoverySchema.safeParse({ correo: formData.get("correo") });
  if (!parsed.success) return { message: "Ingresa un correo válido." };

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.correo.toLowerCase(), {
    redirectTo: `${origin}/auth/confirm?next=/admin/definir-contrasena`,
  });
  return { sent: true, message: "Si ese correo está registrado, te enviamos un enlace para restablecer tu contraseña." };
}

/** Define una nueva contraseña con la sesión de recuperación/invitación ya confirmada. */
export async function actualizarContrasena(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  await requireAdmin();
  const parsed = passwordSchema.safeParse({ contrasena: formData.get("contrasena"), confirmar: formData.get("confirmar") });
  if (!parsed.success) {
    const fieldErrors: NonNullable<PasswordState["fieldErrors"]> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0]) as "contrasena" | "confirmar"] ??= issue.message;
    return { ok: false, message: "Revisa los campos marcados.", fieldErrors };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.contrasena });
  if (error) {
    console.error("actualizarContrasena:", error.message);
    return { ok: false, message: "No se pudo actualizar la contraseña. Inténtalo de nuevo." };
  }
  return { ok: true, message: "Contraseña actualizada correctamente." };
}

const sessionTokensSchema = z.object({
  access_token: z.string().min(10),
  refresh_token: z.string().min(10),
});

/**
 * Canjea los tokens que Supabase Auth entrega en el fragmento `#access_token=...`
 * (invitación de administrador / recuperación) por una sesión en cookies SSR.
 */
export async function establecerSesionDesdeTokens(tokens: { access_token: string; refresh_token: string }): Promise<{ ok: boolean; message?: string }> {
  const parsed = sessionTokensSchema.safeParse(tokens);
  if (!parsed.success) return { ok: false, message: "Enlace de acceso inválido o expirado." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.setSession(parsed.data);
  if (error || !data.user) {
    console.error("establecerSesionDesdeTokens:", error?.message);
    return { ok: false, message: "El enlace expiró o ya fue utilizado." };
  }

  const { data: admin } = await supabase
    .from("administradores")
    .select("id")
    .eq("auth_user_id", data.user.id)
    .eq("activo", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (!admin) {
    await supabase.auth.signOut();
    return { ok: false, message: "Tu cuenta no tiene permisos de administrador activo." };
  }
  return { ok: true };
}
