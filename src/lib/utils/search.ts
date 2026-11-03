/** Evita que caracteres con significado en filtros PostgREST/LIKE alteren la consulta. */
export function sanitizeSearch(q: string) {
  return q.replace(/[%_\\,()*:."']/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
