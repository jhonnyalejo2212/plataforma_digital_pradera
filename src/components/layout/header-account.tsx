import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { getAdmin } from "@/features/auth/dal";

export function LoginButton() {
  return <Button href="/admin/login" variant="secondary">Ingresar</Button>;
}

/** Muestra al administrador con sesión activa o el botón de ingreso. Lee la sesión en cada petición. */
export async function HeaderAccount() {
  const admin = await getAdmin();
  if (!admin) return <LoginButton />;
  const firstName = admin.nombre.split(" ")[0];
  return (
    <Link
      href="/admin"
      title="Ir al panel administrativo"
      className="inline-flex min-h-11 max-w-[200px] items-center justify-center gap-[9px] rounded-[10px] border border-line bg-white px-4 text-sm font-bold text-brand-800 transition hover:-translate-y-px hover:shadow-soft"
    >
      <span className="grid size-[26px] shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700"><Icon name="users" size={15} /></span>
      <span className="truncate">{firstName}</span>
    </Link>
  );
}
