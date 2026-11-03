import type { Metadata } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import { FeedbackProvider } from "@/components/ui/feedback";
import { siteConfig } from "@/config/site";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: { default: `${siteConfig.name} | ${siteConfig.tagline}`, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${dmSans.variable} ${manrope.variable}`}>
      <body className="min-h-screen">
        <FeedbackProvider>{children}</FeedbackProvider>
      </body>
    </html>
  );
}
