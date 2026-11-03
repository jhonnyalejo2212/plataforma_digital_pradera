import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <>
      <header className="flex h-[68px] items-center border-b border-line md:h-[78px]"><div className="container-page"><Logo /></div></header>
      <main className="container-page py-[90px] text-center">
        <span className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-brand-600">Error 404</span>
        <h1 className="my-3 text-4xl md:text-5xl">No encontramos esta página</h1>
        <p className="mx-auto mb-7 max-w-md text-body">Es posible que el enlace haya cambiado o que el establecimiento ya no esté publicado.</p>
        <div className="flex justify-center gap-3">
          <Button href="/">Ir al inicio</Button>
          <Button href="/directorio" variant="secondary">Ver el directorio</Button>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
