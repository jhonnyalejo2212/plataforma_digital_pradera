"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/feedback";
import { establecerSesionDesdeTokens, signIn, type LoginState } from "@/features/auth/actions";

const initial: LoginState = { message: "" };
const field = "flex h-12 items-center gap-2.5 rounded-[10px] border border-line px-[13px] text-muted transition focus-within:border-brand-500 focus-within:shadow-[0_0_0_3px_var(--color-brand-50)]";
const input = "min-w-0 flex-1 border-0 bg-transparent text-[13px] text-ink outline-0";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initial);
  const [visible, setVisible] = useState(false);
  const [verifyingLink, setVerifyingLink] = useState(false);
  const [linkError, setLinkError] = useState("");
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const rawHash = window.location.hash.replace(/^#/, "");
    if (!rawHash) return;
    const hashParams = new URLSearchParams(rawHash);
    const errorDesc = hashParams.get("error_description");
    if (errorDesc) {
      window.history.replaceState(null, "", window.location.pathname);
      queueMicrotask(() => setLinkError("El enlace del correo expiró o ya fue utilizado."));
      return;
    }
    const access_token = hashParams.get("access_token");
    const refresh_token = hashParams.get("refresh_token");
    if (!access_token || !refresh_token) return;

    const type = hashParams.get("type");
    const sp = new URLSearchParams(window.location.search);
    const nextParam = sp.get("next");
    const dest =
      nextParam?.startsWith("/") && !nextParam.startsWith("//")
        ? nextParam
        : type === "invite" || type === "recovery"
          ? "/admin/definir-contrasena"
          : "/admin";

    window.history.replaceState(null, "", window.location.pathname);
    queueMicrotask(() => setVerifyingLink(true));
    establecerSesionDesdeTokens({ access_token, refresh_token }).then((res) => {
      if (res.ok) {
        toast.info("Define tu contraseña para completar el acceso.");
        router.replace(dest);
      } else {
        setVerifyingLink(false);
        setLinkError(res.message ?? "No se pudo validar el enlace.");
      }
    });
  }, [router, toast]);

  if (verifyingLink) {
    return (
      <div className="w-[min(420px,100%)] text-center" aria-busy="true">
        <span className="mx-auto mb-5 grid size-[50px] place-items-center rounded-sm bg-brand-100 text-brand-700"><Icon name="lock" size={25} /></span>
        <h2 className="text-[26px]">Verificando tu invitación…</h2>
        <p className="mt-2 text-[13px] text-muted">Espera un momento mientras preparamos tu cuenta.</p>
      </div>
    );
  }

  const errorMessage = state.message || linkError;
  return (
    <form action={action} className="w-[min(420px,100%)]">
      <span className="mb-5 grid size-[50px] place-items-center rounded-sm bg-brand-100 text-brand-700"><Icon name="users" size={25} /></span>
      <h2 className="text-[30px]">Bienvenido de nuevo</h2>
      <p className="mt-2 mb-[30px] text-[13px] text-muted">Ingresa tus datos para acceder al panel administrativo.</p>
      <label className="block">
        <span className="mb-2 block text-[11px] font-bold text-body">Correo electrónico</span>
        <div className={field}><Icon name="mail" size={18} /><input name="correo" type="email" autoComplete="username" required maxLength={255} className={input} /></div>
      </label>
      <label className="mt-[18px] block">
        <span className="mb-2 block text-[11px] font-bold text-body">Contraseña</span>
        <div className={field}>
          <Icon name="briefcase" size={18} />
          <input name="contrasena" type={visible ? "text" : "password"} autoComplete="current-password" required maxLength={200} className={input} />
          <button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"} className="p-0 text-muted"><Icon name="eye" size={18} /></button>
        </div>
      </label>
      {errorMessage && <p role="alert" className="mt-4 rounded-lg bg-[#fceceb] px-3 py-2.5 text-xs text-[#a34d47]">{errorMessage}</p>}
      <Button type="submit" icon="arrow" disabled={pending} className="mt-[22px] w-full">{pending ? "Ingresando…" : "Ingresar al panel"}</Button>
      <p className="mt-4 text-center text-xs text-muted">
        <Link href="/admin/recuperar" className="font-bold text-brand-700">¿Olvidaste tu contraseña?</Link>
      </p>
    </form>
  );
}
