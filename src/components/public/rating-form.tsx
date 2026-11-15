"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { crearValoracion } from "@/features/valoraciones/actions";
import type { ValoracionState } from "@/features/valoraciones/schema";
import { cn } from "@/lib/utils/cn";

const initial: ValoracionState = { ok: false, message: "" };
const inputClass = "w-full rounded-[10px] border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-600 aria-[invalid=true]:border-[#d9675e]";
const LABELS = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];

export function RatingForm({ slug, nombre }: { slug: string; nombre: string }) {
  const [state, action, pending] = useActionState(crearValoracion, initial);
  const [value, setValue] = useState(0);
  const [hover, setHover] = useState(0);
  const toast = useToast();
  const handled = useRef(state);
  const errors = state.fieldErrors ?? {};
  const shown = hover || value;

  useEffect(() => {
    if (handled.current === state || !state.message) return;
    handled.current = state;
    if (state.ok) toast.success(state.message);
    else toast.error(state.message);
  }, [state, toast]);

  if (state.ok) {
    return (
      <p role="status" className="flex items-start gap-2.5 rounded-[10px] bg-brand-50 p-4 text-sm text-brand-800">
        <Icon name="check" size={18} className="mt-px shrink-0" />{state.message}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3.5" aria-busy={pending}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="puntuacion" value={value || ""} />
      <div className="hidden" aria-hidden><label>Sitio web<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <div>
        <span id="rating-label" className="block text-[13px] font-bold text-ink">¿Cómo calificas a {nombre}?</span>
        <div role="radiogroup" aria-labelledby="rating-label" className="mt-2 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}: ${LABELS[n]}`}
              onClick={() => setValue(n)}
              onMouseEnter={() => setHover(n)}
              onFocus={() => setHover(n)}
              onBlur={() => setHover(0)}
              className="rounded-md p-0.5 text-[#e0a526] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              <Icon name="star" size={30} className={cn("transition", n <= shown ? "fill-current" : "fill-none text-[#c9d2cd]")} />
            </button>
          ))}
          {shown > 0 && <span className="ml-2 text-xs font-bold text-body">{LABELS[shown]}</span>}
        </div>
        {errors.puntuacion && <span role="alert" className="mt-1 block text-xs text-[#b9574e]">{errors.puntuacion}</span>}
      </div>
      <label className="block text-[13px] font-bold text-ink">Comentario (opcional)
        <textarea name="comentario" maxLength={1000} rows={3} placeholder="Cuenta cómo fue tu experiencia…" className={`${inputClass} mt-1.5 font-normal`} aria-invalid={Boolean(errors.comentario)} />
        {errors.comentario && <span role="alert" className="mt-1 block text-xs font-normal text-[#b9574e]">{errors.comentario}</span>}
      </label>
      <label className="block text-[13px] font-bold text-ink">Tu nombre (opcional)
        <input name="nombre" maxLength={150} autoComplete="name" className={`${inputClass} mt-1.5 font-normal`} aria-invalid={Boolean(errors.nombre)} />
        {errors.nombre && <span role="alert" className="mt-1 block text-xs font-normal text-[#b9574e]">{errors.nombre}</span>}
      </label>
      <p className="text-[11px] text-muted">Las valoraciones se publican después de ser revisadas por un administrador.</p>
      <Button type="submit" icon="star" disabled={pending}>{pending ? "Enviando…" : "Enviar valoración"}</Button>
    </form>
  );
}
