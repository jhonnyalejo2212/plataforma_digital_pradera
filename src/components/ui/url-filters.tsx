"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, use, useCallback, useEffect, useMemo, useOptimistic, useRef, useState, useTransition, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Changes = Record<string, string | number | null | undefined>;
type Ctx = {
  pending: boolean;
  params: URLSearchParams;
  setFilters: (changes: Changes) => void;
  clearFilters: () => void;
  hrefFor: (changes: Changes) => string;
};

const UrlFiltersContext = createContext<Ctx | null>(null);

function applyChanges(base: URLSearchParams | string, changes: Changes) {
  const next = new URLSearchParams(base);
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === undefined || value === "" || (key === "pagina" && Number(value) <= 1)) next.delete(key);
    else next.set(key, String(value));
  }
  if (!("pagina" in changes)) next.delete("pagina");
  return next.toString();
}

/**
 * Estado de filtros guardado en la URL, sin recargar la página.
 * Los cambios se aplican de inmediato en la interfaz (optimista) y los resultados del servidor
 * se actualizan en una transición, conservando la vista anterior mientras llegan los nuevos.
 */
export function UrlFiltersProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [optimisticQs, setOptimisticQs] = useOptimistic(searchParams.toString());

  const go = useCallback(
    (qs: string, scroll: boolean) => {
      startTransition(() => {
        setOptimisticQs(qs);
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll });
      });
    },
    [router, pathname, setOptimisticQs],
  );

  const value = useMemo<Ctx>(
    () => ({
      pending,
      params: new URLSearchParams(optimisticQs),
      setFilters: (changes) => go(applyChanges(optimisticQs, changes), "pagina" in changes),
      clearFilters: () => go("", false),
      hrefFor: (changes) => {
        const qs = applyChanges(optimisticQs, changes);
        return qs ? `${pathname}?${qs}` : pathname;
      },
    }),
    [pending, optimisticQs, go, pathname],
  );

  return <UrlFiltersContext value={value}>{children}</UrlFiltersContext>;
}

export function useUrlFilters() {
  const ctx = use(UrlFiltersContext);
  if (!ctx) throw new Error("useUrlFilters debe usarse dentro de <UrlFiltersProvider>.");
  return ctx;
}

/** Enlace que aplica un filtro sin recargar y se marca activo al instante (data-active). */
export function FilterLink({ changes, className, children, ...rest }: { changes: Changes; className?: string; children: ReactNode; "aria-label"?: string; title?: string }) {
  const { params, setFilters, hrefFor } = useUrlFilters();
  const norm = (k: string, v: Changes[string]) => (v === null || v === undefined || (k === "pagina" && Number(v) <= 1) ? "" : String(v));
  const active = Object.entries(changes).every(([k, v]) => (params.get(k) ?? "") === norm(k, v));
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    setFilters(changes);
  };
  return (
    <Link href={hrefFor(changes)} onClick={onClick} scroll={false} data-active={active} aria-current={active ? "true" : undefined} className={cn("group", className)} {...rest}>
      {children}
    </Link>
  );
}

export function ClearFiltersButton({ className, children }: { className?: string; children: ReactNode }) {
  const { clearFilters } = useUrlFilters();
  return <button type="button" onClick={clearFilters} className={className}>{children}</button>;
}

/** Atenúa los resultados mientras se cargan los nuevos. */
export function FiltersResults({ children, className }: { children: ReactNode; className?: string }) {
  const { pending } = useUrlFilters();
  return (
    <div aria-busy={pending} className={cn("transition-opacity duration-150", pending && "pointer-events-none opacity-50", className)}>
      {children}
    </div>
  );
}

/** Texto con búsqueda en vivo (con retardo). Enter aplica de inmediato y nunca recarga la página. */
export function useLiveText(param = "q", delay = 300) {
  const { params, setFilters } = useUrlFilters();
  const current = params.get(param) ?? "";
  const [draft, setDraft] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [prevCurrent, setPrevCurrent] = useState(current);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latest = useRef(setFilters);
  useEffect(() => {
    latest.current = setFilters;
  });
  useEffect(() => () => clearTimeout(timer.current), []);

  if (current !== prevCurrent) {
    setPrevCurrent(current);
    if (!focused) setDraft(null);
  }

  const commit = (text: string) => {
    clearTimeout(timer.current);
    latest.current({ [param]: text.trim() || null });
  };
  return {
    value: draft ?? current,
    onChange: (text: string) => {
      setDraft(text);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => commit(text), delay);
    },
    onFocus: () => setFocused(true),
    onBlur: () => {
      setFocused(false);
      if (draft !== null && draft.trim() !== current) commit(draft);
    },
    submit: () => commit(draft ?? current),
  };
}
