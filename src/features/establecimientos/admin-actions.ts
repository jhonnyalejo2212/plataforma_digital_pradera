"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/features/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils/search";
import { establecimientoSchema, type EstablecimientoFormState } from "./schema";

function invalidate(slug?: string) {
  updateTag("establecimientos");
  updateTag("categorias");
  if (slug) updateTag(`establecimiento:${slug}`);
}

async function uniqueSlug(base: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("establecimientos").select("slug").like("slug", `${base}%`);
  const taken = new Set((data ?? []).map((r) => r.slug));
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
}

export async function guardarEstablecimiento(_prev: EstablecimientoFormState, formData: FormData): Promise<EstablecimientoFormState> {
  await requireAdmin();
  const parsed = establecimientoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { ok: false, message: "Revisa los campos marcados.", fieldErrors };
  }
  const { id, ...values } = parsed.data;
  const supabase = await createClient();

  if (!id) {
    const base = slugify(values.nombre) || "establecimiento";
    const slug = await uniqueSlug(base);
    const { data, error } = await supabase.from("establecimientos").insert({ ...values, slug }).select("id").single();
    if (error) {
      console.error("crear establecimiento:", error.message);
      return { ok: false, message: "No se pudo crear el establecimiento." };
    }
    invalidate(slug);
    redirect(`/admin/establecimientos/${data.id}?creado=1`);
  }

  const { data, error } = await supabase.from("establecimientos").update(values).eq("id", Number(id)).is("deleted_at", null).select("slug").maybeSingle();
  if (error) {
    console.error("actualizar establecimiento:", error.message);
    return { ok: false, message: "No se pudieron guardar los cambios." };
  }
  if (!data) return { ok: false, message: "El establecimiento ya no existe." };
  invalidate(data.slug);
  return { ok: true, message: "Cambios guardados." };
}

export async function eliminarEstablecimiento(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  const supabase = await createClient();
  const { data } = await supabase.from("establecimientos").update({ deleted_at: new Date().toISOString() }).eq("id", id).is("deleted_at", null).select("slug").maybeSingle();
  if (data) invalidate(data.slug);
  redirect("/admin/establecimientos");
}
