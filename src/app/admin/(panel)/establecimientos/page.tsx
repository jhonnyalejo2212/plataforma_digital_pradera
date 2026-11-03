import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AdminTitle, StatusBadge } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { requireAdmin } from "@/features/auth/dal";
import { ESTADOS_PUBLICACION, formatFecha, type EstadoPublicacion } from "@/features/establecimientos/labels";
import { createClient } from "@/lib/supabase/server";
import { sanitizeSearch } from "@/lib/utils/search";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Establecimientos" };

const PAGE_SIZE = 10;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

type Row = { id: number; nombre: string; slug: string; estado_publicacion: EstadoPublicacion; updated_at: string; categorias: { nombre: string } | null; imagenes: { url: string; es_principal: boolean }[] };

export default async function EstablecimientosAdminPage({ searchParams }: PageProps<"/admin/establecimientos">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = sanitizeSearch(first(sp.q));
  const estado = first(sp.estado);
  const categoria = Number(first(sp.categoria)) || 0;
  const pagina = Math.max(1, Math.min(1000, Number(first(sp.pagina)) || 1));

  const supabase = await createClient();
  let query = supabase
    .from("establecimientos")
    .select("id, nombre, slug, estado_publicacion, updated_at, categorias(nombre), imagenes(url, es_principal)", { count: "exact" })
    .is("deleted_at", null);
  if (q) query = query.or(["nombre", "direccion", "barrio"].map((c) => `${c}.ilike.%${q}%`).join(","));
  if (estado in ESTADOS_PUBLICACION) query = query.eq("estado_publicacion", estado);
  if (categoria) query = query.eq("categoria_id", categoria);
  const from = (pagina - 1) * PAGE_SIZE;
  const [{ data, count }, { data: categorias }] = await Promise.all([
    query.order("updated_at", { ascending: false }).range(from, from + PAGE_SIZE - 1).overrideTypes<Row[], { merge: false }>(),
    supabase.from("categorias").select("id, nombre").is("deleted_at", null).order("orden"),
  ]);
  const total = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (changes: Record<string, string | number>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, estado, categoria: categoria || "", pagina, ...changes })) if (v !== "" && v !== 0 && !(k === "pagina" && v === 1)) p.set(k, String(v));
    return `/admin/establecimientos${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <AdminTitle title="Establecimientos" description="Consulta, registra, edita y cambia el estado de publicación de cada registro." action={<Button href="/admin/establecimientos/nuevo" icon="plus" iconOnlyOnMobile>Registrar establecimiento</Button>} />
      <section className="overflow-hidden rounded-[14px] border border-line bg-white">
        <form className="grid gap-3 border-b border-line p-[18px] md:grid-cols-[1fr_190px_170px_auto]">
          <div className="flex h-11 items-center gap-[9px] rounded-[9px] border border-line pl-[13px] text-muted">
            <Icon name="search" size={18} />
            <input name="q" defaultValue={q} placeholder="Buscar por nombre, dirección o barrio…" className="min-w-0 flex-1 border-0 text-sm text-ink outline-0" />
          </div>
          <select name="categoria" defaultValue={categoria || ""} aria-label="Categoría" className="h-11 rounded-[9px] border border-line bg-white px-2.5 text-sm text-body">
            <option value="">Todas las categorías</option>
            {(categorias ?? []).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select name="estado" defaultValue={estado} aria-label="Estado" className="h-11 rounded-[9px] border border-line bg-white px-2.5 text-sm text-body">
            <option value="">Todos los estados</option>
            {Object.entries(ESTADOS_PUBLICACION).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <Button type="submit" variant="secondary" icon="filter">Filtrar</Button>
        </form>
        {(data ?? []).length === 0 ? (
          <div className="grid min-h-[250px] place-items-center p-8 text-center text-muted">
            <div><Icon name="search" size={28} className="mx-auto mb-3 text-brand-600" /><strong className="text-sm text-ink">No hay resultados</strong><p className="mt-1 mb-3 text-[11px]">No encontramos establecimientos con esos filtros.</p><Link href="/admin/establecimientos" className="text-[11px] font-bold text-brand-700">Limpiar filtros</Link></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead><tr className="bg-[#fafbfa] text-left text-[9px] uppercase tracking-[0.08em] text-muted"><th className="px-[18px] py-3">Establecimiento</th><th className="px-[18px] py-3">Categoría</th><th className="px-[18px] py-3">Estado</th><th className="px-[18px] py-3">Actualizado</th><th className="px-[18px] py-3 text-right">Acciones</th></tr></thead>
              <tbody>
                {(data ?? []).map((r) => {
                  const img = r.imagenes.find((i) => i.es_principal) ?? r.imagenes[0];
                  return (
                    <tr key={r.id} className="border-t border-[#edf0ee] text-xs text-body">
                      <td className="px-[18px] py-3"><div className="flex items-center gap-[10px] text-ink">
                        {img ? <Image src={img.url} alt="" width={38} height={38} className="size-[38px] rounded-lg object-cover" /> : <span className="grid size-[38px] place-items-center rounded-lg bg-brand-50 text-brand-600"><Icon name="building" size={17} /></span>}
                        <strong>{r.nombre}</strong></div></td>
                      <td className="px-[18px] py-3">{r.categorias?.nombre}</td>
                      <td className="px-[18px] py-3"><StatusBadge tone={r.estado_publicacion === "publicado" ? "success" : "warning"}>{ESTADOS_PUBLICACION[r.estado_publicacion]}</StatusBadge></td>
                      <td className="px-[18px] py-3">{formatFecha(r.updated_at)}</td>
                      <td className="px-[18px] py-3"><div className="flex justify-end gap-[6px]">
                        <Link href={`/admin/establecimientos/${r.id}`} className="rounded-md border border-line px-2.5 py-1.5 text-[11px] font-bold text-brand-700">Editar</Link>
                        {r.estado_publicacion === "publicado" && <Link href={`/directorio/${r.slug}`} target="_blank" className="rounded-md border border-line px-2.5 py-1.5 text-[11px] text-body">Ver</Link>}
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-line px-[18px] py-3 text-[11px] text-muted">
          <span>{total} {total === 1 ? "registro" : "registros"}</span>
          {totalPaginas > 1 && (
            <nav aria-label="Paginación" className="flex gap-1.5">
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                <Link key={n} href={href({ pagina: n })} aria-current={n === pagina ? "page" : undefined} className={cn("grid size-8 place-items-center rounded-lg border border-line bg-white text-body", n === pagina && "border-brand-700 bg-brand-700 text-white")}>{n}</Link>
              ))}
            </nav>
          )}
        </div>
      </section>
    </>
  );
}
