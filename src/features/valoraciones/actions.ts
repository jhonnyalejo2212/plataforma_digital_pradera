"use server";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { valoracionSchema, type ValoracionState } from "./schema";

const MAX_VALORACIONES_POR_DIA = 5;

export async function crearValoracion(_prev: ValoracionState, formData: FormData): Promise<ValoracionState> {
  const parsed = valoracionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    // Un honeypot lleno se responde como éxito para no dar pistas a bots.
    if (parsed.error.issues.some((i) => i.path[0] === "website")) return { ok: true, message: "Gracias, recibimos tu valoración." };
    const fieldErrors: NonNullable<ValoracionState["fieldErrors"]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "puntuacion" || key === "comentario" || key === "nombre") fieldErrors[key] ??= issue.message;
    }
    return { ok: false, message: "Revisa los campos marcados.", fieldErrors };
  }
  const { slug, puntuacion, comentario, nombre } = parsed.data;

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "desconocida";
  const ipHash = createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").update(ip).digest("hex");

  const supabase = createAdminClient();
  const { data: establecimiento } = await supabase.from("establecimientos").select("id").eq("slug", slug).eq("estado_publicacion", "publicado").is("deleted_at", null).maybeSingle();
  if (!establecimiento) return { ok: false, message: "No encontramos el establecimiento que intentas valorar." };

  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: recientes } = await supabase.from("valoraciones").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", desde);
  if ((recientes ?? 0) >= MAX_VALORACIONES_POR_DIA) return { ok: false, message: "Has enviado varias valoraciones recientemente. Inténtalo de nuevo más tarde." };

  const { count: yaValoro } = await supabase.from("valoraciones").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).eq("establecimiento_id", establecimiento.id).is("deleted_at", null);
  if ((yaValoro ?? 0) > 0) return { ok: false, message: "Ya enviaste una valoración para este establecimiento." };

  const { error } = await supabase.from("valoraciones").insert({
    establecimiento_id: establecimiento.id,
    puntuacion,
    comentario,
    nombre_autor: nombre,
    ip_hash: ipHash,
  });
  if (error) {
    console.error("crearValoracion:", error.message);
    return { ok: false, message: "No pudimos registrar tu valoración. Inténtalo de nuevo." };
  }
  return { ok: true, message: "Gracias, recibimos tu valoración. Se publicará cuando un administrador la apruebe." };
}
