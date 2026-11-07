import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DefinirContrasenaForm } from "@/components/admin/definir-contrasena-form";
import { Logo } from "@/components/ui/logo";
import { signOut } from "@/features/auth/actions";
import { getAdmin } from "@/features/auth/dal";

export const metadata: Metadata = { title: "Definir contraseña" };

async function RedirectIfNotAdmin() {
  if (!(await getAdmin())) redirect("/admin/login");
  return null;
}

export default function DefinirContrasenaPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f6f4] px-6 py-10">
      <Suspense>
        <RedirectIfNotAdmin />
      </Suspense>
      <div className="w-full max-w-[460px] rounded-2xl border border-line bg-white p-8 shadow-card md:p-10">
        <Logo />
        <div className="mt-8">
          <DefinirContrasenaForm />
        </div>
        <form action={signOut} className="mt-6 border-t border-line pt-5 text-center">
          <button type="submit" className="text-[11px] font-bold text-muted hover:text-ink">Cancelar y salir</button>
        </form>
      </div>
    </main>
  );
}
