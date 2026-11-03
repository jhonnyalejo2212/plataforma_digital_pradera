"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import type { ActionResult } from "@/features/establecimientos/detail-schemas";

export function PanelCard({ icon, title, description, action, children }: { icon: IconName; title: string; description: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[14px] border border-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-[18px] py-[18px] md:px-[25px]">
        <div className="flex items-center gap-3">
          <span className="grid size-[42px] shrink-0 place-items-center rounded-[11px] bg-brand-100 text-brand-700"><Icon name={icon} size={21} /></span>
          <div>
            <h2 className="text-base">{title}</h2>
            <p className="mt-0.5 text-[11px] text-muted">{description}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="p-[18px] md:p-[25px]">{children}</div>
    </section>
  );
}

export function SaveBar({ pending, result, onSave, label = "Guardar cambios" }: { pending: boolean; result: ActionResult | null; onSave: () => void; label?: string }) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-line pt-[18px]">
      {result && (
        <span role={result.ok ? "status" : "alert"} className={`mr-auto flex items-center gap-1.5 text-xs ${result.ok ? "text-brand-700" : "text-[#b9574e]"}`}>
          <Icon name={result.ok ? "check" : "info"} size={15} />{result.message}
        </span>
      )}
      <Button icon="save" onClick={onSave} disabled={pending}>{pending ? "Guardando…" : label}</Button>
    </div>
  );
}

export function EmptyHint({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  return (
    <div className="grid min-h-[150px] place-items-center rounded-xl border border-dashed border-line bg-[#fafbfa] p-6 text-center text-muted">
      <div><Icon name={icon} size={26} className="mx-auto mb-2 text-brand-600" /><strong className="text-sm text-ink">{title}</strong><p className="mt-1 text-[11px]">{text}</p></div>
    </div>
  );
}

export const smallInput =
  "w-full rounded-lg border border-line bg-white px-[11px] py-2.5 text-xs text-ink outline-0 focus:border-brand-500 focus:shadow-[0_0_0_3px_var(--color-brand-50)] aria-[invalid=true]:border-[#d9675e] disabled:bg-[#f4f6f4] disabled:text-muted";

export const iconButton =
  "grid size-8 place-items-center rounded-lg border border-line bg-white text-body transition hover:border-[#b9d2c2] hover:text-brand-700 disabled:opacity-40";
