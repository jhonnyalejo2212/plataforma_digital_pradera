"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils/cn";

/* ----------------------------------------------------------------- Mensajes */

type ToastType = "success" | "error" | "info";
type ToastItem = { id: number; type: ToastType; title: string; message: string };

const TOAST_STYLES: Record<ToastType, { icon: IconName; circle: string; bar: string; title: string }> = {
  success: { icon: "check", circle: "bg-brand-100 text-brand-700", bar: "bg-brand-500", title: "Listo" },
  error: { icon: "warning", circle: "bg-[#fceceb] text-[#c4544a]", bar: "bg-[#d9675e]", title: "Algo salió mal" },
  info: { icon: "info", circle: "bg-[#e6f2f8] text-[#347498]", bar: "bg-[#4a9bc4]", title: "Información" },
};
const DURATION: Record<ToastType, number> = { success: 4500, info: 5000, error: 8000 };

export type ToastApi = Record<ToastType, (message: string, title?: string) => void>;

/* ------------------------------------------------------------ Confirmación */

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  icon?: IconName;
};
type ConfirmState = { options: ConfirmOptions; resolve: (value: boolean) => void } | null;

/* Almacén fuera de React: permite lanzar mensajes y confirmaciones desde cualquier código del cliente. */
let toastList: ToastItem[] = [];
let confirmState: ConfirmState = null;
let nextId = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

function dismiss(id: number) {
  toastList = toastList.filter((t) => t.id !== id);
  emit();
}

const push = (type: ToastType) => (message: string, title?: string) => {
  const id = ++nextId;
  toastList = [...toastList.slice(-3), { id, type, title: title ?? TOAST_STYLES[type].title, message }];
  emit();
  setTimeout(() => dismiss(id), DURATION[type]);
};

const toastApi: ToastApi = { success: push("success"), error: push("error"), info: push("info") };

function askConfirm(options: ConfirmOptions) {
  return new Promise<boolean>((resolve) => {
    confirmState?.resolve(false);
    confirmState = { options, resolve };
    emit();
  });
}

function answerConfirm(value: boolean) {
  confirmState?.resolve(value);
  confirmState = null;
  emit();
}

const EMPTY_TOASTS: ToastItem[] = [];

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: (id: number) => void }) {
  const s = TOAST_STYLES[toast.type];
  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      className="pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border border-line bg-white p-3.5 pr-10 shadow-card [animation:toast-in_0.25s_ease-out]"
    >
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-[10px]", s.circle)}><Icon name={s.icon} size={19} /></span>
      <div className="min-w-0 pt-px">
        <strong className="block text-[13px] text-ink">{toast.title}</strong>
        <p className="mt-0.5 text-xs leading-[1.5] text-body">{toast.message}</p>
      </div>
      <button type="button" onClick={() => onClose(toast.id)} aria-label="Cerrar mensaje" className="absolute top-2.5 right-2.5 grid size-6 place-items-center rounded-md text-muted hover:bg-[#f4f6f4] hover:text-ink"><Icon name="x" size={15} /></button>
      <span className={cn("absolute bottom-0 left-0 h-[3px] w-full origin-left", s.bar)} style={{ animation: `toast-progress ${DURATION[toast.type]}ms linear forwards` }} />
    </div>
  );
}

function ConfirmDialog({ state, onAnswer }: { state: ConfirmState; onAnswer: (value: boolean) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = Boolean(state);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const o = state?.options;
  const danger = (o?.tone ?? "default") === "danger";
  return (
    <dialog
      ref={ref}
      onCancel={(e) => { e.preventDefault(); onAnswer(false); }}
      onClick={(e) => e.target === ref.current && onAnswer(false)}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
      className="m-auto w-[min(420px,calc(100%-24px))] rounded-2xl p-0 shadow-[0_24px_80px_rgba(5,20,13,0.28)] backdrop:bg-[rgba(10,28,20,0.58)] backdrop:backdrop-blur-[4px]"
    >
      {o && (
        <div className="p-6 text-center">
          <span className={cn("mx-auto mb-4 grid size-14 place-items-center rounded-2xl", danger ? "bg-[#fceceb] text-[#c4544a]" : "bg-brand-100 text-brand-700")}>
            <Icon name={o.icon ?? (danger ? "trash" : "info")} size={28} />
          </span>
          <h2 id="confirm-title" className="text-xl">{o.title}</h2>
          {o.description && <p id="confirm-desc" className="mt-2 text-sm leading-[1.6] text-body">{o.description}</p>}
          <div className="mt-6 grid grid-cols-2 gap-2.5">
            <button type="button" autoFocus onClick={() => onAnswer(false)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-line bg-white px-5 text-sm font-bold text-brand-800 transition hover:shadow-soft">
              <Icon name="x" size={18} />{o.cancelLabel ?? "Cancelar"}
            </button>
            <Button variant={danger ? "danger" : "primary"} icon={danger ? "trash" : "check"} onClick={() => onAnswer(true)}>{o.confirmLabel ?? "Confirmar"}</Button>
          </div>
        </div>
      )}
    </dialog>
  );
}

/** Monta una sola vez (en el layout raíz) la zona de mensajes y el diálogo de confirmación. */
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const toasts = useSyncExternalStore(subscribe, () => toastList, () => EMPTY_TOASTS);
  const confirmation = useSyncExternalStore(subscribe, () => confirmState, () => null);
  return (
    <>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 left-4 z-[200] flex flex-col items-end gap-2.5 sm:left-auto sm:w-[380px]">
        {toasts.map((t) => <ToastCard key={t.id} toast={t} onClose={dismiss} />)}
      </div>
      <ConfirmDialog state={confirmation} onAnswer={answerConfirm} />
    </>
  );
}

/** Mensajes emergentes: `toast.success("Guardado")`, `toast.error(...)`, `toast.info(...)`. */
export const useToast = () => toastApi;

/** Confirmación propia (reemplaza a `window.confirm`): `if (await confirm({ title, tone: "danger" })) ...` */
export const useConfirm = () => askConfirm;
