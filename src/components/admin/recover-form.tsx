"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { solicitarRecuperacion, type RecoveryState } from "@/features/auth/actions";

const initial: RecoveryState = { message: "" };
const field = "flex h-12 items-center gap-2.5 rounded-[10px] border border-line px-[13px] text-muted transition focus-within:border-brand-500 focus-within:shadow-[0_0_0_3px_var(--color-brand-50)]";
const input = "min-w-0 flex-1 border-0 bg-transparent text-[13px] text-ink outline-0";

export function RecoverForm() {
  const [state, action, pending] = useActionState(solicitarRecuperacion, initial);
  return (
    <form action={action} className="w-[min(420px,100%)]">
      <span className="mb-5 grid size-[50px] place-items-center rounded-sm bg-brand-100 text-brand-700"><Icon name="mail" size={25} /></span>
      <h2 className="text-[30px]">Recuperar contraseña</h2>
      <p className="mt-2 mb-[30px] text-[13px] text-muted">Escribe tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>
      <label className="block">
        <span className="mb-2 block text-[11px] font-bold text-body">Correo electrónico</span>
        <div className={field}><Icon name="mail" size={18} /><input name="correo" type="email" autoComplete="username" required maxLength={255} className={input} /></div>
      </label>
      {state.message && (
        <p role={state.sent ? "status" : "alert"} className={state.sent ? "mt-4 rounded-lg bg-brand-50 px-3 py-2.5 text-xs text-brand-700" : "mt-4 rounded-lg bg-[#fceceb] px-3 py-2.5 text-xs text-[#a34d47]"}>{state.message}</p>
      )}
      <Button type="submit" icon="arrow" disabled={pending} className="mt-[22px] w-full">{pending ? "Enviando…" : "Enviar enlace"}</Button>
      <p className="mt-5 text-center text-xs text-muted">
        <Link href="/admin/login" className="font-bold text-brand-700">Volver a ingresar</Link>
      </p>
    </form>
  );
}
