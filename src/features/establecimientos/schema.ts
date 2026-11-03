import { z } from "zod";

const coord = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v.replace(",", "."))))
    .pipe(z.number({ error: `${label} no es un número válido.` }).min(min, `${label} fuera de rango.`).max(max, `${label} fuera de rango.`).nullable());

const optionalText = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres.`).transform((v) => v || null);

export const establecimientoSchema = z
  .object({
    id: z.string().regex(/^\d+$/).optional(),
    nombre: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres.").max(180, "Máximo 180 caracteres."),
    categoria_id: z.coerce.number({ error: "Selecciona una categoría." }).int().positive("Selecciona una categoría."),
    estado_publicacion: z.enum(["borrador", "en_revision", "publicado"], { error: "Estado no válido." }),
    administrador_id: z.string().transform((v) => (v ? Number(v) : null)).pipe(z.number().int().positive().nullable()),
    descripcion: optionalText(5000),
    direccion: optionalText(255),
    barrio: optionalText(120),
    latitud: coord(-90, 90, "La latitud"),
    longitud: coord(-180, 180, "La longitud"),
  })
  .refine((v) => (v.latitud === null) === (v.longitud === null), { path: ["latitud"], message: "Ingresa latitud y longitud juntas, o deja ambas vacías." });

export type EstablecimientoFormState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
};
