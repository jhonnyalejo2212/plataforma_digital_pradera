import Image from "next/image";
import { withPanelSuspense } from "@/components/admin/panel-suspense";
import Link from "next/link";
import { AdminTitle, Panel, StatusBadge } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { requireAdmin } from "@/features/auth/dal";
import { ESTADOS_PUBLICACION, ESTADOS_REPORTE, formatFecha, type EstadoPublicacion, type EstadoReporte } from "@/features/establecimientos/labels";
import { createClient } from "@/lib/supabase/server";

type Recent = { id: number; nombre: string; estado_publicacion: EstadoPublicacion; updated_at: string; categorias: { nombre: string } | null; imagenes: { url: string; es_principal: boolean }[] };
type PendingReport = { id: number; descripcion: string; estado: EstadoReporte; establecimientos: { nombre: string } | null };

function Stat({ icon, tone, label, value, hint }: { icon: IconName; tone: string; label: string; value: number; hint: string }) {
  return (
    <div className="flex items-start gap-[15px] rounded-[13px] border border-line bg-white p-5 max-md:gap-2.5 max-md:p-[15px]">
      <span className={`grid size-[42px] shrink-0 place-items-center rounded-[11px] ${tone}`}><Icon name={icon} /></span>
      <div className="flex flex-col">
        <small className="text-[10px] text-muted">{label}</small>
        <strong className="my-0.5 font-display text-[25px]">{value}</strong>
        <em className="text-[9px] not-italic text-brand-600">{hint}</em>
      </div>
    </div>
  );
}

export default withPanelSuspense(async function AdminDashboardPage() {
  await requireAdmin();
  const supabase = await createClient();
  const count = (table: string) => supabase.from(table).select("id", { count: "exact", head: true }).is("deleted_at", null);
  const [est, pub, cat, rep, img, recent, pending] = await Promise.all([
    count("establecimientos"),
    count("establecimientos").eq("estado_publicacion", "publicado"),
    count("categorias"),
    count("reportes").neq("estado", "revisado"),
    count("imagenes"),
    supabase.from("establecimientos").select("id, nombre, estado_publicacion, updated_at, categorias(nombre), imagenes(url, es_principal)").is("deleted_at", null).order("updated_at", { ascending: false }).limit(4).overrideTypes<Recent[], { merge: false }>(),
    supabase.from("reportes").select("id, descripcion, estado, establecimientos(nombre)").neq("estado", "revisado").is("deleted_at", null).order("created_at", { ascending: false }).limit(3).overrideTypes<PendingReport[], { merge: false }>(),
  ]);

  return (
    <>
      <AdminTitle title="Resumen" description="Estado general de la información del directorio." action={<Button href="/admin/establecimientos/nuevo" icon="plus" iconOnlyOnMobile>Nuevo establecimiento</Button>} />
      <div className="grid grid-cols-2 gap-2.5 md:gap-[17px] xl:grid-cols-4">
        <Stat icon="building" tone="bg-brand-100 text-brand-700" label="Establecimientos" value={est.count ?? 0} hint={`${pub.count ?? 0} publicados`} />
        <Stat icon="grid" tone="bg-[#fff2d8] text-[#a26d1d]" label="Categorías" value={cat.count ?? 0} hint="Registradas" />
        <Stat icon="flag" tone="bg-[#fce8e6] text-[#ba5148]" label="Reportes pendientes" value={rep.count ?? 0} hint="Requieren revisión" />
        <Stat icon="eye" tone="bg-[#e6f2f8] text-[#347498]" label="Fotografías" value={img.count ?? 0} hint="En todos los registros" />
      </div>
      <div className="mt-[18px] grid gap-[18px] lg:grid-cols-[minmax(0,2fr)_minmax(280px,0.85fr)]">
        <Panel title="Establecimientos recientes" subtitle="Últimos registros modificados" action={<Link href="/admin/establecimientos" className="flex items-center gap-1.5 text-[10px] font-bold text-brand-600">Ver todos <Icon name="arrow" size={16} /></Link>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
              <thead><tr className="bg-[#fafbfa] text-left text-[8px] uppercase tracking-[0.08em] text-muted"><th className="px-[18px] py-[11px]">Establecimiento</th><th className="px-[18px] py-[11px]">Categoría</th><th className="px-[18px] py-[11px]">Estado</th><th className="px-[18px] py-[11px]">Actualizado</th></tr></thead>
              <tbody>
                {(recent.data ?? []).map((r) => {
                  const img = r.imagenes.find((i) => i.es_principal) ?? r.imagenes[0];
                  return (
                    <tr key={r.id} className="border-t border-[#edf0ee] text-[10px] text-body">
                      <td className="px-[18px] py-[13px]"><Link href={`/admin/establecimientos/${r.id}`} className="flex items-center gap-[9px] text-ink">
                        {img ? <Image src={img.url} alt="" width={34} height={34} className="size-[34px] rounded-lg object-cover" /> : <span className="grid size-[34px] place-items-center rounded-lg bg-brand-50 text-brand-600"><Icon name="building" size={16} /></span>}
                        <strong>{r.nombre}</strong></Link></td>
                      <td className="px-[18px] py-[13px]">{r.categorias?.nombre}</td>
                      <td className="px-[18px] py-[13px]"><StatusBadge tone={r.estado_publicacion === "publicado" ? "success" : "warning"}>{ESTADOS_PUBLICACION[r.estado_publicacion]}</StatusBadge></td>
                      <td className="px-[18px] py-[13px]">{formatFecha(r.updated_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Reportes pendientes" subtitle="Información por verificar">
          {(pending.data ?? []).length === 0 && <p className="p-5 text-xs text-muted">No hay reportes pendientes.</p>}
          {(pending.data ?? []).map((r) => (
            <Link key={r.id} href="/admin/reportes" className="grid grid-cols-[37px_1fr_20px] items-center gap-[11px] border-b border-[#edf0ee] px-[19px] py-4">
              <span className="grid size-[37px] place-items-center rounded-[9px] bg-[#fceceb] text-[#c45b52]"><Icon name="flag" /></span>
              <div className="min-w-0"><strong className="block truncate text-[11px]">{r.descripcion}</strong><p className="mt-0.5 text-[9px] text-body">{r.establecimientos?.nombre}</p><small className="text-[8px] text-muted">Estado: {ESTADOS_REPORTE[r.estado]}</small></div>
              <Icon name="chevron" size={17} className="text-muted" />
            </Link>
          ))}
          <Button href="/admin/reportes" variant="secondary" className="mx-[18px] my-[15px] w-[calc(100%-36px)]">Revisar todos los reportes</Button>
        </Panel>
      </div>
    </>
  );
});
