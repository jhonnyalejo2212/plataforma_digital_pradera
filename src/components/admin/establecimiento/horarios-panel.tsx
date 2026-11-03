"use client";

import { useState, useTransition } from "react";
import { PanelCard, SaveBar, smallInput } from "@/components/admin/establecimiento/shared";
import { Button } from "@/components/ui/button";
import { guardarHorarios } from "@/features/establecimientos/detail-actions";
import type { ActionResult } from "@/features/establecimientos/detail-schemas";
import type { Horario } from "@/features/establecimientos/types";
import { DIAS } from "@/lib/utils/format";

type Row = { dia: number; cerrado: boolean; apertura: string; cierre: string; observacion: string };

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : "");

export function HorariosPanel({ establecimientoId, horarios }: { establecimientoId: number; horarios: Horario[] }) {
  const [rows, setRows] = useState<Row[]>(() =>
    DIAS.map((_, i) => {
      const h = horarios.find((x) => x.dia_semana === i + 1);
      return { dia: i + 1, cerrado: h?.cerrado ?? false, apertura: hhmm(h?.hora_apertura ?? null), cierre: hhmm(h?.hora_cierre ?? null), observacion: h?.observacion ?? "" };
    }),
  );
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const errors = result?.fieldErrors ?? {};

  const update = (i: number, patch: Partial<Row>) => {
    setRows((r) => r.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
    setResult(null);
  };
  const applyFirstToAll = () => {
    const first = rows[0];
    setRows((r) => r.map((x, i) => (i === 0 ? x : { ...x, cerrado: first.cerrado, apertura: first.apertura, cierre: first.cierre })));
    setResult(null);
  };
  const save = () => startTransition(async () => setResult(await guardarHorarios(establecimientoId, rows)));

  return (
    <PanelCard
      icon="clock"
      title="Horarios de atención"
      description="Define la hora de apertura y cierre de cada día, o márcalo como cerrado."
      action={<Button variant="secondary" icon="copy" onClick={applyFirstToAll}>Copiar lunes a todos los días</Button>}
    >
      <div className="overflow-hidden rounded-[10px] border border-line">
        {rows.map((r, i) => (
          <div key={r.dia} className="grid min-h-[53px] grid-cols-[72px_1fr_10px_1fr] items-center gap-2 border-b border-[#edf0ee] px-3 py-2 last:border-b-0 md:grid-cols-[110px_1fr_14px_1fr_90px]">
            <strong className="text-xs">{DIAS[i]}</strong>
            <input type="time" value={r.apertura} disabled={r.cerrado} onChange={(e) => update(i, { apertura: e.target.value })} aria-label={`${DIAS[i]}: apertura`} aria-invalid={Boolean(errors[`${i}.apertura`])} className={smallInput} />
            <span className="text-center text-[11px] text-muted">a</span>
            <input type="time" value={r.cierre} disabled={r.cerrado} onChange={(e) => update(i, { cierre: e.target.value })} aria-label={`${DIAS[i]}: cierre`} aria-invalid={Boolean(errors[`${i}.cierre`])} className={smallInput} />
            <label className="col-span-full flex items-center gap-1.5 text-[11px] text-body max-md:col-start-2 md:col-span-1">
              <input type="checkbox" checked={r.cerrado} onChange={(e) => update(i, { cerrado: e.target.checked })} className="size-4 accent-brand-700" /> Cerrado
            </label>
            {(errors[`${i}.apertura`] || errors[`${i}.cierre`]) && <small role="alert" className="col-span-full text-[11px] text-[#b9574e] max-md:col-start-2">{errors[`${i}.apertura`] ?? errors[`${i}.cierre`]}</small>}
          </div>
        ))}
      </div>
      <SaveBar pending={pending} result={result} onSave={save} label="Guardar horarios" />
    </PanelCard>
  );
}
