"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/features/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils/search";
import { categoriaSchema, type CategoriaResult } from "./schema";

function refresh() {
  updateTag("categorias");
  updateTag("establecimientos");
  revalidatePath("/admin/categorias");
}

export async function guardarCategoria(formData: FormData): Promise<CategoriaResult> {
  await requireAdmin();
  const parsed = categoriaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { ok: false, message: "Revisa los campos marcados.", fieldErrors };
  }
  const { id, ...values } = parsed.data;
  const supabase = await createClient();

  const { data: duplicada } = await supabase.from("categorias").select("id").ilike("nombre", values.nombre.replace(/[%_\\]/g, "\\$&")).is("deleted_at", null).neq("id", id ? Number(id) : 0).limit(1);
  if (duplicada?.length) return { ok: false, message: "Revisa los campos marcados.", fieldErrors: { nombre: "Ya existe una categoría con ese nombre." } };

  if (!id) {
    const base = slugify(values.nombre) || "categoria";
    const { data: existentes } = await supabase.from("categorias").select("slug").like("slug", `${base}%`).is("deleted_at", null);
    const taken = new Set((existentes ?? []).map((r) => r.slug));
    let slug = base;
    for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
    const { error } = await supabase.from("categorias").insert({ ...values, slug });
    if (error) {
      console.error("crear categoria:", error.message);
      return { ok: false, message: "No se pudo crear la categoría." };
    }
  } else {
    const { error } = await supabase.from("categorias").update(values).eq("id", Number(id)).is("deleted_at", null);
    if (error) {
      console.error("actualizar categoria:", error.message);
      return { ok: false, message: "No se pudieron guardar los cambios." };
    }
  }
  refresh();
  return { ok: true, message: id ? "Categoría actualizada." : "Categoría creada." };
}

export async function eliminarCategoria(id: number): Promise<CategoriaResult> {
  await requireAdmin();
  if (!Number.isInteger(id) || id <= 0) return { ok: false, message: "Categoría no válida." };
  const supabase = await createClient();
  const { count } = await supabase.from("establecimientos").select("id", { count: "exact", head: true }).eq("categoria_id", id).is("deleted_at", null);
  if (count) return { ok: false, message: `No se puede eliminar: tiene ${count} ${count === 1 ? "establecimiento asociado" : "establecimientos asociados"}. Reasígnalos o desactiva la categoría.` };
  const { error } = await supabase.from("categorias").update({ deleted_at: new Date().toISOString() }).eq("id", id).is("deleted_at", null);
  if (error) {
    console.error("eliminar categoria:", error.message);
    return { ok: false, message: "No se pudo eliminar la categoría." };
  }
  refresh();
  return { ok: true, message: "Categoría eliminada." };
}
