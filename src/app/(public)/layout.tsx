import { Suspense } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Suspense fallback={<header className="h-[68px] border-b border-line/80 bg-white md:h-[78px]" />}>
        <SiteHeader />
      </Suspense>
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
