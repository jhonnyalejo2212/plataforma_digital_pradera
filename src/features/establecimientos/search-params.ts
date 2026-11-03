import { z } from "zod";
import type { FiltrosDirectorio } from "./types";

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const schema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  categoria: z.string().regex(/^[a-z0-9-]{1,140}$/).optional().catch(undefined),
  barrio: z.string().trim().max(120).optional().catch(undefined),
  orden: z.enum(["nombre", "recientes"]).catch("nombre"),
  pagina: z.coerce.number().int().min(1).max(1000).catch(1),
});

export function parseFiltros(raw: Record<string, string | string[] | undefined>): FiltrosDirectorio {
  const parsed = schema.parse({
    q: first(raw.q) || undefined,
    categoria: first(raw.categoria) || undefined,
    barrio: first(raw.barrio) || undefined,
    orden: first(raw.orden),
    pagina: first(raw.pagina),
  });
  return parsed;
}

/** Construye `/directorio?...` conservando los filtros actuales y aplicando cambios. */
export function directorioHref(current: FiltrosDirectorio, changes: Partial<Record<keyof FiltrosDirectorio, string | number | null>> = {}) {
  const next: Record<string, string | number | null | undefined> = { ...current, pagina: 1, ...changes };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) {
    if (value === null || value === undefined || value === "") continue;
    if (key === "orden" && value === "nombre") continue;
    if (key === "pagina" && value === 1) continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `/directorio?${qs}` : "/directorio";
}
