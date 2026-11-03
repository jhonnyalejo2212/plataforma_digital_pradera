import Image from "next/image";
import { Suspense } from "react";
import { CategoriesSection, FeaturedSection, SectionSkeleton } from "@/components/public/home-sections";
import { SearchBar } from "@/components/public/search-bar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Eyebrow } from "@/components/ui/section-heading";
import { siteConfig } from "@/config/site";

const interests = [
  { image: "/images/waterfall.jpg", alt: "Cascada natural cerca de Pradera", tag: "Naturaleza", title: "Cascadas de la zona rural", text: "Senderos, agua fresca y paisajes para disfrutar en familia." },
  { image: "/images/mountain.jpg", alt: "Paisaje montañoso de Pradera", tag: "Miradores", title: "Ruta de la montaña", text: "Un recorrido entre cultivos y panorámicas del Valle del Cauca." },
  { image: "/images/plaza.jpg", alt: "Espacio urbano y cultural", tag: "Cultura local", title: "Parque principal", text: "El punto de encuentro para vivir la tradición pradereña." },
];

const aboutPoints = [
  { icon: "search", label: "Consulta sencilla" },
  { icon: "building", label: "Visibilidad local" },
  { icon: "check", label: "Información organizada" },
] as const;

export default function HomePage() {
  return (
    <>
      <section className="relative flex min-h-[590px] items-center overflow-hidden bg-[linear-gradient(128deg,var(--color-brand-950),#215640)] text-white md:min-h-[560px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[length:25px_25px] opacity-[0.07] [mask-image:linear-gradient(to_right,#000,transparent_78%)]" />
        <div className="absolute -top-[10%] -right-[8%] h-[120%] w-[43%] rounded-full border border-white/[0.08] shadow-[0_0_0_55px_rgba(255,255,255,0.025),0_0_0_110px_rgba(255,255,255,0.018)]" />
        <div className="container-page relative z-[2] py-[60px] md:py-[70px]">
          <span className="flex items-center gap-[9px] text-[11px] font-bold uppercase tracking-[0.18em] text-[#b8dbc5]">
            <span className="h-0.5 w-[23px] bg-brand-500" /> {siteConfig.tagline}
          </span>
          <h1 className="my-[18px] max-w-[750px] text-[38px] leading-[1.04] font-bold min-[521px]:text-[43px] md:text-[clamp(43px,5.2vw,72px)]">
            Descubre lo mejor de <em className="not-italic text-[#8ccca5]">nuestra tierra</em>
          </h1>
          <p className="max-w-[580px] text-base leading-[1.65] text-[#ccdad3] md:text-lg">
            Encuentra comercios, sabores, servicios y experiencias que hacen único a nuestro municipio.
          </p>
          <SearchBar />
        </div>
        <div className="absolute top-[28%] right-[14%] size-4 rounded-full bg-brand-500 opacity-65" />
        <div className="absolute right-[27%] bottom-1/4 size-2 rounded-full bg-brand-500 opacity-50" />
      </section>

      <Suspense fallback={<SectionSkeleton />}>
        <CategoriesSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <FeaturedSection />
      </Suspense>

      <section id="explora-pradera" className="scroll-mt-5 bg-cream py-[65px] md:py-[88px]">
        <div className="container-page grid min-h-[470px] overflow-hidden rounded-panel bg-brand-900 text-white shadow-card md:grid-cols-[55%_45%]">
          <div className="relative h-[280px] overflow-hidden md:h-auto">
            <Image src="/images/tourism.jpg" alt="Paisaje natural del Valle del Cauca" fill sizes="(min-width: 768px) 640px, 100vw" className="object-cover" priority={false} />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,40,28,0.4)] to-transparent to-55%" />
            <span className="absolute bottom-5 left-[22px] z-[2] flex items-center gap-[7px] text-xs"><Icon name="location" size={16} /> {siteConfig.location}</span>
          </div>
          <div className="flex flex-col justify-center px-[27px] py-[38px] md:px-[50px] md:py-[55px]">
            <Eyebrow light>Vive Pradera</Eyebrow>
            <h2 className="text-[clamp(30px,3.5vw,43px)] leading-[1.16]">Una tierra llena de vida, sabor y tradición</h2>
            <p className="my-5 leading-[1.7] text-[#c2d3ca]">
              Entre montañas y cañaduzales, Pradera te invita a descubrir paisajes, gastronomía y la calidez de su gente.
            </p>
            <Button href="/directorio" variant="dark" icon="arrow" className="self-start">Explorar Pradera</Button>
          </div>
        </div>
        <div className="container-page mt-[22px] grid gap-[18px] lg:grid-cols-3">
          {interests.map(({ image, alt, tag, title, text }) => (
            <article key={title} className="grid min-h-[132px] grid-cols-[105px_1fr] overflow-hidden rounded-[14px] border border-line bg-white shadow-[0_4px_16px_rgba(23,60,45,0.04)] md:grid-cols-[116px_1fr]">
              <div className="relative">
                <Image src={image} alt={alt} fill sizes="116px" className="object-cover" />
              </div>
              <div className="px-[15px] py-[17px]">
                <span className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-brand-600">{tag}</span>
                <h3 className="my-[5px] text-sm tracking-[-0.02em]">{title}</h3>
                <p className="text-[10px] leading-normal text-muted">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="acerca-de" className="scroll-mt-5 bg-white pt-[70px] pb-5">
        <div className="container-page grid items-start gap-6 border-b border-line pb-[55px] md:grid-cols-[0.9fr_1.1fr] md:gap-20">
          <div>
            <Eyebrow>Acerca del proyecto</Eyebrow>
            <h2 className="text-[clamp(28px,3vw,39px)] leading-[1.17]">Un directorio pensado para conectar a Pradera</h2>
          </div>
          <div>
            <p className="text-sm leading-[1.75] text-body">
              {siteConfig.name} organiza en un solo lugar la oferta comercial, gastronómica, de servicios y turística del municipio.
            </p>
            <div className="mt-[22px] flex flex-wrap gap-[9px]">
              {aboutPoints.map(({ icon, label }) => (
                <span key={label} className="flex items-center gap-[7px] rounded-[9px] border border-line px-[11px] py-[9px] text-[11px] font-bold text-brand-800">
                  <Icon name={icon} size={18} />{label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {siteConfig.contactEmail && (
        <section className="py-[65px]">
          <div className="container-page relative flex flex-col items-start justify-between gap-[22px] overflow-hidden rounded-card border border-[#d3e7d9] bg-brand-50 px-6 py-7 md:flex-row md:items-center md:px-[42px] md:py-[35px]">
            <div className="absolute -top-[90px] right-[20%] size-[180px] rounded-full border-[30px] border-[rgba(49,131,91,0.06)]" />
            <div className="relative">
              <Eyebrow>Crece con nosotros</Eyebrow>
              <h2 className="text-[27px]">¿Tienes un negocio en Pradera?</h2>
              <p className="mt-[7px] text-body">Súmate al directorio y haz que más personas encuentren lo que ofreces.</p>
            </div>
            <Button href={`mailto:${siteConfig.contactEmail}?subject=Registro%20de%20mi%20negocio`} icon="plus" className="relative z-[2]">Registrar mi negocio</Button>
          </div>
        </section>
      )}
    </>
  );
}
