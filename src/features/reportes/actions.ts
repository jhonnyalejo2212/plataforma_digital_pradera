"use server";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { reporteSchema, type ReporteState } from "./schema";

const MAX_REPORTES_POR_HORA = 3;

export async function crearReporte(_prev: ReporteState, formData: FormData): Promise<ReporteState> {
  const parsed = reporteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: NonNullable<ReporteState["fieldErrors"]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "nombre" || key === "correo" || key === "descripcion") fieldErrors[key] ??= key === "correo" ? "Ingresa un correo válido." : issue.message;
    }
    // Un honeypot lleno se responde como éxito para no dar pistas a bots.
    if (parsed.error.issues.some((i) => i.path[0] === "website")) return { ok: true, message: "Gracias, recibimos tu reporte." };
    return { ok: false, message: "Revisa los campos marcados.", fieldErrors };
  }
  const { slug, nombre, correo, descripcion } = parsed.data;

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "desconocida";
  const ipHash = createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").update(ip).digest("hex");

  const supabase = createAdminClient();
  const desde = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase.from("reportes").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", desde);
  if ((count ?? 0) >= MAX_REPORTES_POR_HORA) return { ok: false, message: "Has enviado varios reportes recientemente. Inténtalo de nuevo más tarde." };

  const { data: establecimiento } = await supabase.from("establecimientos").select("id").eq("slug", slug).eq("estado_publicacion", "publicado").is("deleted_at", null).maybeSingle();
  if (!establecimiento) return { ok: false, message: "No encontramos el establecimiento que intentas reportar." };

  const { error } = await supabase.from("reportes").insert({
    establecimiento_id: establecimiento.id,
    nombre_reportante: nombre,
    correo_reportante: correo,
    descripcion,
    ip_hash: ipHash,
  });
  if (error) {
    console.error("crearReporte:", error.message);
    return { ok: false, message: "No pudimos registrar tu reporte. Inténtalo de nuevo." };
  }
  return { ok: true, message: "Gracias, recibimos tu reporte. Un administrador lo revisará." };
}
