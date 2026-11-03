"use client";

import { Icon } from "@/components/ui/icon";
import { useLiveText, useUrlFilters } from "@/components/ui/url-filters";

const selectClass = "h-11 rounded-[9px] border border-line bg-white px-2.5 text-sm text-body";

type Option = { value: string | number; label: string };

/** Barra de filtros del listado de establecimientos: busca en vivo y filtra sin recargar. */
export function EstablecimientosFilters({ categorias, estados }: { categorias: Option[]; estados: Option[] }) {
  const { params, setFilters } = useUrlFilters();
  const text = useLiveText("q");
  return (
    <div role="search" className="grid gap-3 border-b border-line p-[18px] md:grid-cols-[1fr_190px_170px]">
      <div className="flex h-11 items-center gap-[9px] rounded-[9px] border border-line pl-[13px] text-muted focus-within:border-brand-500">
        <Icon name="search" size={18} />
        <input
          type="search"
          value={text.value}
          onChange={(e) => text.onChange(e.target.value)}
          onFocus={text.onFocus}
          onBlur={text.onBlur}
          onKeyDown={(e) => e.key === "Enter" && text.submit()}
          aria-label="Buscar establecimientos"
          placeholder="Buscar por nombre, dirección o barrio…"
          autoComplete="off"
          className="min-w-0 flex-1 border-0 bg-transparent text-sm text-ink outline-0"
        />
      </div>
      <select value={params.get("categoria") ?? ""} onChange={(e) => setFilters({ categoria: e.target.value })} aria-label="Categoría" className={selectClass}>
        <option value="">Todas las categorías</option>
        {categorias.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
      <select value={params.get("estado") ?? ""} onChange={(e) => setFilters({ estado: e.target.value })} aria-label="Estado" className={selectClass}>
        <option value="">Todos los estados</option>
        {estados.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
    </div>
  );
}
