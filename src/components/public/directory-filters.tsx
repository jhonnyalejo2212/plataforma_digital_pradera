import Link from "next/link";
import { directorioHref } from "@/features/establecimientos/search-params";
import type { Categoria, FiltrosDirectorio } from "@/features/establecimientos/types";
import { cn } from "@/lib/utils/cn";

function Option({ href, active, label, count }: { href: string; active: boolean; label: string; count?: number }) {
  return (
    <Link href={href} aria-current={active ? "true" : undefined} className={cn("my-3 grid grid-cols-[18px_1fr_auto] items-center gap-2 text-[13px] text-body", active && "font-bold text-brand-800")}>
      <span className={cn("size-[14px] rounded-full border-2 border-line", active && "border-brand-700 bg-brand-700 shadow-[inset_0_0_0_2px_#fff]")} />
      <span>{label}</span>
      {count !== undefined && <small className="text-[#a1aca6]">{count}</small>}
    </Link>
  );
}

const groupTitle = "mb-3 block text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted";

export function DirectoryFilters({ filtros, categorias, barrios }: { filtros: FiltrosDirectorio; categorias: Categoria[]; barrios: { nombre: string; total: number }[] }) {
  const totalGeneral = categorias.reduce((sum, c) => sum + c.total, 0);
  return (
    <aside className="rounded-[14px] border border-line bg-white p-5">
      <div className="flex justify-between border-b border-line pb-[18px]">
        <strong>Filtrar resultados</strong>
        <Link href="/directorio" className="text-[11px] text-brand-600">Limpiar</Link>
      </div>
      <div className="border-b border-line pt-5 pb-2">
        <span className={groupTitle}>Categorías</span>
        <Option href={directorioHref(filtros, { categoria: null })} active={!filtros.categoria} label="Todos" count={totalGeneral} />
        {categorias.map((c) => (
          <Option key={c.id} href={directorioHref(filtros, { categoria: c.slug })} active={filtros.categoria === c.slug} label={c.nombre} count={c.total} />
        ))}
      </div>
      {barrios.length > 0 && (
        <div className="pt-5 pb-2">
          <span className={groupTitle}>Barrio o zona</span>
          <Option href={directorioHref(filtros, { barrio: null })} active={!filtros.barrio} label="Todos" />
          {barrios.map((b) => (
            <Option key={b.nombre} href={directorioHref(filtros, { barrio: b.nombre })} active={filtros.barrio === b.nombre} label={b.nombre} count={b.total} />
          ))}
        </div>
      )}
    </aside>
  );
}
