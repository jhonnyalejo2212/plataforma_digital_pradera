import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Logo } from "@/components/ui/logo";
import { siteConfig } from "@/config/site";

const linkClass = "text-xs text-[#94aa9f] hover:text-white";
const socials = [
  { name: "Instagram", icon: "instagram", href: siteConfig.social.instagram },
  { name: "Facebook", icon: "facebook", href: siteConfig.social.facebook },
] as const;

export async function SiteFooter() {
  "use cache";
  return (
    <footer className="bg-[#112d22] pt-[62px] text-white">
      <div className="container-page grid gap-x-[30px] gap-y-[38px] pb-[45px] min-[521px]:grid-cols-2 md:grid-cols-[1.65fr_1fr_1fr_1fr] md:gap-[65px]">
        <div className="col-span-full md:col-auto">
          <Logo inverse />
          <p className="mt-[18px] max-w-[270px] text-[13px] leading-[1.7] text-[#94aa9f]">
            Conectamos a Pradera con lo mejor de su comercio, servicios y turismo local.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3">
          <strong className="mb-2 text-[13px]">Explora</strong>
          <Link href="/directorio" className={linkClass}>Directorio de negocios</Link>
          <Link href="/#explora-pradera" className={linkClass}>Turismo local</Link>
          <Link href="/#categorias" className={linkClass}>Categorías</Link>
        </div>
        <div className="flex flex-col items-start gap-3">
          <strong className="mb-2 text-[13px]">Información</strong>
          <Link href="/#acerca-de" className={linkClass}>Sobre el proyecto</Link>
          <Link href="/directorio" className={linkClass}>Reportar información</Link>
          <Link href="/admin/login" className={linkClass}>Administración</Link>
        </div>
        <div className="flex flex-col items-start gap-3">
          <strong className="mb-2 text-[13px]">Síguenos</strong>
          <div className="mb-2.5 flex gap-[9px]">
            {socials.map(({ name, icon, href }) =>
              href ? (
                <a key={name} href={href} target="_blank" rel="noopener noreferrer" aria-label={name} className="grid size-[34px] place-items-center rounded-[9px] border border-[#365047] text-[#94aa9f] hover:text-white">
                  <Icon name={icon} />
                </a>
              ) : null,
            )}
          </div>
          <small className="text-[11px] text-[#758d81]">{siteConfig.location}</small>
        </div>
      </div>
      <div className="container-page flex flex-col justify-between gap-[7px] border-t border-[#284438] py-5 text-xs text-[#71867c] md:flex-row">
        <small>© {new Date().getFullYear()} {siteConfig.name}.</small>
        <small>Información sujeta a verificación y actualización por los administradores.</small>
      </div>
    </footer>
  );
}
