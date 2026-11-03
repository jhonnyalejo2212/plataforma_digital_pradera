import type { Metadata } from "next";
import { withPanelSuspense } from "@/components/admin/panel-suspense";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminTitle } from "@/components/admin/ui";
import { DeleteEstablecimientoForm, EstablecimientoForm } from "@/components/admin/establecimiento-form";
import { requireAdmin } from "@/features/auth/dal";
import { eliminarEstablecimiento } from "@/features/establecimientos/admin-actions";
import { getEstablecimientoAdmin, getFormOptions } from "@/features/establecimientos/admin-queries";

export const metadata: Metadata = { title: "Editar establecimiento" };

export default withPanelSuspense(async function EditarEstablecimientoPage({ params, searchParams }: PageProps<"/admin/establecimientos/[id]">) {
  await requireAdmin();
  const [{ id: rawId }, sp] = await Promise.all([params, searchParams]);
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [est, { categorias, administradores }] = await Promise.all([getEstablecimientoAdmin(id), getFormOptions()]);
  if (!est) notFound();
  return (
    <>
      <AdminTitle title={est.nombre} description="Edita la información del establecimiento y cambia su estado de publicación." />
      <EstablecimientoForm
        creado={sp.creado === "1"}
        categorias={categorias}
        administradores={administradores}
        initial={{
          id: est.id,
          slug: est.slug,
          nombre: est.nombre,
          categoria_id: est.categoria_id,
          estado_publicacion: est.estado_publicacion as "borrador" | "en_revision" | "publicado",
          administrador_id: est.administrador_id ?? "",
          descripcion: est.descripcion ?? "",
          direccion: est.direccion ?? "",
          barrio: est.barrio ?? "",
          latitud: est.latitud?.toString() ?? "",
          longitud: est.longitud?.toString() ?? "",
        }}
      />
      <div className="mt-5 flex items-center justify-between">
        <Link href="/admin/establecimientos" className="text-xs text-muted">← Volver al listado</Link>
        <DeleteEstablecimientoForm id={est.id} action={eliminarEstablecimiento} />
      </div>
    </>
  );
});
