"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { crearReporte } from "@/features/reportes/actions";
import type { ReporteState } from "@/features/reportes/schema";

const initial: ReporteState = { ok: false, message: "" };
const inputClass = "w-full rounded-[10px] border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-600";

export function ReportDialog({ slug, nombre }: { slug: string; nombre: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(crearReporte, initial);
  const errors = state.fieldErrors ?? {};
  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} className="flex items-center justify-center gap-[7px] text-[11px] text-muted hover:text-ink">
        <Icon name="flag" size={16} /> Reportar información incorrecta
      </button>
      <dialog ref={dialog} className="m-auto w-[min(520px,calc(100%-24px))] rounded-2xl p-0 backdrop:bg-black/50" onClick={(e) => e.target === dialog.current && dialog.current.close()}>
        <div className="p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl">Reportar información</h2>
              <p className="mt-1 text-sm text-body">{nombre}</p>
            </div>
            <button type="button" aria-label="Cerrar" onClick={() => dialog.current?.close()} className="text-muted"><Icon name="x" /></button>
          </div>
          {state.ok ? (
            <div className="space-y-4">
              <p className="rounded-[10px] bg-brand-50 p-3 text-sm text-brand-800" role="status">{state.message}</p>
              <Button icon="check" onClick={() => dialog.current?.close()} className="w-full">Cerrar</Button>
            </div>
          ) : (
            <form action={action} className="space-y-3.5">
              <input type="hidden" name="slug" value={slug} />
              <div className="hidden" aria-hidden><label>Sitio web<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
              <label className="block text-[13px] font-bold text-ink">¿Qué información es incorrecta o está desactualizada?
                <textarea name="descripcion" required minLength={10} maxLength={2000} rows={4} className={`${inputClass} mt-1.5 font-normal`} aria-invalid={Boolean(errors.descripcion)} />
                {errors.descripcion && <span className="mt-1 block text-xs font-normal text-[#b9574e]">{errors.descripcion}</span>}
              </label>
              <label className="block text-[13px] font-bold text-ink">Tu nombre (opcional)
                <input name="nombre" maxLength={150} className={`${inputClass} mt-1.5 font-normal`} />
              </label>
              <label className="block text-[13px] font-bold text-ink">Tu correo (opcional)
                <input name="correo" type="email" maxLength={255} className={`${inputClass} mt-1.5 font-normal`} aria-invalid={Boolean(errors.correo)} />
                {errors.correo && <span className="mt-1 block text-xs font-normal text-[#b9574e]">{errors.correo}</span>}
              </label>
              <p className="text-[11px] text-muted">Tu nombre y correo solo se usan para que un administrador pueda contactarte sobre este reporte.</p>
              {state.message && <p className="text-sm text-[#b9574e]" role="alert">{state.message}</p>}
              <div className="flex justify-end gap-2.5">
                <Button variant="secondary" icon="x" onClick={() => dialog.current?.close()}>Cancelar</Button>
                <Button type="submit" icon="flag" disabled={pending}>{pending ? "Enviando…" : "Enviar reporte"}</Button>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
