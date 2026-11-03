import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { withPanelSuspense } from "@/components/admin/panel-suspense";
import { AdminTitle, StatusBadge } from "@/components/admin/ui";
import { ContactosPanel } from "@/components/admin/establecimiento/contactos-panel";
import { HorariosPanel } from "@/components/admin/establecimiento/horarios-panel";
import { ImagenesPanel } from "@/components/admin/establecimiento/imagenes-panel";
import { OfertaPanel } from "@/components/admin/establecimiento/oferta-panel";
import { EstablecimientoTabs } from "@/components/admin/establecimiento/tabs";
import { DeleteEstablecimientoForm, EstablecimientoForm } from "@/components/admin/establecimiento-form";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/features/auth/dal";
import { eliminarEstablecimiento } from "@/features/establecimientos/admin-actions";
import { getDetalleAdmin, getEstablecimientoAdmin, getFormOptions } from "@/features/establecimientos/admin-queries";
import { ESTADOS_PUBLICACION } from "@/features/establecimientos/labels";

export const metadata: Metadata = { title: "Editar establecimiento" };

export default withPanelSuspense(async function EditarEstablecimientoPage({ params, searchParams }: PageProps<"/admin/establecimientos/[id]">) {
  await requireAdmin();
  const [{ id: rawId }, sp] = await Promise.all([params, searchParams]);
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [est, { categorias, administradores }, detalle] = await Promise.all([getEstablecimientoAdmin(id), getFormOptions(), getDetalleAdmin(id)]);
  if (!est) notFound();
  const estado = est.estado_publicacion as keyof typeof ESTADOS_PUBLICACION;

  return (
    <>
      <AdminTitle
        icon="building"
        title={est.nombre}
        description="Administra toda la información de este establecimiento."
        action={
          <div className="flex items-center gap-2.5">
            <StatusBadge tone={estado === "publicado" ? "success" : "warning"}>{ESTADOS_PUBLICACION[estado]}</StatusBadge>
            {estado === "publicado" && <Button href={`/directorio/${est.slug}`} target="_blank" variant="secondary" icon="eye" iconOnlyOnMobile>Ver en el sitio</Button>}
          </div>
        }
      />
      <EstablecimientoTabs
        tabs={[
          {
            id: "info",
            label: "Información",
            icon: "info",
            content: (
              <>
                <EstablecimientoForm
                  creado={sp.creado === "1"}
                  categorias={categorias}
                  administradores={administradores}
                  initial={{
                    id: est.id,
                    slug: est.slug,
                    nombre: est.nombre,
                    categoria_id: est.categoria_id,
                    estado_publicacion: estado,
                    administrador_id: est.administrador_id ?? "",
                    descripcion: est.descripcion ?? "",
                    direccion: est.direccion ?? "",
                    barrio: est.barrio ?? "",
                    latitud: est.latitud?.toString() ?? "",
                    longitud: est.longitud?.toString() ?? "",
                  }}
                />
                <div className="mt-5 flex justify-end"><DeleteEstablecimientoForm id={est.id} action={eliminarEstablecimiento} /></div>
              </>
            ),
          },
          { id: "fotos", label: "Fotos", icon: "image", count: detalle.imagenes.length, content: <ImagenesPanel establecimientoId={id} imagenes={detalle.imagenes} /> },
          { id: "horarios", label: "Horarios", icon: "clock", count: detalle.horarios.filter((h) => !h.cerrado).length || undefined, content: <HorariosPanel establecimientoId={id} horarios={detalle.horarios} /> },
          { id: "contactos", label: "Contactos", icon: "phone", count: detalle.contactos.length, content: <ContactosPanel establecimientoId={id} contactos={detalle.contactos} /> },
          { id: "oferta", label: "Oferta", icon: "tag", count: detalle.productos.length, content: <OfertaPanel establecimientoId={id} productos={detalle.productos} /> },
        ]}
      />
    </>
  );
});
