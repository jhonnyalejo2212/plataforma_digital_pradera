import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Panel administrativo", template: "%s | Panel administrativo" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
