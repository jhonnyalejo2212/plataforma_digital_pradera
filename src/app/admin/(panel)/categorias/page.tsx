import type { Metadata } from "next";
import { CategoriasManager, type CategoriaAdmin } from "@/components/admin/categorias-manager";
import { withPanelSuspense } from "@/components/admin/panel-suspense";
import { AdminTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/features/auth/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Categorías" };

type Row = Omit<CategoriaAdmin, "total"> & { establecimientos: { count: number }[] };

export default withPanelSuspense(async function CategoriasAdminPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("categorias")
    .select("id, nombre, descripcion, icono, tono, orden, activa, establecimientos(count)")
    .is("deleted_at", null)
    .is("establecimientos.deleted_at", null)
    .order("orden")
    .overrideTypes<Row[], { merge: false }>();
  const categorias: CategoriaAdmin[] = (data ?? []).map(({ establecimientos, ...c }) => ({ ...c, total: establecimientos[0]?.count ?? 0 }));
  return (
    <>
      <AdminTitle title="Categorías" description="Organiza la oferta local en grupos para facilitar la búsqueda." />
      <CategoriasManager categorias={categorias} />
    </>
  );
});
