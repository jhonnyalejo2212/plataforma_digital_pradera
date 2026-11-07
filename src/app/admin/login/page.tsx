import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";
import { Icon } from "@/components/ui/icon";
import { Logo } from "@/components/ui/logo";
import { Eyebrow } from "@/components/ui/section-heading";
import { getAdmin } from "@/features/auth/dal";

export const metadata: Metadata = { title: "Ingresar" };

async function RedirectIfLoggedIn() {
  if (await getAdmin()) redirect("/admin");
  return null;
}

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-white md:grid-cols-[minmax(330px,0.8fr)_1.2fr] lg:grid-cols-[minmax(390px,0.9fr)_1.1fr]">
      <Suspense>
        <RedirectIfLoggedIn />
      </Suspense>
      <section className="relative flex min-h-[330px] flex-col overflow-hidden bg-[linear-gradient(145deg,var(--color-brand-950),var(--color-brand-800))] px-7 py-8 text-white md:min-h-0 md:px-[clamp(35px,5vw,78px)] md:py-[45px]">
        <div className="absolute -right-60 -bottom-[100px] size-[460px] rounded-full border border-white/[0.08] shadow-[0_0_0_70px_rgba(255,255,255,0.025),0_0_0_140px_rgba(255,255,255,0.018)]" />
        <Logo inverse sizeClass="h-[54px] w-[162px] md:h-[76px] md:w-[228px] lg:h-[88px] lg:w-[264px]" sizes="(min-width: 1024px) 264px, (min-width: 768px) 228px, 162px" />
        <div className="relative z-[2] my-auto max-w-[520px] max-md:mt-[65px] max-md:mb-[45px]">
          <Eyebrow light>Gestión local</Eyebrow>
          <h1 className="text-4xl leading-[1.08] md:text-[clamp(38px,4vw,58px)]">Información confiable para una Pradera más conectada.</h1>
          <p className="mt-[22px] max-w-[440px] text-base leading-[1.7] text-[#b8cbc1]">Administra establecimientos, categorías y reportes desde un solo lugar.</p>
        </div>
      </section>
      <section className="relative grid place-items-center px-6 pt-[90px] pb-[55px] md:px-[30px] md:py-[70px]">
        <Link href="/" className="absolute top-7 right-6 flex items-center gap-2 text-xs text-brand-700 md:top-[35px] md:right-10">
          <Icon name="arrow" size={17} className="rotate-180" /> Volver al directorio
        </Link>
        <LoginForm />
      </section>
    </main>
  );
}
