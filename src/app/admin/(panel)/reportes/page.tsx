import type { Metadata } from "next";
import { withPanelSuspense } from "@/components/admin/panel-suspense";
import { ReportesPanel } from "@/components/admin/reportes-panel";
import { AdminTitle } from "@/components/admin/ui";
import { UrlFiltersProvider } from "@/components/ui/url-filters";
import { requireAdmin } from "@/features/auth/dal";
import { ESTADOS_REPORTE } from "@/features/establecimientos/labels";
import type { ReporteRow } from "@/features/reportes/schema";
import { createClient } from "@/lib/supabase/server";
import { sanitizeSearch } from "@/lib/utils/search";

export const metadata: Metadata = { title: "Reportes" };

const PAGE_SIZE = 10;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default withPanelSuspense(async function ReportesAdminPage({ searchParams }: PageProps<"/admin/reportes">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = sanitizeSearch(first(sp.q));
  const estado = first(sp.estado);
  const pagina = Math.max(1, Math.min(1000, Number(first(sp.pagina)) || 1));

  const supabase = await createClient();
  let query = supabase
    .from("reportes")
    .select(
      "id, estado, descripcion, nombre_reportante, correo_reportante, observacion_admin, fecha_revision, created_at, establecimientos(id, nombre, slug, estado_publicacion), administradores(nombre)",
      { count: "exact" },
    )
    .is("deleted_at", null);
  if (q) query = query.or(`descripcion.ilike.%${q}%,nombre_reportante.ilike.%${q}%,correo_reportante.ilike.%${q}%`);
  if (estado in ESTADOS_REPORTE) query = query.eq("estado", estado);
  const from = (pagina - 1) * PAGE_SIZE;
  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1)
    .overrideTypes<ReporteRow[], { merge: false }>();

  const total = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <AdminTitle icon="flag" title="Reportes" description="Revisa las alertas que envían los usuarios sobre los establecimientos." />
      <UrlFiltersProvider>
        <ReportesPanel reportes={data ?? []} total={total} totalPaginas={totalPaginas} />
      </UrlFiltersProvider>
    </>
  );
});
