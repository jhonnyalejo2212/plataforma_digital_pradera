"use client";

import { useActionState, useEffect, useTransition } from "react";
import { Field, FormGrid, inputClass } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { useConfirm, useToast } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { guardarEstablecimiento } from "@/features/establecimientos/admin-actions";
import { ESTADOS_PUBLICACION } from "@/features/establecimientos/labels";
import type { EstablecimientoFormState } from "@/features/establecimientos/schema";

export type EstablecimientoInitial = {
  id?: number;
  nombre: string;
  categoria_id: number | "";
  estado_publicacion: keyof typeof ESTADOS_PUBLICACION;
  administrador_id: number | "";
  descripcion: string;
  direccion: string;
  barrio: string;
  latitud: string;
  longitud: string;
  slug?: string;
};

const initialState: EstablecimientoFormState = { ok: false, message: "" };

export function EstablecimientoForm({ initial, categorias, administradores, creado }: {
  initial: EstablecimientoInitial;
  categorias: { id: number; nombre: string }[];
  administradores: { id: number; nombre: string }[];
  creado?: boolean;
}) {
  const toast = useToast();
  const [state, action, pending] = useActionState(async (prev: EstablecimientoFormState, formData: FormData) => {
    const res = await guardarEstablecimiento(prev, formData);
    if (res.ok) toast.success(res.message);
    else toast.error(res.message, "No se pudo guardar");
    return res;
  }, initialState);
  useEffect(() => {
    if (!creado) return;
    toast.success("El establecimiento se creó. Ahora puedes agregar fotos, horarios, contactos y oferta.", "Establecimiento creado");
    window.history.replaceState(null, "", window.location.pathname);
  }, [creado, toast]);
  const e = state.fieldErrors ?? {};
  const invalid = (k: string) => Boolean(e[k]);
  return (
    <form action={action} className="rounded-[14px] border border-line bg-white p-[18px] md:p-7">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <FormGrid>
        <Field label="Nombre del establecimiento" wide error={e.nombre}>
          <input name="nombre" defaultValue={initial.nombre} required maxLength={180} className={inputClass} aria-invalid={invalid("nombre")} />
        </Field>
        <Field label="Categoría" error={e.categoria_id}>
          <select name="categoria_id" defaultValue={initial.categoria_id} required className={inputClass} aria-invalid={invalid("categoria_id")}>
            <option value="" disabled>Selecciona…</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </Field>
        <Field label="Estado de publicación" error={e.estado_publicacion} hint="Solo los publicados se ven en el sitio público.">
          <select name="estado_publicacion" defaultValue={initial.estado_publicacion} className={inputClass}>
            {Object.entries(ESTADOS_PUBLICACION).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Descripción" wide error={e.descripcion}>
          <textarea name="descripcion" defaultValue={initial.descripcion} rows={4} maxLength={5000} className={inputClass} aria-invalid={invalid("descripcion")} />
        </Field>
        <Field label="Dirección" error={e.direccion}>
          <input name="direccion" defaultValue={initial.direccion} maxLength={255} className={inputClass} />
        </Field>
        <Field label="Barrio o zona" error={e.barrio}>
          <input name="barrio" defaultValue={initial.barrio} maxLength={120} className={inputClass} />
        </Field>
        <Field label="Latitud" error={e.latitud} hint="Ej. 3.4192000. Se obtiene con clic derecho en Google Maps.">
          <input name="latitud" defaultValue={initial.latitud} inputMode="decimal" className={inputClass} aria-invalid={invalid("latitud")} />
        </Field>
        <Field label="Longitud" error={e.longitud} hint="Ej. -76.2431000">
          <input name="longitud" defaultValue={initial.longitud} inputMode="decimal" className={inputClass} aria-invalid={invalid("longitud")} />
        </Field>
        <Field label="Administrador responsable" wide>
          <select name="administrador_id" defaultValue={initial.administrador_id} className={inputClass}>
            <option value="">Sin asignar</option>
            {administradores.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </Field>
        {initial.slug && (
          <Field label="Dirección web (no editable)" wide>
            <input value={`/directorio/${initial.slug}`} readOnly className={`${inputClass} bg-[#f4f6f4] font-mono text-muted`} />
          </Field>
        )}
      </FormGrid>
      <div className="mt-7 flex flex-wrap items-center justify-end gap-[9px] border-t border-line pt-[18px]">
        {state.message && !state.ok && <span role="alert" className="mr-auto flex items-center gap-1.5 text-xs text-[#b9574e]"><Icon name="warning" size={15} />{state.message}</span>}
        <Button href="/admin/establecimientos" variant="secondary" icon="back">Volver al listado</Button>
        <Button type="submit" icon={initial.id ? "save" : "plus"} disabled={pending}>{pending ? "Guardando…" : initial.id ? "Guardar cambios" : "Crear establecimiento"}</Button>
      </div>
    </form>
  );
}

export function DeleteEstablecimientoForm({ id, nombre, action }: { id: number; nombre: string; action: (formData: FormData) => void | Promise<void> }) {
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const onClick = async () => {
    const ok = await confirm({
      title: `¿Eliminar “${nombre}”?`,
      description: "Dejará de verse en el sitio público. Podrás recuperarlo solo desde la base de datos.",
      confirmLabel: "Sí, eliminar",
      tone: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", String(id));
      await action(fd);
    });
  };
  return (
    <button type="button" onClick={onClick} disabled={pending} className="flex items-center gap-1.5 rounded-lg border border-[#e8bcb7] px-3.5 py-2 text-xs font-bold text-[#b9574e] hover:bg-[#fceceb] disabled:opacity-50">
      <Icon name="trash" size={15} />{pending ? "Eliminando…" : "Eliminar establecimiento"}
    </button>
  );
}

