"use client";

import { useState, useTransition } from "react";
import { EmptyHint, iconButton, PanelCard, SaveBar, smallInput } from "@/components/admin/establecimiento/shared";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/feedback";
import { Icon, type IconName } from "@/components/ui/icon";
import { guardarContactos } from "@/features/establecimientos/detail-actions";
import { TIPOS_CONTACTO } from "@/features/establecimientos/detail-constants";
import type { ActionResult } from "@/features/establecimientos/detail-schemas";
import { cn } from "@/lib/utils/cn";

export type ContactoAdmin = { id: number; tipo: string; valor: string; etiqueta: string | null };
type Row = { key: string; id?: number; tipo: string; valor: string; etiqueta: string };

const ICONOS: Record<string, IconName> = { telefono: "phone", whatsapp: "whatsapp", correo: "mail", instagram: "instagram", facebook: "facebook", sitio_web: "globe" };

export function ContactosPanel({ establecimientoId, contactos }: { establecimientoId: number; contactos: ContactoAdmin[] }) {
  const fromDb = (list: ContactoAdmin[]): Row[] => list.map((c) => ({ key: `db-${c.id}`, id: c.id, tipo: c.tipo, valor: c.valor, etiqueta: c.etiqueta ?? "" }));
  const [rows, setRows] = useState<Row[]>(() => fromDb(contactos));
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const errors = result?.fieldErrors ?? {};

  const update = (key: string, patch: Partial<Row>) => {
    setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));
    setResult(null);
  };
  const save = () =>
    startTransition(async () => {
      const res = await guardarContactos(establecimientoId, rows.map((r) => ({ id: r.id, tipo: r.tipo, valor: r.valor, etiqueta: r.etiqueta })));
      if (res.ok && res.data) setRows(fromDb(res.data));
      if (res.ok) {
        toast.success(res.message);
        setResult(null);
      } else {
        toast.error(res.message, "Revisa los contactos");
        setResult(res);
      }
    });

  return (
    <PanelCard
      icon="phone"
      title="Medios de contacto"
      description="Teléfonos, WhatsApp, correo y redes sociales que verán los visitantes."
      action={<Button variant="secondary" icon="plus" onClick={() => setRows((r) => [...r, { key: crypto.randomUUID(), tipo: "telefono", valor: "", etiqueta: "" }])}>Agregar contacto</Button>}
    >
      {rows.length === 0 ? (
        <EmptyHint icon="phone" title="Sin medios de contacto" text="Agrega al menos un teléfono o WhatsApp para que te encuentren." />
      ) : (
        <div className="space-y-3">
          {rows.map((r, i) => {
            const tipo = TIPOS_CONTACTO.find((t) => t.value === r.tipo);
            return (
              <div key={r.key} className="grid gap-2.5 rounded-xl border border-line bg-[#fafbfa] p-3 md:grid-cols-[190px_1fr_190px_auto] md:items-start">
                <div className="relative">
                  <Icon name={ICONOS[r.tipo] ?? "link"} size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-brand-700" />
                  <select value={r.tipo} onChange={(e) => update(r.key, { tipo: e.target.value })} aria-label="Tipo de contacto" className={cn(smallInput, "pl-9")}>
                    {TIPOS_CONTACTO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <input value={r.valor} onChange={(e) => update(r.key, { valor: e.target.value })} placeholder={tipo?.placeholder} maxLength={300} aria-label="Valor del contacto" aria-invalid={Boolean(errors[`${i}.valor`])} className={smallInput} />
                  {errors[`${i}.valor`] && <small role="alert" className="mt-1 block text-[11px] text-[#b9574e]">{errors[`${i}.valor`]}</small>}
                </div>
                <input value={r.etiqueta} onChange={(e) => update(r.key, { etiqueta: e.target.value })} placeholder="Etiqueta (opcional)" maxLength={100} aria-label="Etiqueta" className={smallInput} />
                <button type="button" title="Quitar" aria-label="Quitar contacto" onClick={() => { setRows((x) => x.filter((c) => c.key !== r.key)); setResult(null); }} className={cn(iconButton, "text-[#b9574e] max-md:ml-auto")}><Icon name="trash" size={16} /></button>
              </div>
            );
          })}
        </div>
      )}
      <SaveBar pending={pending} result={result} onSave={save} label="Guardar contactos" />
    </PanelCard>
  );
}
