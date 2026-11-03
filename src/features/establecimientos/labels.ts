export const ESTADOS_PUBLICACION = { borrador: "Borrador", en_revision: "En revisión", publicado: "Publicado" } as const;
export type EstadoPublicacion = keyof typeof ESTADOS_PUBLICACION;

export const ESTADOS_REPORTE = { pendiente: "Pendiente", en_revision: "En revisión", revisado: "Revisado" } as const;
export type EstadoReporte = keyof typeof ESTADOS_REPORTE;

const fecha = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Bogota" });
export const formatFecha = (iso: string) => fecha.format(new Date(iso));
