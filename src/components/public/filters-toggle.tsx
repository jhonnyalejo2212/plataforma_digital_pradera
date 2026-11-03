"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";

/** Barra superior del listado: resumen a la izquierda y, en móvil, botón que despliega los filtros. */
export function FiltersToggle({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex items-center justify-between pb-[25px] text-sm text-body">
        <div>{summary}</div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex items-center gap-[7px] rounded-lg border border-line bg-white px-3 py-2 md:hidden"
        >
          <Icon name="filter" size={18} /> Filtros
        </button>
      </div>
      {open && <div className="mb-6 md:hidden">{children}</div>}
    </>
  );
}
