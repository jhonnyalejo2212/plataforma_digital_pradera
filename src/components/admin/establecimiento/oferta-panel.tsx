"use client";

import { useState, useTransition } from "react";
import { EmptyHint, iconButton, PanelCard, SaveBar, smallInput } from "@/components/admin/establecimiento/shared";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { guardarProductos } from "@/features/establecimientos/detail-actions";
import type { ActionResult } from "@/features/establecimientos/detail-schemas";
import { cn } from "@/lib/utils/cn";

export type ProductoAdmin = { id: number; nombre: string; descripcion: string | null; tipo: string; precio: number | null; disponible: boolean };
type Row = { key: string; id?: number; nombre: string; tipo: "producto" | "servicio"; descripcion: string; precio: string; disponible: boolean };

export function OfertaPanel({ establecimientoId, productos }: { establecimientoId: number; productos: ProductoAdmin[] }) {
  const fromDb = (list: ProductoAdmin[]): Row[] =>
    list.map((p) => ({ key: `db-${p.id}`, id: p.id, nombre: p.nombre, tipo: p.tipo === "servicio" ? "servicio" : "producto", descripcion: p.descripcion ?? "", precio: p.precio === null ? "" : String(p.precio), disponible: p.disponible }));
  const [rows, setRows] = useState<Row[]>(() => fromDb(productos));
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const errors = result?.fieldErrors ?? {};

  const update = (key: string, patch: Partial<Row>) => {
    setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));
    setResult(null);
  };
  const save = () =>
    startTransition(async () => {
      const res = await guardarProductos(establecimientoId, rows.map((r) => ({ id: r.id, nombre: r.nombre, tipo: r.tipo, descripcion: r.descripcion, precio: r.precio, disponible: r.disponible })));
      if (res.ok && res.data) setRows(fromDb(res.data));
      setResult(res);
    });

  return (
    <PanelCard
      icon="tag"
      title="Productos y servicios"
      description="Lo que ofrece el establecimiento. Los no disponibles se muestran tachados."
      action={<Button variant="secondary" icon="plus" onClick={() => setRows((r) => [...r, { key: crypto.randomUUID(), nombre: "", tipo: "producto", descripcion: "", precio: "", disponible: true }])}>Agregar elemento</Button>}
    >
      {rows.length === 0 ? (
        <EmptyHint icon="tag" title="Sin productos ni servicios" text="Agrega lo que ofrece el negocio: menú, servicios, productos destacados…" />
      ) : (
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={r.key} className="grid gap-2.5 rounded-xl border border-line bg-[#fafbfa] p-3 md:grid-cols-[1fr_150px_150px_auto] md:items-start">
              <div>
                <input value={r.nombre} onChange={(e) => update(r.key, { nombre: e.target.value })} placeholder="Nombre del producto o servicio" maxLength={180} aria-label="Nombre" aria-invalid={Boolean(errors[`${i}.nombre`])} className={smallInput} />
                {errors[`${i}.nombre`] && <small role="alert" className="mt-1 block text-[11px] text-[#b9574e]">{errors[`${i}.nombre`]}</small>}
              </div>
              <select value={r.tipo} onChange={(e) => update(r.key, { tipo: e.target.value as Row["tipo"] })} aria-label="Tipo" className={smallInput}>
                <option value="producto">Producto</option>
                <option value="servicio">Servicio</option>
              </select>
              <div>
                <input value={r.precio} onChange={(e) => update(r.key, { precio: e.target.value })} inputMode="decimal" placeholder="Precio (opcional)" aria-label="Precio" aria-invalid={Boolean(errors[`${i}.precio`])} className={smallInput} />
                {errors[`${i}.precio`] && <small role="alert" className="mt-1 block text-[11px] text-[#b9574e]">{errors[`${i}.precio`]}</small>}
              </div>
              <button type="button" title="Quitar" aria-label="Quitar elemento" onClick={() => { setRows((x) => x.filter((c) => c.key !== r.key)); setResult(null); }} className={cn(iconButton, "text-[#b9574e] max-md:ml-auto")}><Icon name="trash" size={16} /></button>
              <textarea value={r.descripcion} onChange={(e) => update(r.key, { descripcion: e.target.value })} rows={2} maxLength={500} placeholder="Descripción (opcional)" aria-label="Descripción" className={cn(smallInput, "md:col-span-3")} />
              <label className="flex items-center gap-2 self-center text-[11px] text-body md:col-start-4">
                <input type="checkbox" checked={r.disponible} onChange={(e) => update(r.key, { disponible: e.target.checked })} className="size-4 accent-brand-700" /> Disponible
              </label>
            </div>
          ))}
        </div>
      )}
      <SaveBar pending={pending} result={result} onSave={save} label="Guardar oferta" />
    </PanelCard>
  );
}
