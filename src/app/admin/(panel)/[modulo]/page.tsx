import { notFound } from "next/navigation";
import { AdminTitle } from "@/components/admin/ui";
import { ADMIN_SECTIONS } from "@/components/admin/sections";
import { Icon } from "@/components/ui/icon";
import { requireAdmin } from "@/features/auth/dal";

export function generateStaticParams() {
  return ADMIN_SECTIONS.filter((s) => s.href !== "/admin").map((s) => ({ modulo: s.href.replace("/admin/", "") }));
}

export default async function ModuloPendientePage({ params }: PageProps<"/admin/[modulo]">) {
  await requireAdmin();
  const { modulo } = await params;
  const section = ADMIN_SECTIONS.find((s) => s.href === `/admin/${modulo}`);
  if (!section) notFound();
  return (
    <>
      <AdminTitle title={section.label} description="Este módulo aún no está implementado." />
      <div className="grid min-h-[250px] place-items-center rounded-[14px] border border-dashed border-line bg-white p-8 text-center text-muted">
        <div><Icon name={section.icon} size={28} className="mx-auto mb-3 text-brand-600" /><strong className="text-sm text-ink">Próximamente</strong><p className="mt-1 text-[11px]">Estamos construyendo la gestión de {section.label.toLowerCase()}.</p></div>
      </div>
    </>
  );
}
