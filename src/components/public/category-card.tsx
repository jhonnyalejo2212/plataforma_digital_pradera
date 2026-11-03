import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { Categoria } from "@/features/establecimientos/types";

const tones = {
  amber: "bg-[#fff4da] text-[#ac721c]",
  blue: "bg-[#e8f4fa] text-[#35789d]",
  violet: "bg-[#f0eafa] text-[#76529c]",
  green: "bg-brand-100 text-brand-700",
} as const;

export function CategoryCard({ categoria }: { categoria: Categoria }) {
  return (
    <Link
      href={`/directorio?categoria=${categoria.slug}`}
      className="flex items-center gap-4 rounded-card border border-[#e3e7e3] bg-white p-[17px] text-left shadow-[0_4px_10px_rgba(20,50,40,0.03)] transition hover:-translate-y-1 hover:border-[#bad4c3] hover:shadow-soft md:p-6"
    >
      <span className={`grid size-[51px] place-items-center rounded-[14px] ${tones[categoria.tono]}`}>
        <Icon name={categoria.icono} size={26} />
      </span>
      <span className="flex flex-1 flex-col">
        <strong className="font-display text-base">{categoria.nombre}</strong>
        <small className="mt-1 text-xs text-muted">{categoria.total} {categoria.total === 1 ? "lugar" : "lugares"}</small>
      </span>
      <Icon name="chevron" size={18} className="text-[#a5b0aa]" />
    </Link>
  );
}
