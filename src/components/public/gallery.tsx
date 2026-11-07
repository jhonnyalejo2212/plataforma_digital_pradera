"use client";

import Image from "next/image";
import { useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "@/components/ui/icon";
import type { Imagen } from "@/features/establecimientos/types";
import { cn } from "@/lib/utils/cn";

/** Cuadrícula de fotos de la ficha con lightbox accesible (diálogo nativo, flechas y miniaturas). */
export function Gallery({ imagenes, nombre }: { imagenes: Imagen[]; nombre: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const total = imagenes.length;

  const show = (i: number) => {
    setIndex(i);
    setOpen(true);
    dialog.current?.showModal();
  };
  const step = (d: number) => setIndex((i) => (i + d + total) % total);
  const onKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
  };

  const [main, second, third] = imagenes;
  if (!main) return null;
  const current = imagenes[index] ?? main;

  const cell = (img: Imagen, n: number, className?: string) => (
    <button type="button" key={n} onClick={() => show(n)} aria-label={`Ampliar foto ${n + 1} de ${total}`} className={cn("group relative overflow-hidden bg-brand-50", className)}>
      <Image src={img.url} alt={img.texto_alternativo ?? nombre} fill sizes="(min-width: 768px) 780px, 100vw" className="object-cover transition duration-300 group-hover:scale-[1.03]" priority={n === 0} />
    </button>
  );

  const arrowBtn = (dir: -1 | 1) => (
    <button
      type="button"
      onClick={() => step(dir)}
      aria-label={dir === -1 ? "Foto anterior" : "Foto siguiente"}
      className="absolute top-1/2 z-[2] grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25"
      style={dir === -1 ? { left: 14 } : { right: 14 }}
    >
      <Icon name="chevron" size={22} className={dir === -1 ? "rotate-180" : undefined} />
    </button>
  );

  return (
    <section className="container-page">
      <div className={cn("relative grid h-[290px] gap-2.5 overflow-hidden rounded-card md:h-[415px]", second && "md:grid-cols-[2fr_1fr] md:grid-rows-2")}>
        {cell(main, 0, second ? "md:row-span-2" : undefined)}
        {second && cell(second, 1, "max-md:hidden")}
        {third && cell(third, 2, "max-md:hidden")}
        {total > 1 && (
          <button type="button" onClick={() => show(0)} className="absolute right-4 bottom-4 flex items-center gap-2 rounded-lg bg-white/95 px-3.5 py-2.5 text-xs font-bold text-ink shadow-md transition hover:bg-white">
            <Icon name="image" size={17} /> Ver todas las fotos ({total})
          </button>
        )}
      </div>

      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        onKeyDown={onKeyDown}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        aria-label={`Galería de fotos de ${nombre}`}
        className="m-auto h-dvh w-dvw max-w-none max-h-none bg-transparent p-0 backdrop:bg-[rgba(5,14,10,0.94)]"
      >
        {open && (
          <div className="flex h-full flex-col text-white">
            <header className="flex items-center justify-between px-6 pt-5">
              <span className="text-xs tracking-[0.15em] text-white/80">{index + 1} / {total}</span>
              <button type="button" onClick={() => dialog.current?.close()} aria-label="Cerrar galería" className="grid size-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/25">
                <Icon name="x" size={20} />
              </button>
            </header>
            <div className="relative mx-auto flex min-h-0 w-full max-w-5xl flex-1 items-center px-16">
              {total > 1 && arrowBtn(-1)}
              <div className="relative h-full w-full">
                <Image src={current.url} alt={current.texto_alternativo ?? nombre} fill sizes="100vw" className="object-contain" priority />
              </div>
              {total > 1 && arrowBtn(1)}
            </div>
            {total > 1 && (
              <nav aria-label="Miniaturas" className="mx-auto flex max-w-full gap-2 overflow-x-auto px-6 pt-2 pb-6">
                {imagenes.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Ver foto ${i + 1}`}
                    aria-current={i === index}
                    className={cn("relative h-16 w-24 shrink-0 overflow-hidden rounded-lg opacity-50 transition", i === index && "opacity-100 ring-2 ring-white")}
                  >
                    <Image src={img.url} alt="" fill sizes="96px" className="object-cover" />
                  </button>
                ))}
              </nav>
            )}
          </div>
        )}
      </dialog>
    </section>
  );
}
