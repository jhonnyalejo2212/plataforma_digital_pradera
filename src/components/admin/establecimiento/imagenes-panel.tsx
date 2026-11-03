"use client";

import Image from "next/image";
import { useOptimistic, useRef, useState, useTransition, type DragEvent } from "react";
import { EmptyHint, iconButton, PanelCard, smallInput } from "@/components/admin/establecimiento/shared";
import { useConfirm, useToast } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { actualizarTextoAlternativo, eliminarImagen, establecerPortada, reordenarImagenes, subirImagen } from "@/features/establecimientos/detail-actions";
import { MAX_IMAGENES } from "@/features/establecimientos/detail-constants";
import { compressImage, formatBytes } from "@/lib/image/compress";
import { cn } from "@/lib/utils/cn";

export type ImagenAdmin = { id: number; url: string; texto_alternativo: string | null; es_principal: boolean; orden: number };
type Upload = { key: string; name: string; preview: string; status: "procesando" | "subiendo" | "error"; note?: string };
type OptimisticAction = { type: "delete"; id: number } | { type: "cover"; id: number } | { type: "move"; id: number; dir: -1 | 1 };

function reduce(list: ImagenAdmin[], a: OptimisticAction): ImagenAdmin[] {
  if (a.type === "delete") {
    const rest = list.filter((i) => i.id !== a.id);
    return list.find((i) => i.id === a.id)?.es_principal && rest[0] ? rest.map((i, idx) => ({ ...i, es_principal: idx === 0 })) : rest;
  }
  if (a.type === "cover") return list.map((i) => ({ ...i, es_principal: i.id === a.id }));
  const idx = list.findIndex((i) => i.id === a.id);
  const to = idx + a.dir;
  if (idx < 0 || to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[idx], next[to]] = [next[to], next[idx]];
  return next;
}

export function ImagenesPanel({ establecimientoId, imagenes }: { establecimientoId: number; imagenes: ImagenAdmin[] }) {
  const [list, apply] = useOptimistic(imagenes, reduce);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const toast = useToast();
  const confirm = useConfirm();
  const [dragging, setDragging] = useState(false);
  const [, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const busy = uploads.some((u) => u.status !== "error");
  const remaining = MAX_IMAGENES - list.length - uploads.filter((u) => u.status !== "error").length;

  const patch = (key: string, p: Partial<Upload>) => setUploads((u) => u.map((x) => (x.key === key ? { ...x, ...p } : x)));

  async function handleFiles(files: FileList | File[]) {
    const queue = [...files].filter((f) => f.type.startsWith("image/"));
    if (queue.length === 0) return toast.error("Selecciona archivos de imagen (JPG, PNG, WebP…).", "Archivo no válido");
    if (queue.length > remaining) toast.info(`Solo caben ${Math.max(0, remaining)} fotografías más (máximo ${MAX_IMAGENES}).`, "Límite de fotografías");
    let subidas = 0;
    let fallidas = 0;
    for (const file of queue.slice(0, Math.max(0, remaining))) {
      const key = crypto.randomUUID();
      const preview = URL.createObjectURL(file);
      setUploads((u) => [...u, { key, name: file.name, preview, status: "procesando" }]);
      try {
        if (file.size > 40 * 1024 * 1024) throw new Error("El archivo supera los 40 MB.");
        const c = await compressImage(file);
        patch(key, { status: "subiendo", note: `${formatBytes(c.originalSize)} → ${formatBytes(c.blob.size)} (${c.ext === "webp" ? "WebP" : "JPEG"})` });
        const fd = new FormData();
        fd.set("establecimiento_id", String(establecimientoId));
        fd.set("file", new File([c.blob], `foto.${c.ext}`, { type: c.blob.type }));
        const res = await subirImagen(fd);
        if (!res.ok) throw new Error(res.message);
        setUploads((u) => u.filter((x) => x.key !== key));
        URL.revokeObjectURL(preview);
        subidas++;
      } catch (e) {
        patch(key, { status: "error", note: e instanceof Error ? e.message : "No se pudo subir la imagen." });
        fallidas++;
      }
    }
    if (subidas) toast.success(subidas === 1 ? "La fotografía se subió y optimizó correctamente." : `${subidas} fotografías subidas y optimizadas.`, "Fotografías subidas");
    if (fallidas) toast.error(fallidas === 1 ? "No se pudo subir una fotografía. Revisa el detalle en la tarjeta." : `No se pudieron subir ${fallidas} fotografías. Revisa el detalle en las tarjetas.`, "Error al subir");
  }

  const run = (action: OptimisticAction, call: () => Promise<{ ok: boolean; message: string }>) =>
    startTransition(async () => {
      apply(action);
      const res = await call();
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
    });

  const move = (id: number, dir: -1 | 1) => {
    const idx = list.findIndex((i) => i.id === id);
    const next = reduce(list, { type: "move", id, dir });
    if (idx < 0 || next === list) return;
    run({ type: "move", id, dir }, () => reordenarImagenes(establecimientoId, next.map((i) => i.id)));
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    void handleFiles(e.dataTransfer.files);
  };

  return (
    <PanelCard icon="image" title="Fotografías" description={`Hasta ${MAX_IMAGENES} fotos. Se ajustan y comprimen automáticamente antes de subirse.`}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn("flex min-h-[150px] flex-col items-center justify-center rounded-xl border border-dashed border-[#a9c7b4] bg-brand-50 p-6 text-center text-brand-700 transition", dragging && "border-brand-600 bg-brand-100")}
      >
        <Icon name="upload" size={28} />
        <strong className="mt-2 text-[13px]">Arrastra tus fotografías aquí</strong>
        <p className="mt-1 mb-3.5 text-[11px] text-muted">o selecciónalas desde tu equipo · se convierten a WebP, máx. 1600 px</p>
        <button type="button" onClick={() => input.current?.click()} disabled={remaining <= 0} className="flex h-11 items-center gap-2 rounded-[10px] border border-line bg-white px-5 text-sm font-bold text-brand-800 disabled:opacity-50">
          <Icon name="image" size={18} /> Elegir fotografías
        </button>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { if (e.target.files) void handleFiles(e.target.files); e.target.value = ""; }} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-4">
        {list.map((img, idx) => (
          <article key={img.id} className="overflow-hidden rounded-xl border border-line bg-white">
            <div className="relative aspect-[4/3] bg-brand-50">
              <Image src={img.url} alt={img.texto_alternativo ?? ""} fill sizes="(min-width: 1024px) 240px, 45vw" className="object-cover" />
              {img.es_principal && <span className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-brand-700 px-2 py-1 text-[10px] font-bold text-white"><Icon name="star" size={12} /> Portada</span>}
            </div>
            <div className="space-y-2 p-2.5">
              <input
                defaultValue={img.texto_alternativo ?? ""}
                maxLength={255}
                placeholder="Descripción de la foto"
                aria-label="Descripción de la foto (texto alternativo)"
                onBlur={(e) => e.target.value.trim() !== (img.texto_alternativo ?? "") && startTransition(async () => { const r = await actualizarTextoAlternativo(img.id, e.target.value); if (r.ok) toast.success("Descripción de la foto guardada."); else toast.error(r.message); })}
                className={cn(smallInput, "py-2")}
              />
              <div className="flex items-center gap-1.5">
                <button type="button" title="Mover antes" aria-label="Mover antes" disabled={idx === 0} onClick={() => move(img.id, -1)} className={iconButton}><Icon name="arrow" size={16} className="rotate-180" /></button>
                <button type="button" title="Mover después" aria-label="Mover después" disabled={idx === list.length - 1} onClick={() => move(img.id, 1)} className={iconButton}><Icon name="arrow" size={16} /></button>
                <button type="button" title="Usar como portada" aria-label="Usar como portada" disabled={img.es_principal} onClick={() => run({ type: "cover", id: img.id }, () => establecerPortada(img.id))} className={iconButton}><Icon name="star" size={16} /></button>
                <button type="button" title="Eliminar" aria-label="Eliminar fotografía" onClick={async () => { if (await confirm({ title: "¿Eliminar esta fotografía?", description: "Se borrará del sitio y del almacenamiento. Esta acción no se puede deshacer.", confirmLabel: "Sí, eliminar", tone: "danger" })) run({ type: "delete", id: img.id }, () => eliminarImagen(img.id)); }} className={cn(iconButton, "ml-auto text-[#b9574e] hover:border-[#e8bcb7] hover:text-[#b9574e]")}><Icon name="trash" size={16} /></button>
              </div>
            </div>
          </article>
        ))}
        {uploads.map((u) => (
          <article key={u.key} className="overflow-hidden rounded-xl border border-line bg-white" aria-busy={u.status !== "error"}>
            <div className="relative aspect-[4/3] bg-brand-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u.preview} alt="" className={cn("size-full object-cover", u.status !== "error" && "opacity-50")} />
              {u.status !== "error" && <span className="absolute inset-0 grid place-items-center"><span className="size-7 animate-spin rounded-full border-[3px] border-brand-100 border-t-brand-700" /></span>}
            </div>
            <div className="p-2.5 text-[11px]">
              <strong className="block truncate text-ink">{u.name}</strong>
              <span className={u.status === "error" ? "text-[#b9574e]" : "text-muted"}>{u.status === "procesando" ? "Optimizando…" : u.status === "subiendo" ? `Subiendo · ${u.note}` : u.note}</span>
              {u.status === "error" && <button type="button" onClick={() => setUploads((x) => x.filter((i) => i.key !== u.key))} className="mt-1 block font-bold text-brand-700">Descartar</button>}
            </div>
          </article>
        ))}
      </div>
      {list.length === 0 && uploads.length === 0 && <div className="mt-5"><EmptyHint icon="image" title="Aún no hay fotografías" text="La primera que subas será la portada del establecimiento." /></div>}
      {busy && <p className="mt-3 text-[11px] text-muted" role="status">Procesando fotografías, no cierres esta pantalla…</p>}
    </PanelCard>
  );
}
