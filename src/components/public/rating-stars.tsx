import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils/cn";

export function Stars({ value, size = 16, className }: { value: number; size?: number; className?: string }) {
  const rounded = Math.round(value);
  return (
    <span className={cn("inline-flex gap-0.5 text-[#e0a526]", className)} role="img" aria-label={`${value.toFixed(1)} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} name="star" size={size} className={cn(n <= rounded ? "fill-current" : "fill-none text-[#d5dcd8]")} />
      ))}
    </span>
  );
}

export function RatingBadge({ valoracion, className }: { valoracion: { promedio: number; total: number } | null; className?: string }) {
  if (!valoracion) return <span className={cn("text-[11px] text-muted", className)}>Sin valoraciones</span>;
  return (
    <span className={cn("flex items-center gap-1.5 text-[12px] text-body", className)}>
      <Icon name="star" size={15} className="fill-[#e0a526] text-[#e0a526]" />
      <strong className="text-ink">{valoracion.promedio.toFixed(1)}</strong>
      <span className="text-muted">({valoracion.total})</span>
    </span>
  );
}
