import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function Eyebrow({ children, light, className }: { children: ReactNode; light?: boolean; className?: string }) {
  return (
    <span className={cn("mb-3 block text-[11px] font-extrabold uppercase tracking-[0.15em]", light ? "text-[#9dd9b4]" : "text-brand-600", className)}>
      {children}
    </span>
  );
}

export function SectionHeading({ children, eyebrow, align = "left" }: { children: ReactNode; eyebrow?: string; align?: "left" | "center" }) {
  return (
    <div className={align === "center" ? "text-center" : undefined}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="text-[29px] font-bold leading-[1.16] md:text-[clamp(28px,3vw,40px)]">{children}</h2>
    </div>
  );
}
