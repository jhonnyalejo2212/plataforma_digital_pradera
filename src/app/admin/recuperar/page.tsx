import type { Metadata } from "next";
import Link from "next/link";
import { RecoverForm } from "@/components/admin/recover-form";
import { Logo } from "@/components/ui/logo";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function RecuperarPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f6f4] px-6 py-10">
      <div className="w-full max-w-[460px] rounded-2xl border border-line bg-white p-8 shadow-card md:p-10">
        <Logo />
        <div className="mt-8">
          <RecoverForm />
        </div>
        <p className="mt-6 border-t border-line pt-5 text-center text-[11px] text-muted">
          <Link href="/" className="font-bold text-brand-700">Ir al directorio</Link>
        </p>
      </div>
    </main>
  );
}
