import type { Metadata } from "next";
import { Suspense } from "react";
import { BusinessCard } from "@/components/public/business-card";
import { DirectoryFilters } from "@/components/public/directory-filters";
import { FiltersToggle } from "@/components/public/filters-toggle";
import { DirectorySearchBar } from "@/components/public/search-bar";
import { Icon } from "@/components/ui/icon";
import { Eyebrow } from "@/components/ui/section-heading";
import { ClearFiltersButton, FilterLink, FiltersResults, UrlFiltersProvider } from "@/components/ui/url-filters";
import { getBarrios, getCategorias, listEstablecimientos, PAGE_SIZE } from "@/features/establecimientos/queries";
import { parseFiltros } from "@/features/establecimientos/search-params";

export const metadata: Metadata = {
  title: "Directorio",
  description: "Explora los establecimientos comerciales, gastronómicos, de servicios y turísticos de Pradera.",
};

const ordenes = [
  { value: null, label: "Nombre A–Z" },
  { value: "recientes", label: "Más recientes" },
] as const;

const chipClass = "flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-2 text-[11px] font-bold text-brand-800";
const pageClass = "grid size-9 place-items-center rounded-lg border border-line bg-white text-body data-[active=true]:border-brand-700 data-[active=true]:bg-brand-700 data-[active=true]:text-white";

async function DirectorioContent({ searchParams }: { searchParams: PageProps<"/directorio">["searchParams"] }) {
  const filtros = parseFiltros(await searchParams);
  const [categorias, barrios, { items, total }] = await Promise.all([getCategorias(), getBarrios(), listEstablecimientos(filtros)]);
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const categoriaActiva = categorias.find((c) => c.slug === filtros.categoria);
  const chips: { label: string; changes: Record<string, null> }[] = [];
  if (filtros.q) chips.push({ label: `Búsqueda: “${filtros.q}”`, changes: { q: null } });
  if (categoriaActiva) chips.push({ label: categoriaActiva.nombre, changes: { categoria: null } });
  if (filtros.barrio) chips.push({ label: filtros.barrio, changes: { barrio: null } });
  const filtersPanel = <DirectoryFilters categorias={categorias} barrios={barrios} />;

  return (
    <UrlFiltersProvider>
      <section className="border-b border-[#dce9e0] bg-brand-50 pt-[45px] pb-[38px] md:pt-[60px] md:pb-12">
        <div className="container-page">
          <Eyebrow>Directorio local</Eyebrow>
          <h1 className="mb-2.5 text-4xl leading-[1.1] md:text-[clamp(36px,4vw,52px)]">Encuentra justo lo que necesitas</h1>
          <p className="text-body">Explora los establecimientos y servicios que Pradera tiene para ti.</p>
          <DirectorySearchBar />
        </div>
      </section>

      <section className="container-page pt-[34px] pb-20">
        <FiltersToggle
          summary={<><strong className="text-ink">{total} {total === 1 ? "establecimiento" : "establecimientos"}</strong><span> encontrados en Pradera</span></>}
        >
          {filtersPanel}
        </FiltersToggle>
        <div className="grid items-start gap-[38px] md:grid-cols-[230px_1fr]">
          <div className="hidden md:block">{filtersPanel}</div>
          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {chips.length === 0 && <span className={chipClass}>Todos los negocios</span>}
                {chips.map((chip) => (
                  <span key={chip.label} className={chipClass}>
                    {chip.label}
                    <FilterLink changes={chip.changes} aria-label={`Quitar filtro ${chip.label}`} className="text-brand-700">×</FilterLink>
                  </span>
                ))}
              </div>
              <nav aria-label="Ordenar" className="flex items-center gap-1 text-xs">
                <span className="mr-1 text-muted">Ordenar:</span>
                {ordenes.map((o) => (
                  <FilterLink key={o.label} changes={{ orden: o.value }} className="rounded-lg border border-line px-2.5 py-1.5 text-body data-[active=true]:border-brand-700 data-[active=true]:bg-brand-700 data-[active=true]:text-white">
                    {o.label}
                  </FilterLink>
                ))}
              </nav>
            </div>

            <FiltersResults>
              {items.length > 0 ? (
                <div className="grid gap-[18px] md:grid-cols-2 lg:grid-cols-3">
                  {items.map((business) => <BusinessCard key={business.id} business={business} compact />)}
                </div>
              ) : (
                <div className="rounded-card border border-dashed border-line p-[70px] text-center text-muted">
                  <Icon name="search" size={32} className="mx-auto mb-3.5 text-brand-600" />
                  <h3 className="text-lg text-ink">No encontramos resultados</h3>
                  <p>Prueba con otra búsqueda o selecciona otra categoría.</p>
                  <ClearFiltersButton className="mt-4 inline-block text-sm font-bold text-brand-700">Limpiar filtros</ClearFiltersButton>
                </div>
              )}

              {totalPaginas > 1 && (
                <nav aria-label="Paginación" className="mt-10 flex justify-center gap-[7px]">
                  {filtros.pagina > 1 && <FilterLink changes={{ pagina: filtros.pagina - 1 }} aria-label="Página anterior" className={pageClass}>‹</FilterLink>}
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                    <FilterLink key={n} changes={{ pagina: n }} aria-label={`Página ${n}`} className={pageClass}>{n}</FilterLink>
                  ))}
                  {filtros.pagina < totalPaginas && <FilterLink changes={{ pagina: filtros.pagina + 1 }} aria-label="Página siguiente" className={pageClass}>›</FilterLink>}
                </nav>
              )}
            </FiltersResults>
          </div>
        </div>
      </section>
    </UrlFiltersProvider>
  );
}

export default function DirectorioPage({ searchParams }: PageProps<"/directorio">) {
  return (
    <Suspense fallback={<div className="h-[600px]" aria-hidden />}>
      <DirectorioContent searchParams={searchParams} />
    </Suspense>
  );
}
