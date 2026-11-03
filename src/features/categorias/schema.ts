import { z } from "zod";
import { CATEGORY_ICONS, CATEGORY_TONES } from "./constants";

export const categoriaSchema = z.object({
  id: z.string().regex(/^\d+$/).optional(),
  nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres.").max(120, "Máximo 120 caracteres."),
  descripcion: z.string().trim().max(500, "Máximo 500 caracteres.").transform((v) => v || null),
  icono: z.enum(CATEGORY_ICONS.map((i) => i.value) as [string, ...string[]], { error: "Icono no válido." }),
  tono: z.enum(CATEGORY_TONES.map((t) => t.value) as [string, ...string[]], { error: "Color no válido." }),
  orden: z.string().trim().transform((v) => (v === "" ? 0 : Number(v))).pipe(z.number({ error: "Orden no válido." }).int("Debe ser un número entero.").min(0).max(999)),
  activa: z.string().optional().transform((v) => v === "on"),
});

export type CategoriaResult = { ok: boolean; message: string; fieldErrors?: Record<string, string> };
