"use client";

import { useUrlFilters } from "@/components/ui/url-filters";

const OPCIONES = [
  { value: "", label: "Nombre A–Z" },
  { value: "nombre_desc", label: "Nombre Z–A" },
  { value: "recientes", label: "Más recientes" },
  { value: "antiguos", label: "Más antiguos" },
];

/** Select de orden del directorio: guarda la opción en la URL y aplica sin recargar. */
export function DirectorySort() {
  const { params, setFilters } = useUrlFilters();
  return (
    <label className="flex items-center gap-2 text-xs text-muted">
      <span>Ordenar:</span>
      <select
        value={params.get("orden") ?? ""}
        onChange={(e) => setFilters({ orden: e.target.value })}
        aria-label="Ordenar resultados"
        className="h-10 rounded-lg border border-line bg-white px-2.5 text-xs font-bold text-body"
      >
        {OPCIONES.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
