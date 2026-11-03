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
