"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Field, inputClass } from "@/components/admin/form";
import { StatusBadge } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { ClearFiltersButton, FilterLink, FiltersResults, useLiveText, useUrlFilters } from "@/components/ui/url-filters";
import { guardarRevisionReporte } from "@/features/reportes/admin-actions";
import type { ReporteRow, RevisionResult } from "@/features/reportes/schema";
import { ESTADOS_PUBLICACION, ESTADOS_REPORTE, formatFecha, type EstadoPublicacion, type EstadoReporte } from "@/features/establecimientos/labels";

const selectClass = "h-11 rounded-[9px] border border-line bg-white px-2.5 text-sm text-body";
const estadoTone: Record<EstadoReporte, "warning" | "neutral" | "success"> = { pendiente: "warning", en_revision: "neutral", revisado: "success" };

function RevisionForm({ reporte, onDone }: { reporte: ReporteRow; onDone: () => void }) {
  const [result, setResult] = useState<RevisionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const errors = result?.fieldErrors ?? {};
  const est = reporte.establecimientos;

  const save = (formData: FormData) =>
    startTransition(async () => {
      const res = await guardarRevisionReporte(formData);
      if (res.ok) {
        toast.success(res.message);
        onDone();
      } else setResult(res);
    });

  return (
    <div className="px-[25px] pt-6 pb-[25px]">
      <dl className="grid gap-4 rounded-lg bg-[#f4f6f4] p-4 sm:grid-cols-2">
        <div>
          <dt className="text-[10px] font-bold text-muted">Establecimiento</dt>
          <dd className="mt-1 flex flex-wrap items-center gap-2">
            {est ? (
              <>
                <Link href={`/admin/establecimientos/${est.id}`} className="text-sm font-bold text-brand-700 hover:underline">{est.nombre}</Link>
                <StatusBadge tone={est.estado_publicacion === "publicado" ? "success" : "warning"}>{ESTADOS_PUBLICACION[est.estado_publicacion as EstadoPublicacion] ?? est.estado_publicacion}</StatusBadge>
                {est.estado_publicacion === "publicado" && (
                  <Link href={`/directorio/${est.slug}`} target="_blank" className="flex items-center gap-1 text-[10px] font-bold text-body"><Icon name="eye" size={12} />Ver ficha</Link>
                )}
              </>
            ) : (
              <span className="text-sm text-ink">Establecimiento eliminado</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold text-muted">Reportante</dt>
          <dd className="mt-1 text-sm text-ink">
            {reporte.nombre_reportante ?? "Anónimo"}
            {reporte.correo_reportante && <span className="text-muted"> · {reporte.correo_reportante}</span>}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-[10px] font-bold text-muted">Descripción del problema</dt>
          <dd className="mt-1 whitespace-pre-line text-sm leading-[1.6] text-ink">{reporte.descripcion}</dd>
        </div>
        <div><dt className="text-[10px] font-bold text-muted">Fecha del reporte</dt><dd className="mt-1 text-sm text-ink">{formatFecha(reporte.created_at)}</dd></div>
        <div>
          <dt className="text-[10px] font-bold text-muted">Última revisión</dt>
          <dd className="mt-1 text-sm text-ink">
            {reporte.fecha_revision ? `${formatFecha(reporte.fecha_revision)}${reporte.administradores?.nombre ? ` por ${reporte.administradores.nombre}` : ""}` : "Sin revisión previa"}
          </dd>
        </div>
      </dl>

      <form action={save} className="mt-5 grid gap-[17px]">
        <input type="hidden" name="id" value={reporte.id} />
        <Field label="Estado del reporte" error={errors.estado}>
          <select name="estado" defaultValue={reporte.estado} className={inputClass}>
            {Object.entries(ESTADOS_REPORTE).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
        <Field label="Observación para el equipo" error={errors.observacion} hint="Se guarda internamente junto con la revisión.">
          <textarea name="observacion" defaultValue={reporte.observacion_admin ?? ""} rows={3} maxLength={2000} placeholder="Notas sobre la revisión (opcional)…" className={inputClass} aria-invalid={Boolean(errors.observacion)} />
        </Field>
        {result && !result.ok && <p role="alert" className="rounded-lg bg-[#fceceb] px-3 py-2.5 text-xs text-[#a34d47]">{result.message}</p>}
        <footer className="sticky bottom-0 -mx-[25px] flex items-center gap-[9px] border-t border-line bg-white px-[25px] py-[17px]">
          <Button variant="secondary" icon="x" onClick={onDone}>Cancelar</Button>
          <Button type="submit" icon="save" disabled={pending}>{pending ? "Guardando…" : "Guardar revisión"}</Button>
        </footer>
      </form>
    </div>
  );
}

export function ReportesPanel({ reportes, total, totalPaginas }: { reportes: ReporteRow[]; total: number; totalPaginas: number }) {
  const { params, setFilters } = useUrlFilters();
  const text = useLiveText("q");
  const [revisionId, setRevisionId] = useState<number | null>(null);
  const estado = params.get("estado") ?? "";
  const seleccionado = reportes.find((r) => r.id === revisionId) ?? null;

  return (
    <section className="overflow-hidden rounded-[14px] border border-line bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-line px-[25px] py-[23px]">
        <div>
          <h2 className="flex items-center gap-2 text-lg"><Icon name="flag" size={20} className="text-brand-700" />Bandeja de reportes</h2>
          <p className="mt-[5px] text-[11px] text-muted">Revisa el contenido reportado y marca el estado de cada caso.</p>
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
            aria-label="Buscar reportes"
            placeholder="Buscar en la descripción o por reportante…"
            autoComplete="off"
            className="min-w-0 flex-1 border-0 bg-transparent text-sm text-ink outline-0"
          />
        </div>
        <select value={estado} onChange={(e) => setFilters({ estado: e.target.value })} aria-label="Estado del reporte" className={selectClass}>
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS_REPORTE).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <FiltersResults>
        {reportes.length === 0 ? (
          <div className="grid min-h-[250px] place-items-center p-8 text-center text-muted">
            <div>
              <Icon name="search" size={28} className="mx-auto mb-3 text-brand-600" />
              <strong className="text-sm text-ink">No hay reportes</strong>
              <p className="mt-1 mb-3 text-[11px]">No encontramos reportes con esos filtros.</p>
              <ClearFiltersButton className="text-[11px] font-bold text-brand-700">Limpiar filtros</ClearFiltersButton>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="bg-[#fafbfa] text-left text-[9px] uppercase tracking-[0.08em] text-muted">
                  <th className="px-[18px] py-3">Establecimiento</th>
                  <th className="px-[18px] py-3">Reporte</th>
                  <th className="px-[18px] py-3">Reportante</th>
                  <th className="px-[18px] py-3">Estado</th>
                  <th className="px-[18px] py-3">Fecha</th>
                  <th className="px-[18px] py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reportes.map((r) => (
                  <tr key={r.id} className="border-t border-[#edf0ee] text-xs text-body">
                    <td className="max-w-[180px] px-[18px] py-3">
                      {r.establecimientos ? (
                        <Link href={`/admin/establecimientos/${r.establecimientos.id}`} className="block truncate font-bold text-ink hover:text-brand-700">{r.establecimientos.nombre}</Link>
                      ) : (
                        <span className="text-muted">Eliminado</span>
                      )}
                    </td>
                    <td className="max-w-[280px] px-[18px] py-3"><span className="line-clamp-2 leading-[1.5] text-body">{r.descripcion}</span></td>
                    <td className="px-[18px] py-3">
                      <div className="min-w-0">
                        <strong className="block truncate text-ink">{r.nombre_reportante ?? "Anónimo"}</strong>
                        {r.correo_reportante && <small className="block truncate text-[10px] text-muted">{r.correo_reportante}</small>}
                      </div>
                    </td>
                    <td className="px-[18px] py-3"><StatusBadge tone={estadoTone[r.estado as EstadoReporte] ?? "neutral"}>{ESTADOS_REPORTE[r.estado as EstadoReporte] ?? r.estado}</StatusBadge></td>
                    <td className="px-[18px] py-3">{formatFecha(r.created_at)}</td>
                    <td className="px-[18px] py-3">
                      <div className="flex justify-end">
                        <button type="button" onClick={() => setRevisionId(r.id)} className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-[11px] font-bold text-brand-700">
                          <Icon name="edit" size={14} />Revisar
                        </button>
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
        <span>{total} {total === 1 ? "reporte" : "reportes"}</span>
        {totalPaginas > 1 && (
          <nav aria-label="Paginación" className="flex gap-1.5">
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
              <FilterLink key={n} changes={{ pagina: n }} className="grid size-8 place-items-center rounded-lg border border-line bg-white text-body data-[active=true]:border-brand-700 data-[active=true]:bg-brand-700 data-[active=true]:text-white">{n}</FilterLink>
            ))}
          </nav>
        )}
      </div>

      <Modal open={seleccionado !== null} onClose={() => setRevisionId(null)} eyebrow="Reporte" title={seleccionado ? `Reporte de ${seleccionado.establecimientos?.nombre ?? "establecimiento"}` : ""}>
        {seleccionado && <RevisionForm key={seleccionado.id} reporte={seleccionado} onDone={() => setRevisionId(null)} />}
      </Modal>
    </section>
  );
}
