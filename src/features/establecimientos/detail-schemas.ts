import { z } from "zod";
import { TIPOS_CONTACTO } from "./detail-constants";

export type ActionResult<T = unknown> = { ok: boolean; message: string; fieldErrors?: Record<string, string>; data?: T };

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora no válida.");

export const horariosSchema = z
  .array(
    z.object({
      dia: z.number().int().min(1).max(7),
      cerrado: z.boolean(),
      apertura: z.string(),
      cierre: z.string(),
      observacion: z.string().trim().max(255, "Máximo 255 caracteres.").optional().default(""),
    }),
  )
  .length(7)
  .superRefine((rows, ctx) => {
    rows.forEach((r, i) => {
      if (r.cerrado) return;
      if (!time.safeParse(r.apertura).success) ctx.addIssue({ code: "custom", path: [i, "apertura"], message: "Indica la hora de apertura." });
      if (!time.safeParse(r.cierre).success) ctx.addIssue({ code: "custom", path: [i, "cierre"], message: "Indica la hora de cierre." });
    });
  });


const tipoContacto = z.enum(TIPOS_CONTACTO.map((t) => t.value) as [string, ...string[]]);

function normalizeContacto(tipo: string, raw: string): { valor?: string; error?: string } {
  const v = raw.trim();
  if (!v) return { error: "Este campo es obligatorio." };
  if (v.length > 300) return { error: "Demasiado largo." };
  if (tipo === "telefono" || tipo === "whatsapp") {
    const digits = v.replace(/\D/g, "");
    if (!/^[\d\s()+\-]+$/.test(v) || digits.length < 7 || digits.length > 15) return { error: "Ingresa un número válido (7 a 15 dígitos)." };
    return { valor: v };
  }
  if (tipo === "correo") return z.email().safeParse(v).success ? { valor: v } : { error: "Ingresa un correo válido." };
  const asUrl = (u: string) => {
    try {
      const url = new URL(/^https?:\/\//i.test(u) ? u : `https://${u}`);
      return url.protocol === "https:" || url.protocol === "http:" ? url : null;
    } catch {
      return null;
    }
  };
  if (tipo === "instagram" && /^@?[A-Za-z0-9._]{1,30}$/.test(v)) return { valor: `https://instagram.com/${v.replace(/^@/, "")}` };
  const url = asUrl(v);
  if (!url || !url.hostname.includes(".")) return { error: "Ingresa una dirección web válida." };
  return { valor: url.toString() };
}

export const contactosSchema = z
  .array(
    z.object({
      id: z.number().int().positive().optional(),
      tipo: tipoContacto,
      valor: z.string(),
      etiqueta: z.string().trim().max(100, "Máximo 100 caracteres.").optional().default(""),
    }),
  )
  .max(20, "Máximo 20 medios de contacto.")
  .transform((rows, ctx) =>
    rows.map((r, i) => {
      const n = normalizeContacto(r.tipo, r.valor);
      if (n.error) ctx.addIssue({ code: "custom", path: [i, "valor"], message: n.error });
      return { ...r, valor: n.valor ?? r.valor, etiqueta: r.etiqueta || null };
    }),
  );

export const productosSchema = z
  .array(
    z.object({
      id: z.number().int().positive().optional(),
      nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres.").max(180, "Máximo 180 caracteres."),
      tipo: z.enum(["producto", "servicio"]),
      descripcion: z.string().trim().max(500, "Máximo 500 caracteres.").optional().default(""),
      precio: z.string().trim(),
      disponible: z.boolean(),
    }),
  )
  .max(100, "Máximo 100 elementos.")
  .transform((rows, ctx) =>
    rows.map((r, i) => {
      let precio: number | null = null;
      if (r.precio !== "") {
        precio = Number(r.precio.replace(/[.\s$]/g, "").replace(",", "."));
        if (!Number.isFinite(precio) || precio < 0 || precio > 999_999_999) {
          ctx.addIssue({ code: "custom", path: [i, "precio"], message: "Precio no válido." });
          precio = null;
        }
      }
      return { ...r, descripcion: r.descripcion || null, precio };
    }),
  );

export function issuesToFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) fieldErrors[issue.path.join(".")] ??= issue.message;
  return fieldErrors;
}

