import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { Icon } from "@/components/ui/icon";
import { Logo } from "@/components/ui/logo";
import { signOut } from "@/features/auth/actions";
import { requireAdmin } from "@/features/auth/dal";
import { createClient } from "@/lib/supabase/server";

async function AdminShell({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { count } = await supabase.from("reportes").select("id", { count: "exact", head: true }).neq("estado", "revisado").is("deleted_at", null);
  const pending = count ?? 0;
  const initials = admin.nombre.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();

  return (
    <div className="grid min-h-screen grid-cols-[72px_1fr] bg-[#f4f6f4] md:grid-cols-[242px_1fr]">
      <aside className="sticky top-0 flex h-screen flex-col bg-brand-950 px-2.5 py-[25px] text-white max-md:items-center md:px-[17px]">
        <Logo inverse hideTextOnMobile className="md:ml-2" />
        <AdminNav pendingReports={pending} />
        <div className="mt-auto flex items-center gap-2.5 border-t border-[#2c493d] px-1.5 pt-5 max-md:px-0">
          <span className="grid size-[35px] place-items-center rounded-[10px] bg-brand-600 text-[11px] font-bold">{initials}</span>
          <div className="flex min-w-0 flex-1 flex-col max-md:hidden">
            <strong className="truncate text-[11px]">{admin.nombre}</strong>
            <small className="mt-0.5 text-[9px] text-[#88a095]">Administrador</small>
          </div>
        </div>
      </aside>
      <section className="min-w-0">
        <header className="flex h-[68px] items-center justify-between border-b border-line bg-white px-[18px] text-xs text-body md:px-[34px]">
          <span>Panel administrativo</span>
          <div className="flex items-center gap-[17px]">
            <Link href="/admin/reportes" aria-label={`${pending} reportes pendientes`} className="relative text-body">
              <Icon name="flag" size={18} />
              {pending > 0 && <span className="absolute -top-px right-0 size-1.5 rounded-full bg-[#e35d50]" />}
            </Link>
            <Link href="/" target="_blank" className="flex h-[35px] items-center gap-[7px] rounded-lg border border-line bg-white px-3 font-bold text-brand-700">
              <Icon name="eye" size={18} /> <span className="max-[520px]:hidden">Ver sitio</span>
            </Link>
            <form action={signOut}><button type="submit" className="border-l border-line pl-[15px] text-[11px] text-muted">Salir</button></form>
          </div>
        </header>
        <div className="max-w-[1450px] px-[18px] py-6 md:p-[34px]">{children}</div>
      </section>
    </div>
  );
}

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f4f6f4]" aria-hidden />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
