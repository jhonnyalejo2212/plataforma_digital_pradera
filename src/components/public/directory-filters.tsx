import { ClearFiltersButton, FilterLink } from "@/components/ui/url-filters";
import type { Categoria } from "@/features/establecimientos/types";

function Option({ param, value, label, count }: { param: "categoria" | "barrio"; value: string; label: string; count?: number }) {
  return (
    <FilterLink changes={{ [param]: value }} className="my-3 grid grid-cols-[18px_1fr_auto] items-center gap-2 text-[13px] text-body data-[active=true]:font-bold data-[active=true]:text-brand-800">
      <span className="size-[14px] rounded-full border-2 border-line group-data-[active=true]:border-brand-700 group-data-[active=true]:bg-brand-700 group-data-[active=true]:shadow-[inset_0_0_0_2px_#fff]" />
      <span>{label}</span>
      {count !== undefined && <small className="text-[#a1aca6]">{count}</small>}
    </FilterLink>
  );
}

const groupTitle = "mb-3 block text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted";

export function DirectoryFilters({ categorias, barrios }: { categorias: Categoria[]; barrios: { nombre: string; total: number }[] }) {
  const totalGeneral = categorias.reduce((sum, c) => sum + c.total, 0);
  return (
    <aside className="rounded-[14px] border border-line bg-white p-5">
      <div className="flex justify-between border-b border-line pb-[18px]">
        <strong>Filtrar resultados</strong>
        <ClearFiltersButton className="text-[11px] text-brand-600">Limpiar</ClearFiltersButton>
      </div>
      <div className="border-b border-line pt-5 pb-2">
        <span className={groupTitle}>Categorías</span>
        <Option param="categoria" value="" label="Todos" count={totalGeneral} />
        {categorias.map((c) => <Option key={c.id} param="categoria" value={c.slug} label={c.nombre} count={c.total} />)}
      </div>
      {barrios.length > 0 && (
        <div className="pt-5 pb-2">
          <span className={groupTitle}>Barrio o zona</span>
          <Option param="barrio" value="" label="Todos" />
          {barrios.map((b) => <Option key={b.nombre} param="barrio" value={b.nombre} label={b.nombre} count={b.total} />)}
        </div>
      )}
    </aside>
  );
}
