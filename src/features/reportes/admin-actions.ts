"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { revisionReporteSchema, type RevisionResult } from "./schema";

/** Guarda la revisión de un reporte: estado, observación, administrador revisor y fecha. */
export async function guardarRevisionReporte(formData: FormData): Promise<RevisionResult> {
  const admin = await requireAdmin();
  const parsed = revisionReporteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: NonNullable<RevisionResult["fieldErrors"]> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0]) as "observacion" | "estado"] ??= issue.message;
    return { ok: false, message: "Revisa los campos marcados.", fieldErrors };
  }
  const { id, estado, observacion } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("reportes")
    .update({
      estado,
      observacion_admin: observacion,
      administrador_revision_id: admin.id,
      fecha_revision: new Date().toISOString(),
    })
    .eq("id", id)
    .is("deleted_at", null);
  if (error) {
    console.error("guardarRevisionReporte:", error.message);
    return { ok: false, message: "No se pudo guardar la revisión. Inténtalo de nuevo." };
  }
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Revisión guardada." };
}
