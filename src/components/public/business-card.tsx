import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { EstablecimientoResumen } from "@/features/establecimientos/types";
import { cn } from "@/lib/utils/cn";

export function BusinessCard({ business, compact = false }: { business: EstablecimientoResumen; compact?: boolean }) {
  const location = [business.barrio, business.direccion].filter(Boolean).join(" · ");
  return (
    <Link
      href={`/directorio/${business.slug}`}
      className="group grid grid-cols-[115px_1fr] overflow-hidden rounded-card border border-line bg-white shadow-[0_3px_14px_rgba(22,54,43,0.04)] transition hover:-translate-y-[5px] hover:shadow-card min-[521px]:grid-cols-[130px_1fr] md:block"
    >
      <div className={cn("relative h-full min-h-[165px] overflow-hidden bg-brand-50 md:min-h-0", compact ? "md:h-[175px]" : "md:h-[218px]")}>
        {business.imagen ? (
          <Image src={business.imagen.url} alt={business.imagen.alt} fill sizes="(min-width: 768px) 360px, 130px" className="object-cover transition duration-[400ms] group-hover:scale-[1.04]" />
        ) : (
          <span className="grid h-full place-items-center text-brand-600"><Icon name="building" size={36} /></span>
        )}
      </div>
      <div className={cn("p-4 md:p-[21px]", compact && "md:p-[17px]")}>
        <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-brand-600">{business.categoria.nombre}</span>
        <h3 className={cn("mt-1.5 mb-[9px] text-base md:text-[19px]", compact && "md:text-base")}>{business.nombre}</h3>
        {location && (
          <p className="flex items-center gap-[7px] text-[13px] text-muted">
            <Icon name="location" size={16} className="shrink-0" />{location}
          </p>
        )}
        <span className="mt-3 flex w-full items-center justify-between border-t border-[#edf0ee] pt-3.5 text-[11px] font-bold text-brand-700 md:mt-[18px] md:text-[13px]">
          Ver establecimiento <Icon name="arrow" size={16} />
        </span>
      </div>
    </Link>
  );
}
