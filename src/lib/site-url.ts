import "server-only";
import { headers } from "next/headers";

/**
 * Origen público del sitio para armar enlaces de correo (invitación, recuperación).
 * Usa `NEXT_PUBLIC_SITE_URL` si está definida; si no, el host de la petición actual.
 */
export async function siteOrigin() {
  const fixed = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (fixed) return fixed;
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

export const AUTH_REDIRECT_PATH = "/auth/confirm?next=/admin/definir-contrasena";
