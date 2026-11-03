import type { Metadata } from "next";
import { AdminTitle } from "@/components/admin/ui";
import { EstablecimientoForm } from "@/components/admin/establecimiento-form";
import { requireAdmin } from "@/features/auth/dal";
import { getFormOptions } from "@/features/establecimientos/admin-queries";

export const metadata: Metadata = { title: "Registrar establecimiento" };

export default async function NuevoEstablecimientoPage() {
  const admin = await requireAdmin();
  const { categorias, administradores } = await getFormOptions();
  return (
    <>
      <AdminTitle title="Registrar establecimiento" description="Completa la información básica. Los horarios, contactos y fotografías se agregan después de crearlo." />
      <EstablecimientoForm
        categorias={categorias}
        administradores={administradores}
        initial={{ nombre: "", categoria_id: "", estado_publicacion: "borrador", administrador_id: admin.id, descripcion: "", direccion: "", barrio: "", latitud: "", longitud: "" }}
      />
    </>
  );
}
