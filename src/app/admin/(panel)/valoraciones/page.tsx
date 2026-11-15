import type { Metadata } from "next";
import { withPanelSuspense } from "@/components/admin/panel-suspense";
import { ValoracionesPanel } from "@/components/admin/valoraciones-panel";
import { AdminTitle } from "@/components/admin/ui";
import { UrlFiltersProvider } from "@/components/ui/url-filters";
import { requireAdmin } from "@/features/auth/dal";
import { ESTADOS_VALORACION, type ValoracionRow } from "@/features/valoraciones/schema";
import { createClient } from "@/lib/supabase/server";
import { sanitizeSearch } from "@/lib/utils/search";

export const metadata: Metadata = { title: "Valoraciones" };

const PAGE_SIZE = 10;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default withPanelSuspense(async function ValoracionesAdminPage({ searchParams }: PageProps<"/admin/valoraciones">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = sanitizeSearch(first(sp.q));
  const estado = first(sp.estado);
  const pagina = Math.max(1, Math.min(1000, Number(first(sp.pagina)) || 1));

  const supabase = await createClient();
  let query = supabase
    .from("valoraciones")
    .select("id, estado, puntuacion, comentario, nombre_autor, created_at, establecimientos(id, nombre, slug, estado_publicacion)", { count: "exact" })
    .is("deleted_at", null);
  if (q) query = query.or(`comentario.ilike.%${q}%,nombre_autor.ilike.%${q}%`);
  if (estado in ESTADOS_VALORACION) query = query.eq("estado", estado);
  const from = (pagina - 1) * PAGE_SIZE;
  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1)
    .overrideTypes<ValoracionRow[], { merge: false }>();

  const total = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <AdminTitle icon="star" title="Valoraciones" description="Modera las valoraciones que dejan los visitantes antes de publicarlas." />
      <UrlFiltersProvider>
        <ValoracionesPanel valoraciones={data ?? []} total={total} totalPaginas={totalPaginas} />
      </UrlFiltersProvider>
    </>
  );
});
