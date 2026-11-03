import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function Logo({ inverse = false, hideTextOnMobile = false, className }: { inverse?: boolean; hideTextOnMobile?: boolean; className?: string }) {
  return (
    <Link href="/" aria-label="Ir al inicio" className={cn("flex items-center gap-[11px]", inverse ? "text-white" : "text-brand-900", className)}>
      <span className={cn("relative block size-[39px] overflow-hidden rounded-xl", inverse ? "bg-brand-500" : "bg-brand-700")}>
        <span className="absolute bottom-[7px] left-[10px] h-5 w-2 origin-bottom -rotate-[36deg] rounded-[10px_10px_2px_10px] bg-white" />
        <span className="absolute bottom-2 left-[18px] h-4 w-2 origin-bottom rotate-[32deg] rounded-[10px_10px_2px_10px] bg-white" />
        <span className="absolute bottom-1 left-[18px] h-[17px] w-[3px] rounded bg-white" />
      </span>
      <span className={cn("flex flex-col items-start leading-none", hideTextOnMobile && "max-md:hidden")}>
        <strong className="font-display text-[17px] tracking-[-0.04em]">Directorio</strong>
        <small className="mt-[5px] text-[9px] font-bold tracking-[0.25em]">PRADERA</small>
      </span>
    </Link>
  );
}
