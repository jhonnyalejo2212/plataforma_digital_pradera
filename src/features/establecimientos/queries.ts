import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { sanitizeSearch } from "@/lib/utils/search";
import type { Categoria, EstablecimientoDetalle, EstablecimientoResumen, FiltrosDirectorio, Imagen } from "./types";

export const PAGE_SIZE = 9;

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const RESUMEN_SELECT = "id, nombre, slug, direccion, barrio, categorias!inner(nombre, slug), imagenes(url, texto_alternativo, es_principal, orden)";

function principal(imagenes: Imagen[] | null) {
  const sorted = [...(imagenes ?? [])].sort((a, b) => Number(b.es_principal) - Number(a.es_principal) || a.orden - b.orden);
  return sorted[0] ?? null;
}

function toResumen(row: Row): EstablecimientoResumen {
  const img = principal(row.imagenes);
  return {
    id: row.id,
    nombre: row.nombre,
    slug: row.slug,
    direccion: row.direccion,
    barrio: row.barrio,
    categoria: row.categorias,
    imagen: img ? { url: img.url, alt: img.texto_alternativo ?? row.nombre } : null,
  };
}


export async function getCategorias(): Promise<Categoria[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("categorias", "establecimientos");
  const { data, error } = await createPublicClient()
    .from("categorias")
    .select("id, nombre, slug, descripcion, icono, tono, establecimientos(count)")
    .order("orden");
  if (error) throw error;
  return (data as Row[]).map((c) => ({ ...c, total: c.establecimientos?.[0]?.count ?? 0 })) as Categoria[];
}

export async function getDestacados(limit = 3): Promise<EstablecimientoResumen[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("establecimientos");
  const { data, error } = await createPublicClient()
    .from("establecimientos")
    .select(RESUMEN_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as Row[]).map(toResumen);
}

export async function getBarrios(): Promise<{ nombre: string; total: number }[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("establecimientos");
  const { data, error } = await createPublicClient().from("establecimientos").select("barrio").not("barrio", "is", null);
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const { barrio } of data as { barrio: string }[]) counts.set(barrio, (counts.get(barrio) ?? 0) + 1);
  return [...counts].map(([nombre, total]) => ({ nombre, total })).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export async function listEstablecimientos(filtros: FiltrosDirectorio): Promise<{ items: EstablecimientoResumen[]; total: number }> {
  "use cache";
  cacheLife("minutes");
  cacheTag("establecimientos");
  const { q, categoria, barrio, orden, pagina } = filtros;
  let query = createPublicClient().from("establecimientos").select(RESUMEN_SELECT, { count: "exact" });
  const term = q ? sanitizeSearch(q) : "";
  if (term) query = query.or(["nombre", "descripcion", "direccion", "barrio"].map((c) => `${c}.ilike.%${term}%`).join(","));
  if (categoria) query = query.eq("categorias.slug", categoria);
  if (barrio) query = query.eq("barrio", barrio);
  if (orden === "recientes") query = query.order("created_at", { ascending: false });
  else if (orden === "antiguos") query = query.order("created_at");
  else if (orden === "nombre_desc") query = query.order("nombre", { ascending: false });
  else query = query.order("nombre");
  const from = (pagina - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) throw error;
  return { items: (data as Row[]).map(toResumen), total: count ?? 0 };
}

export async function getEstablecimientoBySlug(slug: string): Promise<EstablecimientoDetalle | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("establecimientos", `establecimiento:${slug}`);
  const { data, error } = await createPublicClient()
    .from("establecimientos")
    .select(
      "id, nombre, slug, descripcion, direccion, barrio, latitud, longitud, categorias!inner(nombre, slug), imagenes(url, texto_alternativo, es_principal, orden), horarios(dia_semana, hora_apertura, hora_cierre, cerrado, observacion), medios_contacto(tipo, valor, etiqueta), productos_servicios(id, nombre, descripcion, tipo, precio, disponible)",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as Row;
  const imagenes = [...(row.imagenes as Imagen[])].sort((a, b) => Number(b.es_principal) - Number(a.es_principal) || a.orden - b.orden);
  return {
    ...toResumen(row),
    descripcion: row.descripcion,
    latitud: row.latitud,
    longitud: row.longitud,
    imagenes,
    horarios: [...row.horarios].sort((a, b) => a.dia_semana - b.dia_semana),
    contactos: row.medios_contacto,
    productos: row.productos_servicios,
  };
}
