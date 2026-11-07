import { z } from "zod";

export const administradorSchema = z.object({
  nombre: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres.").max(150),
  correo: z.email("Ingresa un correo válido.").max(255),
});

export type AdministradorResult = {
  ok: boolean;
  message: string;
  /** Enlace de acceso generado manualmente cuando el correo no se pudo enviar (límite de envío de Supabase). */
  actionLink?: string;
  fieldErrors?: Partial<Record<"nombre" | "correo", string>>;
};

export type AdministradorRow = {
  id: number;
  nombre: string;
  correo: string;
  activo: boolean;
  created_at: string;
  total_establecimientos: number;
};

export type AdministradorDetalle = {
  id: number;
  nombre: string;
  correo: string;
  auth_user_id: string;
  activo: boolean;
  created_at: string;
  establecimientos: { id: number; nombre: string; slug: string; estado_publicacion: string }[];
};
