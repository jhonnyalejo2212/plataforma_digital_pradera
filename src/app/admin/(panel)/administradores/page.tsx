import type { Metadata } from "next";
import { AdministradoresPanel } from "@/components/admin/administradores-panel";
import { withPanelSuspense } from "@/components/admin/panel-suspense";
import { AdminTitle } from "@/components/admin/ui";
import { UrlFiltersProvider } from "@/components/ui/url-filters";
import { requireAdmin } from "@/features/auth/dal";
import type { AdministradorRow } from "@/features/administradores/schema";
import { createClient } from "@/lib/supabase/server";
import { sanitizeSearch } from "@/lib/utils/search";

export const metadata: Metadata = { title: "Administradores" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

type Row = Omit<AdministradorRow, "total_establecimientos"> & { establecimientos: { count: number }[] };

export default withPanelSuspense(async function AdministradoresAdminPage({ searchParams }: PageProps<"/admin/administradores">) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const q = sanitizeSearch(first(sp.q));
  const estado = first(sp.estado);

  const supabase = await createClient();
  let query = supabase
    .from("administradores")
    .select("id, nombre, correo, activo, created_at, establecimientos(count)")
    .is("deleted_at", null)
    .is("establecimientos.deleted_at", null);
  if (q) query = query.or(`nombre.ilike.%${q}%,correo.ilike.%${q}%`);
  if (estado === "activo" || estado === "inactivo") query = query.eq("activo", estado === "activo");
  const { data } = await query.order("nombre").overrideTypes<Row[], { merge: false }>();

  const admins: AdministradorRow[] = (data ?? []).map(({ establecimientos, ...a }) => ({ ...a, total_establecimientos: establecimientos[0]?.count ?? 0 }));

  return (
    <>
      <AdminTitle icon="users" title="Administradores" description="Gestiona las cuentas con acceso al panel y los establecimientos bajo su responsabilidad." />
      <UrlFiltersProvider>
        <AdministradoresPanel admins={admins} currentAdminId={admin.id} />
      </UrlFiltersProvider>
    </>
  );
});
