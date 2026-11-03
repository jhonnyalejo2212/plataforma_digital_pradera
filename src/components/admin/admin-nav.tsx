"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils/cn";
import { ADMIN_SECTIONS } from "./sections";

export function AdminNav({ pendingReports }: { pendingReports: number }) {
  const pathname = usePathname();
  return (
    <nav className="mt-[34px] flex flex-col gap-[3px] overflow-y-auto">
      {ADMIN_SECTIONS.map(({ href, label, icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={cn("flex h-11 items-center gap-3 rounded-[9px] px-[13px] text-[13px] text-[#91a79c] hover:text-white max-md:w-[45px] max-md:justify-center max-md:px-0", active && "bg-white/10 text-white")}
          >
            <Icon name={icon} />
            <span className="max-md:hidden">{label}</span>
            {href === "/admin/reportes" && pendingReports > 0 && (
              <small className="ml-auto rounded-lg bg-[#e65d52] px-1.5 py-0.5 text-[9px] text-white max-md:hidden">{pendingReports}</small>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
