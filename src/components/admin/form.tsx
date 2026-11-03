import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export const inputClass =
  "w-full rounded-lg border border-line bg-white px-[11px] py-2.5 text-xs text-ink outline-0 focus:border-brand-500 focus:shadow-[0_0_0_3px_var(--color-brand-50)] aria-[invalid=true]:border-[#d9675e]";

export function Field({ label, error, wide, hint, children }: { label: string; error?: string; wide?: boolean; hint?: string; children: ReactNode }) {
  return (
    <label className={cn("flex flex-col gap-[7px]", wide && "md:col-span-2")}>
      <span className="text-[10px] font-bold text-body">{label}</span>
      {children}
      {hint && !error && <small className="text-[10px] text-muted">{hint}</small>}
      {error && <small role="alert" className="text-[11px] text-[#b9574e]">{error}</small>}
    </label>
  );
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-[17px] md:grid-cols-2">{children}</div>;
}
