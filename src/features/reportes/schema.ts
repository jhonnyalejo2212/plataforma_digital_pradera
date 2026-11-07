import { z } from "zod";

export const reporteSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{1,200}$/),
  nombre: z.string().trim().max(150).optional().transform((v) => v || null),
  correo: z
    .union([z.literal(""), z.email().max(255)])
    .optional()
    .transform((v) => v || null),
  descripcion: z.string().trim().min(10, "Describe el problema con al menos 10 caracteres.").max(2000, "El texto es demasiado largo (máximo 2000 caracteres)."),
  website: z.string().max(0).optional(),
});

export type ReporteState = { ok: boolean; message: string; fieldErrors?: Partial<Record<"nombre" | "correo" | "descripcion", string>> };

export const revisionReporteSchema = z.object({
  id: z.coerce.number().int().positive(),
  estado: z.enum(["pendiente", "en_revision", "revisado"]),
  observacion: z
    .string()
    .trim()
    .max(2000, "La observación es demasiado larga (máximo 2000 caracteres).")
    .optional()
    .transform((v) => v || null),
});

export type RevisionResult = { ok: boolean; message: string; fieldErrors?: Partial<Record<"observacion" | "estado", string>> };

export type ReporteRow = {
  id: number;
  estado: string;
  descripcion: string;
  nombre_reportante: string | null;
  correo_reportante: string | null;
  observacion_admin: string | null;
  fecha_revision: string | null;
  created_at: string;
  establecimientos: { id: number; nombre: string; slug: string; estado_publicacion: string } | null;
  administradores: { nombre: string } | null;
};
