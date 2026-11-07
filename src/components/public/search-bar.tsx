"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useLiveText } from "@/components/ui/url-filters";
import { cn } from "@/lib/utils/cn";

type ViewProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  compact?: boolean;
  busy?: boolean;
};

function SearchBarView({ value, onChange, onSubmit, onFocus, onBlur, compact, busy }: ViewProps) {
  return (
    <form
      action="/directorio"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className={cn(
        "mt-[33px] flex max-w-[680px] items-center gap-3 rounded-[13px] bg-white py-[7px] pr-[7px] pl-[14px] text-muted shadow-[0_18px_40px_rgba(3,20,13,0.25)] md:pl-[18px]",
        compact && "mt-[26px] max-w-[620px] border border-line shadow-soft",
      )}
    >
      <Icon name="search" size={22} />
      <input
        name="q"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        aria-label="Buscar establecimientos"
        placeholder="¿Qué estás buscando?"
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent text-ink outline-0"
      />
      <Button type="submit" icon="search" iconOnlyOnMobile className="min-w-[105px]" disabled={busy}>Buscar</Button>
    </form>
  );
}

/** Buscador del inicio: lleva al directorio con la búsqueda aplicada, sin recargar la página. */
export function HeroSearchBar() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <SearchBarView
      value={value}
      onChange={setValue}
      busy={pending}
      onSubmit={() => startTransition(() => router.push(value.trim() ? `/directorio?q=${encodeURIComponent(value.trim())}` : "/directorio"))}
    />
  );
}

/** Buscador del directorio: filtra en vivo mientras se escribe. Debe estar dentro de <UrlFiltersProvider>. */
export function DirectorySearchBar() {
  const text = useLiveText("q");
  return <SearchBarView compact value={text.value} onChange={text.onChange} onFocus={text.onFocus} onBlur={text.onBlur} onSubmit={text.submit} />;
}
