"use client";

import { useState, useTransition } from "react";
import { Field, FormGrid, inputClass } from "@/components/admin/form";
import { StatusBadge } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { eliminarCategoria, guardarCategoria } from "@/features/categorias/admin-actions";
import { CATEGORY_ICONS, CATEGORY_TONES } from "@/features/categorias/constants";
import type { CategoriaResult } from "@/features/categorias/schema";

export type CategoriaAdmin = { id: number; nombre: string; descripcion: string | null; icono: string; tono: string; orden: number; activa: boolean; total: number };

const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function CategoriaForm({ categoria, onDone }: { categoria: CategoriaAdmin | null; onDone: () => void }) {
  const [result, setResult] = useState<CategoriaResult | null>(null);
  const [pending, startTransition] = useTransition();
  const errors = result?.fieldErrors ?? {};

  const save = (formData: FormData) =>
    startTransition(async () => {
      const res = await guardarCategoria(formData);
      if (res.ok) onDone();
      else setResult(res);
    });

  const remove = () => {
    if (!categoria || !confirm(`¿Eliminar la categoría “${categoria.nombre}”?`)) return;
    startTransition(async () => {
      const res = await eliminarCategoria(categoria.id);
      if (res.ok) onDone();
      else setResult(res);
    });
  };

  return (
    <form action={save} className="px-[25px] pt-6">
      {categoria && <input type="hidden" name="id" value={categoria.id} />}
      <FormGrid>
        <Field label="Nombre de la categoría" wide error={errors.nombre}>
          <input name="nombre" defaultValue={categoria?.nombre} required maxLength={120} placeholder="Ej. Restaurantes" className={inputClass} aria-invalid={Boolean(errors.nombre)} />
        </Field>
        <Field label="Descripción" wide error={errors.descripcion}>
          <textarea name="descripcion" defaultValue={categoria?.descripcion ?? ""} rows={3} maxLength={500} placeholder="Describe el tipo de establecimientos que agrupa." className={inputClass} />
        </Field>
        <Field label="Icono" error={errors.icono}>
          <select name="icono" defaultValue={categoria?.icono ?? "building"} className={inputClass}>
            {CATEGORY_ICONS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
          </select>
        </Field>
        <Field label="Color" error={errors.tono}>
          <select name="tono" defaultValue={categoria?.tono ?? "green"} className={inputClass}>
            {CATEGORY_TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="Orden de visualización" error={errors.orden} hint="Las categorías con número menor aparecen primero.">
          <input name="orden" type="number" min={0} max={999} defaultValue={categoria?.orden ?? 0} className={inputClass} aria-invalid={Boolean(errors.orden)} />
        </Field>
        <label className="flex items-center gap-2.5 self-end pb-2.5 text-xs text-body">
          <input name="activa" type="checkbox" defaultChecked={categoria?.activa ?? true} className="size-4 accent-brand-700" />
          Categoría activa (visible en el sitio)
        </label>
      </FormGrid>
      {result && !result.ok && <p role="alert" className="mt-4 rounded-lg bg-[#fceceb] px-3 py-2.5 text-xs text-[#a34d47]">{result.message}</p>}
      <footer className="sticky bottom-0 -mx-[25px] mt-6 flex items-center gap-[9px] border-t border-line bg-white px-[25px] py-[17px]">
        {categoria && <button type="button" onClick={remove} disabled={pending} className="mr-auto flex items-center gap-1.5 text-xs font-bold text-[#b9574e] disabled:opacity-50"><Icon name="trash" size={15} />Eliminar</button>}
        <Button variant="secondary" icon="x" onClick={onDone} className={categoria ? "" : "ml-auto"}>Cancelar</Button>
        <Button type="submit" icon={categoria ? "save" : "plus"} disabled={pending}>{pending ? "Guardando…" : categoria ? "Guardar cambios" : "Crear categoría"}</Button>
      </footer>
    </form>
  );
}

export function CategoriasManager({ categorias }: { categorias: CategoriaAdmin[] }) {
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<{ open: boolean; categoria: CategoriaAdmin | null }>({ open: false, categoria: null });
  const close = () => setModal((m) => ({ ...m, open: false }));
  const q = normalize(query.trim());
  const visibles = categorias.filter((c) => !q || normalize(`${c.nombre} ${c.descripcion ?? ""}`).includes(q));

  return (
    <section className="overflow-hidden rounded-[14px] border border-line bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-line px-[25px] py-[23px]">
        <div>
          <h2 className="flex items-center gap-2 text-lg"><Icon name="grid" size={20} className="text-brand-700" />Gestión de categorías</h2>
          <p className="mt-[5px] text-[11px] text-muted">Consulta y administra las categorías que clasifican los establecimientos.</p>
        </div>
        <Button icon="plus" iconOnlyOnMobile onClick={() => setModal({ open: true, categoria: null })}>Registrar categoría</Button>
      </div>
      <div className="mx-[25px] mt-5 mb-2 flex h-11 items-center gap-[9px] rounded-[9px] border border-line pl-[13px] text-muted focus-within:border-brand-500">
        <Icon name="search" size={18} />
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && e.preventDefault()} placeholder="Buscar categorías…" aria-label="Buscar categorías" className="min-w-0 flex-1 border-0 bg-transparent text-sm text-ink outline-0" />
      </div>
      <div className="px-[25px] pt-3 pb-[25px]">
        {visibles.map((c) => (
          <article key={c.id} className="grid min-h-[70px] grid-cols-[42px_1fr_auto] items-center gap-[13px] border-b border-[#edf0ee] px-[5px] py-3">
            <span className="grid size-10 place-items-center rounded-[10px] bg-brand-50 text-brand-700"><Icon name={c.icono as IconName} /></span>
            <div className="flex min-w-0 flex-col gap-1">
              <strong className="text-xs">{c.nombre}</strong>
              <small className="text-[10px] text-muted">{c.total} {c.total === 1 ? "establecimiento" : "establecimientos"} · Orden {c.orden}</small>
              <StatusBadge tone={c.activa ? "success" : "neutral"}>{c.activa ? "Activa" : "Inactiva"}</StatusBadge>
            </div>
            <button type="button" onClick={() => setModal({ open: true, categoria: c })} className="flex h-[34px] items-center gap-1.5 rounded-lg border border-line bg-white px-[11px] text-[11px] font-bold text-brand-700">
              <Icon name="edit" size={15} />Editar
            </button>
          </article>
        ))}
        {visibles.length === 0 && (
          <div className="grid min-h-[200px] place-items-center text-center text-muted">
            <div><Icon name="search" size={28} className="mx-auto mb-3 text-brand-600" /><strong className="text-sm text-ink">No hay resultados</strong><p className="mt-1 text-[11px]">{query ? `No encontramos categorías que coincidan con “${query}”.` : "Aún no hay categorías registradas."}</p></div>
          </div>
        )}
      </div>
      <Modal open={modal.open} onClose={close} eyebrow={modal.categoria ? "Editar categoría" : "Nueva categoría"} title={modal.categoria?.nombre ?? "Registrar categoría"}>
        <CategoriaForm key={modal.categoria?.id ?? "nueva"} categoria={modal.categoria} onDone={close} />
      </Modal>
    </section>
  );
}
