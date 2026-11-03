import { Suspense } from "react";
import { HeaderAccount, LoginButton } from "@/components/layout/header-account";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Suspense fallback={<header className="h-[68px] border-b border-line/80 bg-white md:h-[78px]" />}>
        <SiteHeader
          account={
            <Suspense fallback={<LoginButton />}>
              <HeaderAccount />
            </Suspense>
          }
        />
      </Suspense>
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
