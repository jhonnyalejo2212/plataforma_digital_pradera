"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { administradorSchema, type AdministradorDetalle, type AdministradorResult } from "./schema";

function toFieldErrors(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const map: Record<string, string> = {};
  for (const issue of error.issues) map[String(issue.path[0])] ??= issue.message;
  return map;
}

async function origin() {
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

/** Invita un correo vía Supabase Auth y registra la cuenta en `administradores`. */
export async function invitarAdministrador(formData: FormData): Promise<AdministradorResult> {
  await requireAdmin();
  const parsed = administradorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Revisa los campos marcados.", fieldErrors: toFieldErrors(parsed.error) };
  const nombre = parsed.data.nombre;
  const correo = parsed.data.correo.toLowerCase();

  const supabase = await createClient();
  const { data: existente } = await supabase
    .from("administradores")
    .select("id")
    .ilike("correo", correo.replace(/[%_\\]/g, "\\$&"))
    .is("deleted_at", null)
    .limit(1);
  if (existente?.length) return { ok: false, message: "Revisa los campos marcados.", fieldErrors: { correo: "Ya existe un administrador con ese correo." } };

  const auth = createAdminClient();
  const { data: invite, error: inviteError } = await auth.auth.admin.inviteUserByEmail(correo, {
    redirectTo: `${await origin()}/auth/confirm?next=/admin/definir-contrasena`,
  });
  if (inviteError || !invite.user) {
    console.error("invitarAdministrador:", inviteError?.message);
    const yaExiste = inviteError?.message?.toLowerCase().includes("already been registered");
    return { ok: false, message: yaExiste ? "Ya existe una cuenta de acceso con ese correo." : "No se pudo enviar la invitación. Inténtalo de nuevo." };
  }

  const { error: insertError } = await supabase
    .from("administradores")
    .insert({ auth_user_id: invite.user.id, nombre, correo });
  if (insertError) {
    console.error("invitarAdministrador insert:", insertError.message);
    await auth.auth.admin.deleteUser(invite.user.id).catch(() => {});
    return { ok: false, message: "No se pudo registrar el administrador. Inténtalo de nuevo." };
  }

  revalidatePath("/admin/administradores");
  return { ok: true, message: `Invitación enviada a ${correo}.` };
}

/** Activa o desactiva la cuenta. No permite desactivar la propia cuenta ni dejar el panel sin administradores activos. */
export async function cambiarEstadoAdministrador(id: number, activo: boolean): Promise<AdministradorResult> {
  const admin = await requireAdmin();
  if (!Number.isInteger(id) || id <= 0) return { ok: false, message: "Administrador no válido." };
  if (!activo && id === admin.id) return { ok: false, message: "No puedes desactivar tu propia cuenta." };

  const supabase = await createClient();
  if (!activo) {
    const { count } = await supabase
      .from("administradores")
      .select("id", { count: "exact", head: true })
      .eq("activo", true)
      .is("deleted_at", null)
      .neq("id", id);
    if ((count ?? 0) === 0) return { ok: false, message: "Debe quedar al menos un administrador activo." };
  }

  const { error } = await supabase.from("administradores").update({ activo }).eq("id", id).is("deleted_at", null);
  if (error) {
    console.error("cambiarEstadoAdministrador:", error.message);
    return { ok: false, message: "No se pudo actualizar el estado." };
  }
  revalidatePath("/admin/administradores");
  return { ok: true, message: activo ? "Cuenta activada." : "Cuenta desactivada." };
}

/** Datos completos de una cuenta para el modal de detalle. */
export async function obtenerDetalleAdministrador(id: number): Promise<AdministradorDetalle | null> {
  await requireAdmin();
  if (!Number.isInteger(id) || id <= 0) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("administradores")
    .select("id, nombre, correo, auth_user_id, activo, created_at")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) return null;
  const { data: establecimientos } = await supabase
    .from("establecimientos")
    .select("id, nombre, slug, estado_publicacion")
    .eq("administrador_id", id)
    .is("deleted_at", null)
    .order("nombre");
  return { ...data, establecimientos: establecimientos ?? [] };
}

/**
 * Reenvía el correo de acceso al administrador para que pueda definir su contraseña.
 * Si aún no había confirmado la invitación usa `inviteUserByEmail`; si ya estaba confirmado,
 * envía un enlace de restablecimiento de contraseña que apunta al mismo formulario.
 */
export async function reenviarInvitacionAdministrador(id: number): Promise<AdministradorResult> {
  await requireAdmin();
  if (!Number.isInteger(id) || id <= 0) return { ok: false, message: "Administrador no válido." };

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("administradores")
    .select("id, nombre, correo, auth_user_id, activo")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!target) return { ok: false, message: "No se encontró el administrador." };
  if (!target.activo) return { ok: false, message: "Activa primero la cuenta antes de enviar el enlace." };

  const redirectTo = `${await origin()}/auth/confirm?next=/admin/definir-contrasena`;
  const auth = createAdminClient();
  const { error: inviteError } = await auth.auth.admin.inviteUserByEmail(target.correo, { redirectTo });
  if (!inviteError) return { ok: true, message: `Invitación reenviada a ${target.correo}.` };

  const { error: resetError } = await supabase.auth.resetPasswordForEmail(target.correo, { redirectTo });
  if (!resetError) return { ok: true, message: `Enlace de acceso enviado a ${target.correo}.` };

  // El correo no se pudo enviar (p. ej. límite de envío del SMTP integrado): generar el enlace
  // manualmente para que un administrador lo comparta directamente.
  const { data: authUser } = await auth.auth.admin.getUserById(target.auth_user_id);
  const linkType = authUser?.user?.confirmed_at ? "recovery" : "invite";
  const { data: link, error: linkError } = await auth.auth.admin.generateLink({ type: linkType, email: target.correo, options: { redirectTo } });
  const actionLink = link?.properties?.action_link;
  if (linkError || !actionLink) {
    console.error("reenviarInvitacionAdministrador:", inviteError.message, resetError.message, linkError?.message);
    return { ok: false, message: "No se pudo generar el acceso. Inténtalo de nuevo más tarde." };
  }
  return { ok: true, message: `El correo no pudo enviarse por el límite de envío. Copia y comparte este enlace con ${target.nombre}:`, actionLink };
}
