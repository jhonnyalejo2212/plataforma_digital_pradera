import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

const ALT = "Directorio Digital Pradera";

/** Ícono del logo (`public/logo-icon.png`, ya recortado del archivo original). */
function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative block size-[39px] shrink-0", className)}>
      <Image src="/logo-icon.png" alt="" fill sizes="80px" className="object-contain" />
    </span>
  );
}

/**
 * El PNG trae el texto en blanco: en fondos oscuros (inverse) se muestra completo;
 * en fondos claros se muestra el ícono junto al texto estilizado de la marca.
 */
export function Logo({
  inverse = false,
  hideTextOnMobile = false,
  className,
  size = 39,
  sizeClass,
  sizes,
}: {
  inverse?: boolean;
  hideTextOnMobile?: boolean;
  className?: string;
  /** Alto del logo en px (el ancho se calcula solo, proporción 3:1). */
  size?: number;
  /** Clases de alto/ancho para tamaños responsivos (reemplaza a `size`). */
  sizeClass?: string;
  /** Hint `sizes` para next/image cuando se usa `sizeClass`. */
  sizes?: string;
}) {
  if (inverse) {
    const width = size * 3; // el PNG tiene proporción 3:1
    return (
      <Link href="/" aria-label="Ir al inicio" className={cn("flex items-center", className)}>
        <span className={cn("relative block", sizeClass, hideTextOnMobile && "max-md:hidden")} style={sizeClass ? undefined : { height: size, width }}>
          <Image src="/logo.png" alt={ALT} fill sizes={sizes ?? `${width}px`} className="object-contain object-left" />
        </span>
        {hideTextOnMobile && <LogoMark className="md:hidden" />}
      </Link>
    );
  }
  return (
    <Link href="/" aria-label="Ir al inicio" className={cn("flex items-center gap-[11px] text-brand-900", className)}>
      <LogoMark />
      <span className={cn("flex flex-col items-start leading-none", hideTextOnMobile && "max-md:hidden")}>
        <strong className="font-display text-[17px] tracking-[-0.04em]">Directorio</strong>
        <small className="mt-[5px] text-[9px] font-bold tracking-[0.25em]">PRADERA</small>
      </span>
    </Link>
  );
}
