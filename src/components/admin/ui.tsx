import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils/cn";

export function AdminTitle({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <div>
        <Eyebrow className="mb-0">Panel administrativo</Eyebrow>
        <h1 className="mt-1 mb-1 text-[28px] md:text-[32px]">{title}</h1>
        <p className="text-xs text-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ tone, children }: { tone: "success" | "warning" | "danger" | "neutral"; children: ReactNode }) {
  const tones = {
    success: "bg-brand-50 text-brand-700 before:bg-brand-500",
    warning: "bg-[#fff5df] text-[#a26d1d] before:bg-[#daa338]",
    danger: "bg-[#fceceb] text-[#a34d47] before:bg-[#d9675e]",
    neutral: "bg-[#eef1ef] text-body before:bg-muted",
  };
  return <span className={cn("inline-flex w-fit items-center gap-[5px] rounded-xl px-2 py-1 text-[10px] font-bold before:size-[5px] before:rounded-full", tones[tone])}>{children}</span>;
}

export function Panel({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[13px] border border-line bg-white">
      <div className="flex items-center justify-between border-b border-line px-[21px] py-5">
        <div>
          <h2 className="text-[15px]">{title}</h2>
          {subtitle && <p className="mt-[3px] text-[10px] text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
