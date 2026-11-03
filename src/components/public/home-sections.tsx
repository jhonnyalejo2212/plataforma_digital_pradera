import { BusinessCard } from "@/components/public/business-card";
import { CategoryCard } from "@/components/public/category-card";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { getCategorias, getDestacados } from "@/features/establecimientos/queries";

export async function CategoriesSection() {
  const categorias = await getCategorias();
  if (categorias.length === 0) return null;
  return (
    <section id="categorias" className="scroll-mt-5 bg-cream py-[65px] md:py-[88px]">
      <div className="container-page">
        <SectionHeading eyebrow="Explora por categoría" align="center">Todo lo que necesitas, cerca de ti</SectionHeading>
        <div className="mt-[30px] grid gap-[11px] md:mt-11 md:grid-cols-2 md:gap-[18px] lg:grid-cols-3">
          {categorias.map((categoria) => <CategoryCard key={categoria.id} categoria={categoria} />)}
        </div>
      </div>
    </section>
  );
}

export async function FeaturedSection() {
  const destacados = await getDestacados(3);
  if (destacados.length === 0) return null;
  return (
    <section className="bg-white py-[65px] md:py-[88px]">
      <div className="container-page">
        <div className="mb-[35px] flex items-end justify-between">
          <SectionHeading eyebrow="Recién publicados">Establecimientos del directorio</SectionHeading>
          <Button href="/directorio" variant="ghost" icon="arrow" className="max-md:hidden">Ver todos</Button>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {destacados.map((business) => <BusinessCard key={business.id} business={business} />)}
        </div>
      </div>
    </section>
  );
}

export function SectionSkeleton() {
  return <div className="h-[420px] animate-pulse bg-cream/60" aria-hidden />;
}
