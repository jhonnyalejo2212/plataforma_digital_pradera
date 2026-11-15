"use client";

import Link from "next/link";
import { useTransition } from "react";
import { StatusBadge } from "@/components/admin/ui";
import { Stars } from "@/components/public/rating-stars";
import { useConfirm, useToast } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { ClearFiltersButton, FilterLink, FiltersResults, useLiveText, useUrlFilters } from "@/components/ui/url-filters";
import { formatFecha } from "@/features/establecimientos/labels";
import { eliminarValoracion, moderarValoracion } from "@/features/valoraciones/admin-actions";
import { ESTADOS_VALORACION, type EstadoValoracion, type ValoracionRow } from "@/features/valoraciones/schema";

const selectClass = "h-11 rounded-[9px] border border-line bg-white px-2.5 text-sm text-body";
const estadoTone: Record<EstadoValoracion, "warning" | "success" | "danger"> = { pendiente: "warning", aprobada: "success", rechazada: "danger" };
const actionClass = "flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-50";

export function ValoracionesPanel({ valoraciones, total, totalPaginas }: { valoraciones: ValoracionRow[]; total: number; totalPaginas: number }) {
  const { params, setFilters } = useUrlFilters();
  const text = useLiveText("q");
  const toast = useToast();
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const estado = params.get("estado") ?? "";

  const moderar = (id: number, nuevo: EstadoValoracion) =>
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(id));
      formData.set("estado", nuevo);
      const res = await moderarValoracion(formData);
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
    });

  const eliminar = async (v: ValoracionRow) => {
    const ok = await confirm({
      title: "¿Eliminar esta valoración?",
      description: `Se quitará la valoración de ${v.nombre_autor ?? "un visitante anónimo"} y dejará de contar en el promedio.`,
      confirmLabel: "Eliminar",
      tone: "danger",
      icon: "trash",
    });
    if (!ok) return;
    startTransition(async () => {
      const res = await eliminarValoracion(v.id);
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  return (
    <section className="overflow-hidden rounded-[14px] border border-line bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-line px-[25px] py-[23px]">
        <div>
          <h2 className="flex items-center gap-2 text-lg"><Icon name="star" size={20} className="text-brand-700" />Moderación de valoraciones</h2>
          <p className="mt-[5px] text-[11px] text-muted">Solo las valoraciones aprobadas se muestran en el sitio y cuentan en el promedio.</p>
        </div>
      </div>

      <div role="search" className="grid gap-3 border-b border-line p-[18px] md:grid-cols-[1fr_200px]">
        <div className="flex h-11 items-center gap-[9px] rounded-[9px] border border-line pl-[13px] text-muted focus-within:border-brand-500">
          <Icon name="search" size={18} />
          <input
            type="search"
            value={text.value}
            onChange={(e) => text.onChange(e.target.value)}
            onFocus={text.onFocus}
            onBlur={text.onBlur}
            onKeyDown={(e) => e.key === "Enter" && text.submit()}
            aria-label="Buscar valoraciones"
            placeholder="Buscar en el comentario o por autor…"
            autoComplete="off"
            className="min-w-0 flex-1 border-0 bg-transparent text-sm text-ink outline-0"
          />
        </div>
        <select value={estado} onChange={(e) => setFilters({ estado: e.target.value })} aria-label="Estado de la valoración" className={selectClass}>
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS_VALORACION).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <FiltersResults>
        {valoraciones.length === 0 ? (
          <div className="grid min-h-[250px] place-items-center p-8 text-center text-muted">
            <div>
              <Icon name="search" size={28} className="mx-auto mb-3 text-brand-600" />
              <strong className="text-sm text-ink">No hay valoraciones</strong>
              <p className="mt-1 mb-3 text-[11px]">No encontramos valoraciones con esos filtros.</p>
              <ClearFiltersButton className="text-[11px] font-bold text-brand-700">Limpiar filtros</ClearFiltersButton>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto" aria-busy={pending}>
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr className="bg-[#fafbfa] text-left text-[9px] uppercase tracking-[0.08em] text-muted">
                  <th className="px-[18px] py-3">Establecimiento</th>
                  <th className="px-[18px] py-3">Valoración</th>
                  <th className="px-[18px] py-3">Autor</th>
                  <th className="px-[18px] py-3">Estado</th>
                  <th className="px-[18px] py-3">Fecha</th>
                  <th className="px-[18px] py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {valoraciones.map((v) => (
                  <tr key={v.id} className="border-t border-[#edf0ee] text-xs text-body">
                    <td className="max-w-[180px] px-[18px] py-3">
                      {v.establecimientos ? (
                        <Link href={`/admin/establecimientos/${v.establecimientos.id}`} className="block truncate font-bold text-ink hover:text-brand-700">{v.establecimientos.nombre}</Link>
                      ) : (
                        <span className="text-muted">Eliminado</span>
                      )}
                    </td>
                    <td className="max-w-[300px] px-[18px] py-3">
                      <Stars value={v.puntuacion} size={14} />
                      {v.comentario ? <span className="mt-1 line-clamp-3 block leading-[1.5] text-body">{v.comentario}</span> : <span className="mt-1 block text-[11px] text-muted">Sin comentario</span>}
                    </td>
                    <td className="px-[18px] py-3"><strong className="block max-w-[140px] truncate text-ink">{v.nombre_autor ?? "Anónimo"}</strong></td>
                    <td className="px-[18px] py-3"><StatusBadge tone={estadoTone[v.estado as EstadoValoracion] ?? "neutral"}>{ESTADOS_VALORACION[v.estado as EstadoValoracion] ?? v.estado}</StatusBadge></td>
                    <td className="px-[18px] py-3">{formatFecha(v.created_at)}</td>
                    <td className="px-[18px] py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {v.estado !== "aprobada" && (
                          <button type="button" disabled={pending} onClick={() => moderar(v.id, "aprobada")} className={`${actionClass} text-brand-700`}><Icon name="check" size={14} />Aprobar</button>
                        )}
                        {v.estado !== "rechazada" && (
                          <button type="button" disabled={pending} onClick={() => moderar(v.id, "rechazada")} className={`${actionClass} text-[#a26d1d]`}><Icon name="x" size={14} />Rechazar</button>
                        )}
                        <button type="button" disabled={pending} onClick={() => eliminar(v)} aria-label="Eliminar valoración" className={`${actionClass} text-[#a34d47]`}><Icon name="trash" size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </FiltersResults>

      <div className="flex items-center justify-between border-t border-line px-[18px] py-3 text-[11px] text-muted">
        <span>{total} {total === 1 ? "valoración" : "valoraciones"}</span>
        {totalPaginas > 1 && (
          <nav aria-label="Paginación" className="flex gap-1.5">
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
              <FilterLink key={n} changes={{ pagina: n }} className="grid size-8 place-items-center rounded-lg border border-line bg-white text-body data-[active=true]:border-brand-700 data-[active=true]:bg-brand-700 data-[active=true]:text-white">{n}</FilterLink>
            ))}
          </nav>
        )}
      </div>
    </section>
  );
}
