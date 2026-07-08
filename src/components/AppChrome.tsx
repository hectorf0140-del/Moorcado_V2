"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import MobileNav from "./MobileNav";
import MooeWidget from "./MooeWidget";

/**
 * Los paneles internos (/admin, /moderador) ocupan toda la pantalla y no
 * llevan el header/footer/nav del sitio público — se sienten como una
 * aplicación aparte, no como una página más del marketplace.
 */
export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const esPanelInterno = pathname?.startsWith("/admin") || pathname?.startsWith("/moderador");

  if (esPanelInterno) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileNav />
      <MooeWidget />
    </>
  );
}
