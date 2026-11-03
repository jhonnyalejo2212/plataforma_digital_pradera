import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function SearchBar({ compact = false, defaultValue = "" }: { compact?: boolean; defaultValue?: string }) {
  return (
    <form
      action="/directorio"
      role="search"
      className={cn(
        "mt-[33px] flex max-w-[680px] items-center gap-3 rounded-[13px] bg-white py-[7px] pr-[7px] pl-[14px] text-muted shadow-[0_18px_40px_rgba(3,20,13,0.25)] md:pl-[18px]",
        compact && "mt-[26px] max-w-[620px] border border-line shadow-soft",
      )}
    >
      <Icon name="search" size={22} />
      <input
        name="q"
        defaultValue={defaultValue}
        aria-label="Buscar establecimientos"
        placeholder="¿Qué estás buscando?"
        className="min-w-0 flex-1 bg-transparent text-ink outline-0"
      />
      <Button type="submit" iconOnlyOnMobile className="min-w-[105px]">Buscar</Button>
    </form>
  );
}
