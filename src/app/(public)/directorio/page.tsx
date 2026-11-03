import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BusinessCard } from "@/components/public/business-card";
import { DirectoryFilters } from "@/components/public/directory-filters";
import { FiltersToggle } from "@/components/public/filters-toggle";
import { SearchBar } from "@/components/public/search-bar";
import { Icon } from "@/components/ui/icon";
import { Eyebrow } from "@/components/ui/section-heading";
import { getBarrios, getCategorias, listEstablecimientos, PAGE_SIZE } from "@/features/establecimientos/queries";
import { directorioHref, parseFiltros } from "@/features/establecimientos/search-params";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = {
  title: "Directorio",
  description: "Explora los establecimientos comerciales, gastronómicos, de servicios y turísticos de Pradera.",
};

const ordenes = [
  { value: "nombre", label: "Nombre A–Z" },
  { value: "recientes", label: "Más recientes" },
] as const;

async function DirectorioContent({ searchParams }: { searchParams: PageProps<"/directorio">["searchParams"] }) {
  const filtros = parseFiltros(await searchParams);
  const [categorias, barrios, { items, total }] = await Promise.all([getCategorias(), getBarrios(), listEstablecimientos(filtros)]);
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const categoriaActiva = categorias.find((c) => c.slug === filtros.categoria);
  const chips = [
    filtros.q && { label: `Búsqueda: “${filtros.q}”`, href: directorioHref(filtros, { q: null }) },
    categoriaActiva && { label: categoriaActiva.nombre, href: directorioHref(filtros, { categoria: null }) },
    filtros.barrio && { label: filtros.barrio, href: directorioHref(filtros, { barrio: null }) },
  ].filter((c): c is { label: string; href: string } => Boolean(c));
  const filtersPanel = <DirectoryFilters filtros={filtros} categorias={categorias} barrios={barrios} />;

  return (
    <>
      <section className="border-b border-[#dce9e0] bg-brand-50 pt-[45px] pb-[38px] md:pt-[60px] md:pb-12">
        <div className="container-page">
          <Eyebrow>Directorio local</Eyebrow>
          <h1 className="mb-2.5 text-4xl leading-[1.1] md:text-[clamp(36px,4vw,52px)]">Encuentra justo lo que necesitas</h1>
          <p className="text-body">Explora los establecimientos y servicios que Pradera tiene para ti.</p>
          <SearchBar compact defaultValue={filtros.q} />
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
                {chips.length === 0 && <span className="rounded-lg bg-brand-50 px-2.5 py-2 text-[11px] font-bold text-brand-800">Todos los negocios</span>}
                {chips.map((chip) => (
                  <span key={chip.label} className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-2 text-[11px] font-bold text-brand-800">
                    {chip.label}
                    <Link href={chip.href} aria-label={`Quitar filtro ${chip.label}`} className="text-brand-700">×</Link>
                  </span>
                ))}
              </div>
              <nav aria-label="Ordenar" className="flex items-center gap-1 text-xs">
                <span className="mr-1 text-muted">Ordenar:</span>
                {ordenes.map((o) => (
                  <Link key={o.value} href={directorioHref(filtros, { orden: o.value, pagina: 1 })} aria-current={filtros.orden === o.value ? "true" : undefined}
                    className={cn("rounded-lg border border-line px-2.5 py-1.5 text-body", filtros.orden === o.value && "border-brand-700 bg-brand-700 text-white")}>
                    {o.label}
                  </Link>
                ))}
              </nav>
            </div>

            {items.length > 0 ? (
              <div className="grid gap-[18px] md:grid-cols-2 lg:grid-cols-3">
                {items.map((business) => <BusinessCard key={business.id} business={business} compact />)}
              </div>
            ) : (
              <div className="rounded-card border border-dashed border-line p-[70px] text-center text-muted">
                <Icon name="search" size={32} className="mx-auto mb-3.5 text-brand-600" />
                <h3 className="text-lg text-ink">No encontramos resultados</h3>
                <p>Prueba con otra búsqueda o selecciona otra categoría.</p>
                <Link href="/directorio" className="mt-4 inline-block text-sm font-bold text-brand-700">Limpiar filtros</Link>
              </div>
            )}

            {totalPaginas > 1 && (
              <nav aria-label="Paginación" className="mt-10 flex justify-center gap-[7px]">
                {filtros.pagina > 1 && <PageLink href={directorioHref(filtros, { pagina: filtros.pagina - 1 })} label="Página anterior">‹</PageLink>}
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                  <PageLink key={n} href={directorioHref(filtros, { pagina: n })} current={n === filtros.pagina} label={`Página ${n}`}>{n}</PageLink>
                ))}
                {filtros.pagina < totalPaginas && <PageLink href={directorioHref(filtros, { pagina: filtros.pagina + 1 })} label="Página siguiente">›</PageLink>}
              </nav>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function PageLink({ href, current, label, children }: { href: string; current?: boolean; label: string; children: React.ReactNode }) {
  return (
    <Link href={href} aria-label={label} aria-current={current ? "page" : undefined}
      className={cn("grid size-9 place-items-center rounded-lg border border-line bg-white text-body", current && "border-brand-700 bg-brand-700 text-white")}>
      {children}
    </Link>
  );
}

export default function DirectorioPage({ searchParams }: PageProps<"/directorio">) {
  return (
    <Suspense fallback={<div className="h-[600px]" aria-hidden />}>
      <DirectorioContent searchParams={searchParams} />
    </Suspense>
  );
}
