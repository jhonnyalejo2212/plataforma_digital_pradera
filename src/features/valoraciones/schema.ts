import { z } from "zod";

export const valoracionSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{1,200}$/),
  puntuacion: z.coerce.number("Elige una puntuación de 1 a 5 estrellas.").int().min(1, "Elige una puntuación de 1 a 5 estrellas.").max(5, "Elige una puntuación de 1 a 5 estrellas."),
  comentario: z.string().trim().max(1000, "El comentario es demasiado largo (máximo 1000 caracteres).").optional().transform((v) => v || null),
  nombre: z.string().trim().max(150, "El nombre es demasiado largo.").optional().transform((v) => v || null),
  website: z.string().max(0).optional(),
});

export type ValoracionState = { ok: boolean; message: string; fieldErrors?: Partial<Record<"puntuacion" | "comentario" | "nombre", string>> };

export const ESTADOS_VALORACION = { pendiente: "Pendiente", aprobada: "Aprobada", rechazada: "Rechazada" } as const;
export type EstadoValoracion = keyof typeof ESTADOS_VALORACION;

export const moderacionValoracionSchema = z.object({
  id: z.coerce.number().int().positive(),
  estado: z.enum(["pendiente", "aprobada", "rechazada"]),
});

export type ModeracionResult = { ok: boolean; message: string };

export type ValoracionRow = {
  id: number;
  estado: string;
  puntuacion: number;
  comentario: string | null;
  nombre_autor: string | null;
  created_at: string;
  establecimientos: { id: number; nombre: string; slug: string; estado_publicacion: string } | null;
};
