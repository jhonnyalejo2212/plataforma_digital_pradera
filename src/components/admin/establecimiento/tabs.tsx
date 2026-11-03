"use client";

import { useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils/cn";

export type TabDef = { id: string; label: string; icon: IconName; count?: number; content: ReactNode };

/** Pestañas de la ficha. Todos los paneles permanecen montados para no perder lo que se está editando. */
export function EstablecimientoTabs({ tabs }: { tabs: TabDef[] }) {
  const [active, setActive] = useState(tabs[0].id);
  return (
    <div>
      <div role="tablist" aria-label="Secciones del establecimiento" className="mb-5 flex gap-1.5 overflow-x-auto rounded-xl border border-line bg-white p-1.5">
        {tabs.map((t) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`panel-${t.id}`}
              onClick={() => setActive(t.id)}
              className={cn("flex h-10 shrink-0 items-center gap-2 rounded-lg px-3.5 text-[13px] font-bold text-body transition hover:text-brand-700 max-sm:px-3", selected && "bg-brand-700 text-white hover:text-white")}
            >
              <Icon name={t.icon} size={18} />
              <span className={cn(!selected && "max-sm:hidden")}>{t.label}</span>
              {t.count !== undefined && <small className={cn("rounded-full px-1.5 py-px text-[10px]", selected ? "bg-white/20" : "bg-brand-50 text-brand-700")}>{t.count}</small>}
            </button>
          );
        })}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={t.id !== active}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
