"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Field, FormGrid, inputClass } from "@/components/admin/form";
import { StatusBadge } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useConfirm, useToast } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { ClearFiltersButton, FiltersResults, useLiveText, useUrlFilters } from "@/components/ui/url-filters";
import { cambiarEstadoAdministrador, invitarAdministrador, obtenerDetalleAdministrador, reenviarInvitacionAdministrador } from "@/features/administradores/actions";
import type { AdministradorDetalle, AdministradorResult, AdministradorRow } from "@/features/administradores/schema";
import { ESTADOS_PUBLICACION, formatFecha } from "@/features/establecimientos/labels";
import { cn } from "@/lib/utils/cn";

const selectClass = "h-11 rounded-[9px] border border-line bg-white px-2.5 text-sm text-body";
const initials = (nombre: string) =>
  nombre.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

function AdministradorForm({ onDone }: { onDone: () => void }) {
  const [result, setResult] = useState<AdministradorResult | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const errors = result?.fieldErrors ?? {};

  const save = (formData: FormData) =>
    startTransition(async () => {
      const res = await invitarAdministrador(formData);
      if (res.ok) {
        toast.success(res.message);
        onDone();
      } else setResult(res);
    });

  return (
    <form action={save} className="px-[25px] pt-6">
      <FormGrid>
        <Field label="Nombre completo" wide error={errors.nombre}>
          <input name="nombre" required maxLength={150} placeholder="Ej. María Fernanda Ríos" className={inputClass} aria-invalid={Boolean(errors.nombre)} />
        </Field>
        <Field label="Correo electrónico" wide error={errors.correo} hint="Se enviará un enlace de invitación para que cree su contraseña.">
          <input name="correo" type="email" required maxLength={255} autoComplete="off" placeholder="nombre@correo.com" className={inputClass} aria-invalid={Boolean(errors.correo)} />
        </Field>
      </FormGrid>
      {result && !result.ok && <p role="alert" className="mt-4 rounded-lg bg-[#fceceb] px-3 py-2.5 text-xs text-[#a34d47]">{result.message}</p>}
      <footer className="sticky bottom-0 -mx-[25px] mt-6 flex items-center gap-[9px] border-t border-line bg-white px-[25px] py-[17px]">
        <Button variant="secondary" icon="x" onClick={onDone}>Cancelar</Button>
        <Button type="submit" icon="mail" disabled={pending}>{pending ? "Enviando…" : "Enviar invitación"}</Button>
      </footer>
    </form>
  );
}

function DetalleAdmin({ id, onToggle, onResend, toggling }: { id: number; onToggle: (a: AdministradorDetalle) => void; onResend: (a: AdministradorDetalle) => void; toggling: boolean }) {
  const [res, setRes] = useState<{ id: number; data: AdministradorDetalle | null } | null>(null);
  const toast = useToast();

  useEffect(() => {
    let live = true;
    obtenerDetalleAdministrador(id).then((d) => {
      if (live) setRes({ id, data: d });
    });
    return () => {
      live = false;
    };
  }, [id]);

  const data = res?.id === id ? res.data : undefined;
  const copyId = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(data.auth_user_id);
    toast.info("ID de autenticación copiado.");
  };

  if (data === undefined) return <p className="px-[25px] py-10 text-center text-xs text-muted">Cargando información…</p>;
  if (data === null) return <p role="alert" className="px-[25px] py-10 text-center text-xs text-[#a34d47]">No se pudo cargar el administrador.</p>;
  const detalle = data;

  return (
    <div className="px-[25px] pt-6 pb-[25px]">
      <dl className="grid gap-4 sm:grid-cols-2">
        <div><dt className="text-[10px] font-bold text-muted">Nombre</dt><dd className="mt-1 text-sm text-ink">{detalle.nombre}</dd></div>
        <div><dt className="text-[10px] font-bold text-muted">Correo</dt><dd className="mt-1 text-sm text-ink">{detalle.correo}</dd></div>
        <div>
          <dt className="text-[10px] font-bold text-muted">ID de autenticación</dt>
          <dd className="mt-1 flex items-center gap-2">
            <code className="truncate rounded-md bg-[#f4f6f4] px-2 py-1 text-[11px] text-body">{detalle.auth_user_id}</code>
            <button type="button" onClick={copyId} aria-label="Copiar ID de autenticación" className="grid size-7 shrink-0 place-items-center rounded-md border border-line text-muted hover:text-ink"><Icon name="copy" size={14} /></button>
          </dd>
        </div>
        <div><dt className="text-[10px] font-bold text-muted">Miembro desde</dt><dd className="mt-1 text-sm text-ink">{formatFecha(detalle.created_at)}</dd></div>
      </dl>

      <h3 className="mt-6 mb-2 text-[13px] font-bold text-ink">Establecimientos bajo su responsabilidad</h3>
      {detalle.establecimientos.length === 0 ? (
        <p className="rounded-lg bg-[#f4f6f4] px-3 py-3 text-xs text-muted">No tiene establecimientos asignados.</p>
      ) : (
        <ul className="divide-y divide-[#edf0ee] rounded-lg border border-line">
          {detalle.establecimientos.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <Link href={`/admin/establecimientos/${e.id}`} className="truncate text-xs font-bold text-brand-700 hover:underline">{e.nombre}</Link>
              <StatusBadge tone={e.estado_publicacion === "publicado" ? "success" : "warning"}>{ESTADOS_PUBLICACION[e.estado_publicacion as keyof typeof ESTADOS_PUBLICACION] ?? e.estado_publicacion}</StatusBadge>
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-6 flex flex-wrap items-center justify-end gap-[9px] border-t border-line pt-4">
        <StatusBadge tone={detalle.activo ? "success" : "neutral"}>{detalle.activo ? "Cuenta activa" : "Cuenta inactiva"}</StatusBadge>
        {detalle.activo && (
          <Button variant="secondary" icon="mail" disabled={toggling} onClick={() => onResend(detalle)}>
            Reenviar invitación
          </Button>
        )}
        <Button
          variant={detalle.activo ? "secondary" : "primary"}
          icon={detalle.activo ? "x" : "check"}
          disabled={toggling}
          onClick={() => onToggle(detalle)}
        >
          {detalle.activo ? "Desactivar cuenta" : "Activar cuenta"}
        </Button>
      </footer>
    </div>
  );
}

export function AdministradoresPanel({ admins, currentAdminId }: { admins: AdministradorRow[]; currentAdminId: number }) {
  const { params, setFilters } = useUrlFilters();
  const text = useLiveText("q");
  const toast = useToast();
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const [modal, setModal] = useState<{ tipo: "nuevo" } | { tipo: "detalle"; id: number } | { tipo: "enlace"; link: string; message: string } | null>(null);
  const close = () => setModal(null);
  const estado = params.get("estado") ?? "";

  const toggle = async (a: { id: number; nombre: string; activo: boolean }) => {
    const ok = await confirm({
      title: `${a.activo ? "¿Desactivar" : "¿Activar"} a ${a.nombre}?`,
      description: a.activo
        ? "La cuenta perderá el acceso al panel hasta que se reactive. Sus establecimientos no se verán afectados."
        : "La cuenta volverá a tener acceso al panel administrativo.",
      confirmLabel: a.activo ? "Sí, desactivar" : "Sí, activar",
      tone: a.activo ? "danger" : "default",
    });
    if (!ok) return;
    startTransition(async () => {
      const res = await cambiarEstadoAdministrador(a.id, !a.activo);
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  const resend = async (a: { id: number; nombre: string; correo: string }) => {
    const ok = await confirm({
      title: `¿Reenviar acceso a ${a.nombre}?`,
      description: `Se enviará un correo a ${a.correo} con un nuevo enlace para definir su contraseña.`,
      confirmLabel: "Enviar correo",
      icon: "mail",
    });
    if (!ok) return;
    startTransition(async () => {
      const res = await reenviarInvitacionAdministrador(a.id);
      if (res.ok && res.actionLink) setModal({ tipo: "enlace", link: res.actionLink, message: res.message });
      else if (res.ok) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  const copyLink = async () => {
    if (modal?.tipo !== "enlace") return;
    await navigator.clipboard.writeText(modal.link);
    toast.success("Enlace copiado.");
  };

  return (
    <section className="overflow-hidden rounded-[14px] border border-line bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-line px-[25px] py-[23px]">
        <div>
          <h2 className="flex items-center gap-2 text-lg"><Icon name="users" size={20} className="text-brand-700" />Cuentas del panel</h2>
          <p className="mt-[5px] text-[11px] text-muted">Personas con acceso para gestionar el directorio.</p>
        </div>
        <Button icon="plus" iconOnlyOnMobile onClick={() => setModal({ tipo: "nuevo" })}>Invitar administrador</Button>
      </div>

      <div role="search" className="grid gap-3 border-b border-line p-[18px] md:grid-cols-[1fr_200px]">
        <div className="flex h-11 items-center gap-[9px] rounded-[9px] border border-line pl-[13px] text-muted focus-within:border-brand-500">
          <Icon name="search" size={18} />
          <input
            type="search"
            value={text.value}
            onChange={(e) => text.onChange(e.target.value)}
            onFocus={text.onFocus}
            onBlur={text.onBlur}
            onKeyDown={(e) => e.key === "Enter" && text.submit()}
            aria-label="Buscar administradores"
            placeholder="Buscar por nombre o correo…"
            autoComplete="off"
            className="min-w-0 flex-1 border-0 bg-transparent text-sm text-ink outline-0"
          />
        </div>
        <select value={estado} onChange={(e) => setFilters({ estado: e.target.value })} aria-label="Estado de la cuenta" className={selectClass}>
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </div>

      <FiltersResults>
        {admins.length === 0 ? (
          <div className="grid min-h-[250px] place-items-center p-8 text-center text-muted">
            <div>
              <Icon name="search" size={28} className="mx-auto mb-3 text-brand-600" />
              <strong className="text-sm text-ink">No hay resultados</strong>
              <p className="mt-1 mb-3 text-[11px]">No encontramos administradores con esos filtros.</p>
              <ClearFiltersButton className="text-[11px] font-bold text-brand-700">Limpiar filtros</ClearFiltersButton>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="bg-[#fafbfa] text-left text-[9px] uppercase tracking-[0.08em] text-muted">
                  <th className="px-[18px] py-3">Administrador</th>
                  <th className="px-[18px] py-3">Estado</th>
                  <th className="px-[18px] py-3">Establecimientos</th>
                  <th className="px-[18px] py-3">Creado</th>
                  <th className="px-[18px] py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id} className="border-t border-[#edf0ee] text-xs text-body">
                    <td className="px-[18px] py-3">
                      <div className="flex items-center gap-[10px] text-ink">
                        <span className={cn("grid size-[38px] shrink-0 place-items-center rounded-lg text-[11px] font-bold", a.activo ? "bg-brand-100 text-brand-700" : "bg-[#eef1ef] text-muted")}>{initials(a.nombre)}</span>
                        <div className="min-w-0">
                          <strong className="block truncate">{a.nombre}</strong>
                          <small className="block truncate text-[10px] text-muted">{a.correo}</small>
                        </div>
                      </div>
                    </td>
                    <td className="px-[18px] py-3"><StatusBadge tone={a.activo ? "success" : "neutral"}>{a.activo ? "Activo" : "Inactivo"}</StatusBadge></td>
                    <td className="px-[18px] py-3">{a.total_establecimientos}</td>
                    <td className="px-[18px] py-3">{formatFecha(a.created_at)}</td>
                    <td className="px-[18px] py-3">
                      <div className="flex justify-end gap-[6px]">
                        <button type="button" onClick={() => setModal({ tipo: "detalle", id: a.id })} className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-[11px] font-bold text-brand-700">
                          <Icon name="eye" size={14} />Detalle
                        </button>
                        {a.activo && (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => resend(a)}
                            className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-[11px] font-bold text-body disabled:opacity-50"
                          >
                            <Icon name="mail" size={14} />Reenviar
                          </button>
                        )}
                        {a.id !== currentAdminId && (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => toggle(a)}
                            className={cn("flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-50", a.activo ? "border-line text-[#b9574e]" : "border-line text-brand-700")}
                          >
                            <Icon name={a.activo ? "x" : "check"} size={14} />{a.activo ? "Desactivar" : "Activar"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </FiltersResults>

      <Modal open={modal?.tipo === "nuevo"} onClose={close} eyebrow="Nueva cuenta" title="Invitar administrador">
        {modal?.tipo === "nuevo" && <AdministradorForm key="nuevo" onDone={close} />}
      </Modal>
      <Modal open={modal?.tipo === "enlace"} onClose={close} eyebrow="Acceso manual" title="Enlace de acceso">
        {modal?.tipo === "enlace" && (
          <div className="px-[25px] py-6">
            <p className="text-xs leading-[1.6] text-body">{modal.message}</p>
            <div className="mt-4 flex items-start gap-2">
              <code className="max-h-24 flex-1 overflow-y-auto break-all rounded-lg bg-[#f4f6f4] p-3 text-[11px] text-body">{modal.link}</code>
              <button type="button" onClick={copyLink} aria-label="Copiar enlace" className="grid size-9 shrink-0 place-items-center rounded-lg border border-line text-muted hover:text-ink"><Icon name="copy" size={16} /></button>
            </div>
            <footer className="mt-6 flex justify-end gap-[9px] border-t border-line pt-4">
              <Button icon="copy" onClick={copyLink}>Copiar enlace</Button>
            </footer>
          </div>
        )}
      </Modal>
      <Modal open={modal?.tipo === "detalle"} onClose={close} eyebrow="Administrador" title="Detalle de la cuenta">
        {modal?.tipo === "detalle" && (
          <DetalleAdmin
            key={modal.id}
            id={modal.id}
            toggling={pending}
            onResend={(d) => {
              close();
              resend(d);
            }}
            onToggle={(d) => {
              close();
              toggle(d);
            }}
          />
        )}
      </Modal>
    </section>
  );
}
