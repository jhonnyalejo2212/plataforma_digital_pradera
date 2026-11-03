"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils/cn";

const links = [
  { href: "/", label: "Inicio", match: (p: string) => p === "/" },
  { href: "/directorio", label: "Directorio", match: (p: string) => p.startsWith("/directorio") },
  { href: "/#explora-pradera", label: "Explora Pradera" },
  { href: "/#acerca-de", label: "Acerca de" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="relative z-40 flex h-[68px] items-center border-b border-line/80 bg-white/95 backdrop-blur-sm md:h-[78px]">
      <div className="container-page flex items-center justify-between">
        <Logo />
        <nav
          className={cn(
            "items-center gap-[17px] lg:gap-[30px] max-md:absolute max-md:top-[67px] max-md:right-0 max-md:left-0 max-md:flex-col max-md:items-stretch max-md:gap-1 max-md:bg-white max-md:px-5 max-md:pt-[18px] max-md:pb-6 max-md:shadow-card md:flex",
            open ? "max-md:flex" : "max-md:hidden",
          )}
        >
          {links.map(({ href, label, match }) => {
            const active = match?.(pathname) ?? false;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "relative py-2.5 text-sm text-body max-md:p-3",
                  active && "font-bold text-brand-700 md:after:absolute md:after:inset-x-0 md:after:bottom-px md:after:h-0.5 md:after:rounded-sm md:after:bg-brand-600",
                )}
              >
                {label}
              </Link>
            );
          })}
          <Button href="/admin/login" variant="secondary" onClick={() => setOpen(false)}>Ingresar</Button>
        </nav>
        <button className="grid place-items-center text-brand-900 md:hidden" onClick={() => setOpen(!open)} aria-label="Abrir menú" aria-expanded={open}>
          <Icon name={open ? "x" : "menu"} />
        </button>
      </div>
    </header>
  );
}
