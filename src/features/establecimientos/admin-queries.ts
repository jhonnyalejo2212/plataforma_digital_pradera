import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getFormOptions() {
  const supabase = await createClient();
  const [categorias, administradores] = await Promise.all([
    supabase.from("categorias").select("id, nombre").is("deleted_at", null).order("orden"),
    supabase.from("administradores").select("id, nombre").eq("activo", true).is("deleted_at", null).order("nombre"),
  ]);
  return { categorias: categorias.data ?? [], administradores: administradores.data ?? [] };
}

export async function getEstablecimientoAdmin(id: number) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("establecimientos")
    .select("id, nombre, slug, categoria_id, estado_publicacion, administrador_id, descripcion, direccion, barrio, latitud, longitud")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  return data;
}

export async function getDetalleAdmin(id: number) {
  const supabase = await createClient();
  const [imagenes, horarios, contactos, productos] = await Promise.all([
    supabase.from("imagenes").select("id, url, texto_alternativo, es_principal, orden").eq("establecimiento_id", id).is("deleted_at", null).order("orden"),
    supabase.from("horarios").select("dia_semana, hora_apertura, hora_cierre, cerrado, observacion").eq("establecimiento_id", id).is("deleted_at", null).order("dia_semana"),
    supabase.from("medios_contacto").select("id, tipo, valor, etiqueta").eq("establecimiento_id", id).is("deleted_at", null).order("id"),
    supabase.from("productos_servicios").select("id, nombre, descripcion, tipo, precio, disponible").eq("establecimiento_id", id).is("deleted_at", null).order("id"),
  ]);
  return {
    imagenes: imagenes.data ?? [],
    horarios: horarios.data ?? [],
    contactos: contactos.data ?? [],
    productos: productos.data ?? [],
  };
}
