"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "./icon";

/** Diálogo modal accesible (elemento nativo <dialog>): cierra con Esc o clic fuera. */
export function Modal({ open, onClose, title, eyebrow, children }: { open: boolean; onClose: () => void; title: string; eyebrow?: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="modal-title"
      className="m-auto max-h-[92vh] w-[min(680px,calc(100%-24px))] overflow-y-auto rounded-2xl p-0 shadow-[0_24px_80px_rgba(5,20,13,0.28)] backdrop:bg-[rgba(10,28,20,0.58)] backdrop:backdrop-blur-[4px]"
    >
      {open && (
        <>
          <header className="sticky top-0 z-[2] flex items-start justify-between border-b border-line bg-white px-[25px] py-[22px]">
            <div>
              {eyebrow && <span className="block text-[11px] font-extrabold uppercase tracking-[0.15em] text-brand-600">{eyebrow}</span>}
              <h2 id="modal-title" className="text-xl">{title}</h2>
            </div>
            <button type="button" onClick={onClose} aria-label="Cerrar" className="grid size-[35px] place-items-center rounded-lg border border-line bg-white text-muted"><Icon name="x" /></button>
          </header>
          {children}
        </>
      )}
    </dialog>
  );
}
