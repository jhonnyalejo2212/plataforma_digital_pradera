"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/features/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { moderacionValoracionSchema, type ModeracionResult } from "./schema";

const MENSAJES = { aprobada: "Valoración aprobada y publicada.", rechazada: "Valoración rechazada.", pendiente: "Valoración devuelta a pendiente." };

/** Cambia el estado de moderación de una valoración y actualiza la caché pública. */
export async function moderarValoracion(formData: FormData): Promise<ModeracionResult> {
  await requireAdmin();
  const parsed = moderacionValoracionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Valoración no válida." };
  const { id, estado } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("valoraciones")
    .update({ estado })
    .eq("id", id)
    .is("deleted_at", null)
    .select("establecimientos(slug)")
    .maybeSingle<{ establecimientos: { slug: string } | null }>();
  if (error || !data) {
    if (error) console.error("moderarValoracion:", error.message);
    return { ok: false, message: "No se pudo actualizar la valoración. Inténtalo de nuevo." };
  }
  updateTag("establecimientos");
  if (data.establecimientos) updateTag(`establecimiento:${data.establecimientos.slug}`);
  revalidatePath("/admin", "layout");
  return { ok: true, message: MENSAJES[estado] };
}

/** Elimina (borrado lógico) una valoración y actualiza la caché pública. */
export async function eliminarValoracion(id: number): Promise<ModeracionResult> {
  await requireAdmin();
  if (!Number.isInteger(id) || id <= 0) return { ok: false, message: "Valoración no válida." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("valoraciones")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select("establecimientos(slug)")
    .maybeSingle<{ establecimientos: { slug: string } | null }>();
  if (error || !data) {
    if (error) console.error("eliminarValoracion:", error.message);
    return { ok: false, message: "No se pudo eliminar la valoración. Inténtalo de nuevo." };
  }
  updateTag("establecimientos");
  if (data.establecimientos) updateTag(`establecimiento:${data.establecimientos.slug}`);
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Valoración eliminada." };
}
