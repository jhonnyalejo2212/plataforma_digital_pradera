import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { getEstablecimientoBySlug } from "@/features/establecimientos/queries";
import type { EstablecimientoDetalle, MedioContacto } from "@/features/establecimientos/types";
import { DIAS, formatHora, googleMapsHref, mailHref, safeUrl, telHref, whatsappHref } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export async function generateMetadata({ params }: PageProps<"/directorio/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const business = await getEstablecimientoBySlug(slug);
  if (!business) return { title: "Establecimiento no encontrado" };
  return {
    title: business.nombre,
    description: business.descripcion?.slice(0, 160) ?? `${business.nombre} en Pradera, Valle del Cauca.`,
  };
}

const first = (contactos: MedioContacto[], tipo: MedioContacto["tipo"]) => contactos.find((c) => c.tipo === tipo);

function Gallery({ business }: { business: EstablecimientoDetalle }) {
  const [main, second, third] = business.imagenes;
  if (!main) return null;
  const img = (i: typeof main, className?: string) => (
    <div className={cn("relative overflow-hidden bg-brand-50", className)}>
      <Image src={i.url} alt={i.texto_alternativo ?? business.nombre} fill sizes="(min-width: 768px) 780px, 100vw" className="object-cover" priority={i === main} />
    </div>
  );
  return (
    <section className="container-page">
      <div className={cn("grid h-[290px] gap-2.5 overflow-hidden rounded-card md:h-[415px]", second && "md:grid-cols-[2fr_1fr] md:grid-rows-2")}>
        {img(main, second ? "md:row-span-2" : undefined)}
        {second && img(second, "max-md:hidden")}
        {third && img(third, "max-md:hidden")}
      </div>
    </section>
  );
}

function ContactCard({ contactos }: { contactos: MedioContacto[] }) {
  const tel = first(contactos, "telefono");
  const wa = first(contactos, "whatsapp");
  const mail = first(contactos, "correo");
  const social = contactos.filter((c) => (c.tipo === "instagram" || c.tipo === "facebook" || c.tipo === "sitio_web") && safeUrl(c.valor));
  if (!tel && !wa && !mail && social.length === 0) return null;
  return (
    <div className="rounded-[14px] border border-line bg-white p-[22px] shadow-[0_5px_20px_rgba(22,54,43,0.04)]">
      <h3 className="mb-[17px] text-base">Medios de contacto</h3>
      <div className="flex flex-col gap-[9px]">
        {wa && <Button href={whatsappHref(wa.valor)} target="_blank" rel="noopener noreferrer" variant="whatsapp" icon="whatsapp">WhatsApp · {wa.valor}</Button>}
        {tel && <Button href={telHref(tel.valor)} variant="secondary" icon="phone">Teléfono · {tel.valor}</Button>}
      </div>
      {mail && (
        <a href={mailHref(mail.valor)} className="mt-4 flex items-center gap-2.5 border-t border-line py-3 text-brand-700">
          <Icon name="mail" size={17} />
          <span className="flex min-w-0 flex-col gap-0.5"><small className="text-[9px] text-muted">Correo electrónico</small><strong className="text-[10px] [overflow-wrap:anywhere] text-ink">{mail.valor}</strong></span>
        </a>
      )}
      {social.length > 0 && (
        <div className="mt-[18px] flex items-center gap-[9px] border-t border-line pt-4">
          <span className="mr-auto text-[11px] text-muted">Redes sociales</span>
          {social.map((s) => (
            <a key={s.tipo} href={safeUrl(s.valor)} target="_blank" rel="noopener noreferrer" aria-label={s.etiqueta ?? s.tipo} title={s.etiqueta ?? s.tipo}
              className="grid size-8 place-items-center rounded-lg border border-line bg-white text-brand-700">
              <Icon name={s.tipo === "facebook" ? "facebook" : s.tipo === "instagram" ? "instagram" : "arrow"} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function Hours({ horarios }: { horarios: EstablecimientoDetalle["horarios"] }) {
  if (horarios.length === 0) return null;
  return (
    <div className="rounded-[14px] border border-line bg-white p-[22px] shadow-[0_5px_20px_rgba(22,54,43,0.04)]">
      <h3 className="mb-[17px] flex items-center gap-[9px] text-base"><Icon name="clock" size={20} /> Horarios de atención</h3>
      {horarios.map((h) => (
        <div key={h.dia_semana} className="my-3 flex justify-between text-[11px] text-body">
          <span>{DIAS[h.dia_semana - 1]}</span>
          <strong className={h.cerrado ? "text-[#b9574e]" : "text-ink"}>{h.cerrado ? "Cerrado" : `${formatHora(h.hora_apertura)} – ${formatHora(h.hora_cierre)}`}</strong>
        </div>
      ))}
    </div>
  );
}

const sectionClass = "border-b border-line py-[30px]";
const h2Class = "mb-[13px] text-xl";

async function DetailContent({ params }: { params: PageProps<"/directorio/[slug]">["params"] }) {
  const { slug } = await params;
  const business = await getEstablecimientoBySlug(slug);
  if (!business) notFound();
  const address = [business.direccion, business.barrio].filter(Boolean).join(", ");
  const tel = first(business.contactos, "telefono");
  const wa = first(business.contactos, "whatsapp");
  const hasCoords = business.latitud !== null && business.longitud !== null;
  const fields = [
    { label: "Categoría", value: business.categoria.nombre },
    business.barrio && { label: "Barrio o zona", value: business.barrio },
    business.direccion && { label: "Dirección", value: business.direccion },
  ].filter((f): f is { label: string; value: string } => Boolean(f));

  return (
    <div className="bg-[#fcfdfc]">
      <div className="container-page flex h-16 items-center gap-[9px] text-xs text-muted">
        <Link href="/">Inicio</Link><span>/</span>
        <Link href={`/directorio?categoria=${business.categoria.slug}`}>{business.categoria.nombre}</Link><span>/</span>
        <strong className="text-body">{business.nombre}</strong>
      </div>
      <Gallery business={business} />
      <section className="container-page grid items-start gap-[25px] pt-[30px] pb-[90px] md:pt-[43px] lg:grid-cols-[1fr_340px] lg:gap-[70px]">
        <div>
          <div className="border-b border-line pb-[30px]">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-brand-600">{business.categoria.nombre}</span>
            <h1 className="my-2 text-[32px] md:text-[clamp(32px,4vw,47px)]">{business.nombre}</h1>
            {address && <p className="flex gap-[7px] text-sm text-muted"><Icon name="location" size={18} className="shrink-0" /> {address}</p>}
          </div>
          {(wa || tel) && (
            <div className="grid grid-cols-2 gap-[9px] pt-[18px] lg:hidden">
              {wa && <Button href={whatsappHref(wa.valor)} target="_blank" rel="noopener noreferrer" variant="whatsapp" icon="whatsapp">WhatsApp</Button>}
              {tel && <Button href={telHref(tel.valor)} variant="secondary" icon="phone">Llamar</Button>}
            </div>
          )}
          <article className={sectionClass}>
            <h2 className={h2Class}>Información del establecimiento</h2>
            {business.descripcion && <p className="text-sm leading-[1.8] text-body">{business.descripcion}</p>}
            <div className="mt-[22px] grid gap-3 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.label} className="flex flex-col gap-1 rounded-[9px] border border-line p-3">
                  <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted">{f.label}</span>
                  <strong className="text-xs text-ink">{f.value}</strong>
                </div>
              ))}
            </div>
          </article>
          {business.productos.length > 0 && (
            <article className={sectionClass}>
              <h2 className={h2Class}>Productos y servicios</h2>
              <div className="flex flex-wrap gap-[9px]">
                {business.productos.map((p) => (
                  <span key={p.id} className={cn("rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800", !p.disponible && "opacity-60 line-through")}>{p.nombre}</span>
                ))}
              </div>
            </article>
          )}
          {(address || hasCoords) && (
            <article className={sectionClass}>
              <h2 className={h2Class}>Ubicación</h2>
              {address && <p className="mb-3 text-sm text-body">{address}, Pradera</p>}
              {hasCoords && <Button href={googleMapsHref(business.latitud!, business.longitud!)} target="_blank" rel="noopener noreferrer" variant="ghost" icon="arrow">Cómo llegar en Google Maps</Button>}
            </article>
          )}
        </div>
        <aside className="flex flex-col gap-[17px] lg:sticky lg:top-6">
          <div className="max-lg:hidden"><ContactCard contactos={business.contactos} /></div>
          <Hours horarios={business.horarios} />
        </aside>
      </section>
    </div>
  );
}

export default function EstablecimientoPage({ params }: PageProps<"/directorio/[slug]">) {
  return (
    <Suspense fallback={<div className="h-[600px]" aria-hidden />}>
      <DetailContent params={params} />
    </Suspense>
  );
}
