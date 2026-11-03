"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/features/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { deleteObject, uploadObject } from "@/lib/storage/r2";
import { MAX_IMAGEN_BYTES, MAX_IMAGENES } from "./detail-constants";
import { contactosSchema, horariosSchema, issuesToFieldErrors, productosSchema, type ActionResult } from "./detail-schemas";

type ContactoRow = { id: number; tipo: string; valor: string; etiqueta: string | null };
type ProductoRow = { id: number; nombre: string; descripcion: string | null; tipo: string; precio: number | null; disponible: boolean };
const fail = (message: string, fieldErrors?: Record<string, string>): ActionResult<never> => ({ ok: false, message, fieldErrors });
const validId = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n > 0;

async function context(establecimientoId: number) {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("establecimientos").select("id, slug").eq("id", establecimientoId).is("deleted_at", null).maybeSingle();
  return data ? { supabase, id: data.id, slug: data.slug } : null;
}

function invalidate(id: number, slug: string) {
  updateTag("establecimientos");
  updateTag(`establecimiento:${slug}`);
  revalidatePath(`/admin/establecimientos/${id}`);
}

/* ------------------------------------------------------------------ Imágenes */

function detectImageType(bytes: Uint8Array): { type: "image/webp" | "image/jpeg"; ext: "webp" | "jpg" } | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (bytes.length > 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { type: "image/webp", ext: "webp" };
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { type: "image/jpeg", ext: "jpg" };
  return null;
}

export async function subirImagen(formData: FormData): Promise<ActionResult> {
  const establecimientoId = Number(formData.get("establecimiento_id"));
  const file = formData.get("file");
  if (!validId(establecimientoId) || !(file instanceof File)) return fail("Solicitud no válida.");
  if (file.size === 0 || file.size > MAX_IMAGEN_BYTES) return fail("La imagen es demasiado pesada. Se reduce automáticamente; inténtalo con otra foto.");
  const ctx = await context(establecimientoId);
  if (!ctx) return fail("El establecimiento no existe.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectImageType(bytes);
  if (!detected) return fail("Formato no permitido. Solo se aceptan imágenes WebP o JPEG.");

  const { data: existentes } = await ctx.supabase.from("imagenes").select("id, orden").eq("establecimiento_id", ctx.id).is("deleted_at", null);
  if ((existentes?.length ?? 0) >= MAX_IMAGENES) return fail(`Máximo ${MAX_IMAGENES} fotografías por establecimiento.`);

  const key = `establecimientos/${ctx.id}/${crypto.randomUUID()}.${detected.ext}`;
  let url: string;
  try {
    url = await uploadObject(key, bytes, detected.type);
  } catch (e) {
    console.error("subirImagen R2:", e);
    return fail("No se pudo guardar la imagen en el almacenamiento.");
  }
  const { data: est } = await ctx.supabase.from("establecimientos").select("nombre").eq("id", ctx.id).single();
  const { error } = await ctx.supabase.from("imagenes").insert({
    establecimiento_id: ctx.id,
    url,
    storage_key: key,
    texto_alternativo: est?.nombre ?? null,
    es_principal: (existentes?.length ?? 0) === 0,
    orden: Math.max(-1, ...(existentes ?? []).map((i) => i.orden)) + 1,
  });
  if (error) {
    console.error("subirImagen DB:", error.message);
    await deleteObject(key).catch(() => {});
    return fail("No se pudo registrar la imagen.");
  }
  invalidate(ctx.id, ctx.slug);
  return { ok: true, message: "Imagen subida." };
}

async function imageContext(imagenId: number) {
  if (!validId(imagenId)) return null;
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("imagenes").select("id, establecimiento_id, storage_key, es_principal").eq("id", imagenId).is("deleted_at", null).maybeSingle();
  if (!data) return null;
  const ctx = await context(data.establecimiento_id);
  return ctx ? { ...ctx, imagen: data } : null;
}

export async function eliminarImagen(imagenId: number): Promise<ActionResult> {
  const ctx = await imageContext(imagenId);
  if (!ctx) return fail("La imagen no existe.");
  const { error } = await ctx.supabase.from("imagenes").delete().eq("id", imagenId);
  if (error) return fail("No se pudo eliminar la imagen.");
  if (ctx.imagen.storage_key) await deleteObject(ctx.imagen.storage_key).catch((e) => console.error("eliminarImagen R2:", e));
  if (ctx.imagen.es_principal) {
    const { data: siguiente } = await ctx.supabase.from("imagenes").select("id").eq("establecimiento_id", ctx.id).is("deleted_at", null).order("orden").limit(1).maybeSingle();
    if (siguiente) await ctx.supabase.from("imagenes").update({ es_principal: true }).eq("id", siguiente.id);
  }
  invalidate(ctx.id, ctx.slug);
  return { ok: true, message: "Imagen eliminada." };
}

export async function establecerPortada(imagenId: number): Promise<ActionResult> {
  const ctx = await imageContext(imagenId);
  if (!ctx) return fail("La imagen no existe.");
  await ctx.supabase.from("imagenes").update({ es_principal: false }).eq("establecimiento_id", ctx.id).eq("es_principal", true);
  const { error } = await ctx.supabase.from("imagenes").update({ es_principal: true }).eq("id", imagenId);
  if (error) return fail("No se pudo cambiar la portada.");
  invalidate(ctx.id, ctx.slug);
  return { ok: true, message: "Portada actualizada." };
}

export async function reordenarImagenes(establecimientoId: number, ids: number[]): Promise<ActionResult> {
  if (!validId(establecimientoId) || !Array.isArray(ids) || !ids.every(validId)) return fail("Solicitud no válida.");
  const ctx = await context(establecimientoId);
  if (!ctx) return fail("El establecimiento no existe.");
  const { data: propias } = await ctx.supabase.from("imagenes").select("id").eq("establecimiento_id", ctx.id).is("deleted_at", null);
  const permitidas = new Set((propias ?? []).map((i) => i.id));
  if (ids.some((i) => !permitidas.has(i))) return fail("Solicitud no válida.");
  await Promise.all(ids.map((id, orden) => ctx.supabase.from("imagenes").update({ orden }).eq("id", id)));
  invalidate(ctx.id, ctx.slug);
  return { ok: true, message: "Orden actualizado." };
}

export async function actualizarTextoAlternativo(imagenId: number, texto: string): Promise<ActionResult> {
  const ctx = await imageContext(imagenId);
  if (!ctx) return fail("La imagen no existe.");
  const limpio = String(texto ?? "").trim().slice(0, 255);
  const { error } = await ctx.supabase.from("imagenes").update({ texto_alternativo: limpio || null }).eq("id", imagenId);
  if (error) return fail("No se pudo guardar el texto.");
  invalidate(ctx.id, ctx.slug);
  return { ok: true, message: "Texto guardado." };
}

/* ------------------------------------------------------------------ Horarios */

export async function guardarHorarios(establecimientoId: number, input: unknown): Promise<ActionResult> {
  if (!validId(establecimientoId)) return fail("Solicitud no válida.");
  const ctx = await context(establecimientoId);
  if (!ctx) return fail("El establecimiento no existe.");
  const parsed = horariosSchema.safeParse(input);
  if (!parsed.success) return fail("Revisa los horarios marcados.", issuesToFieldErrors(parsed.error.issues));

  const { data: existentes } = await ctx.supabase.from("horarios").select("id, dia_semana").eq("establecimiento_id", ctx.id).is("deleted_at", null);
  const porDia = new Map((existentes ?? []).map((h) => [h.dia_semana, h.id]));
  const results = await Promise.all(
    parsed.data.map((r) => {
      const valores = { cerrado: r.cerrado, hora_apertura: r.cerrado ? null : r.apertura, hora_cierre: r.cerrado ? null : r.cierre, observacion: r.observacion || null };
      const id = porDia.get(r.dia);
      return id
        ? ctx.supabase.from("horarios").update(valores).eq("id", id)
        : ctx.supabase.from("horarios").insert({ establecimiento_id: ctx.id, dia_semana: r.dia, ...valores });
    }),
  );
  if (results.some((r) => r.error)) {
    console.error("guardarHorarios:", results.find((r) => r.error)?.error?.message);
    return fail("No se pudieron guardar los horarios.");
  }
  invalidate(ctx.id, ctx.slug);
  return { ok: true, message: "Horarios guardados." };
}

/* ------------------------------------------------------- Contactos y Oferta */

async function syncRows(ctx: NonNullable<Awaited<ReturnType<typeof context>>>, table: "medios_contacto" | "productos_servicios", rows: ({ id?: number } & Record<string, unknown>)[]) {
  const { data: existentes } = await ctx.supabase.from(table).select("id").eq("establecimiento_id", ctx.id).is("deleted_at", null);
  const actuales = new Set((existentes ?? []).map((r) => r.id));
  const conservar = new Set(rows.map((r) => r.id).filter((id): id is number => id !== undefined && actuales.has(id)));
  const operaciones = [
    ...[...actuales].filter((id) => !conservar.has(id)).map((id) => ctx.supabase.from(table).update({ deleted_at: new Date().toISOString() }).eq("id", id)),
    ...rows.map(({ id, ...valores }) =>
      id !== undefined && actuales.has(id)
        ? ctx.supabase.from(table).update(valores).eq("id", id)
        : ctx.supabase.from(table).insert({ establecimiento_id: ctx.id, ...valores } as never),
    ),
  ];
  const results = await Promise.all(operaciones);
  return results.find((r) => r.error)?.error?.message;
}

export async function guardarContactos(establecimientoId: number, input: unknown): Promise<ActionResult<ContactoRow[]>> {
  if (!validId(establecimientoId)) return fail("Solicitud no válida.");
  const ctx = await context(establecimientoId);
  if (!ctx) return fail("El establecimiento no existe.");
  const parsed = contactosSchema.safeParse(input);
  if (!parsed.success) return fail("Revisa los medios de contacto marcados.", issuesToFieldErrors(parsed.error.issues));
  const err = await syncRows(ctx, "medios_contacto", parsed.data);
  if (err) {
    console.error("guardarContactos:", err);
    return fail("No se pudieron guardar los contactos.");
  }
  invalidate(ctx.id, ctx.slug);
  const { data } = await ctx.supabase.from("medios_contacto").select("id, tipo, valor, etiqueta").eq("establecimiento_id", ctx.id).is("deleted_at", null).order("id");
  return { ok: true, message: "Contactos guardados.", data: data ?? [] };
}

export async function guardarProductos(establecimientoId: number, input: unknown): Promise<ActionResult<ProductoRow[]>> {
  if (!validId(establecimientoId)) return fail("Solicitud no válida.");
  const ctx = await context(establecimientoId);
  if (!ctx) return fail("El establecimiento no existe.");
  const parsed = productosSchema.safeParse(input);
  if (!parsed.success) return fail("Revisa los elementos marcados.", issuesToFieldErrors(parsed.error.issues));
  const err = await syncRows(ctx, "productos_servicios", parsed.data);
  if (err) {
    console.error("guardarProductos:", err);
    return fail("No se pudo guardar la oferta.");
  }
  invalidate(ctx.id, ctx.slug);
  const { data } = await ctx.supabase.from("productos_servicios").select("id, nombre, descripcion, tipo, precio, disponible").eq("establecimiento_id", ctx.id).is("deleted_at", null).order("id");
  return { ok: true, message: "Oferta guardada.", data: data ?? [] };
}
