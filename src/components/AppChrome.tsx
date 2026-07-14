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
    return (
      <main key={pathname} className="flex-1 animate-fade-in">
        {children}
      </main>
    );
  }

  // En mobile el footer completo (con sus 4 columnas de enlaces) solo
  // tiene sentido en la portada — en el resto de páginas competía con el
  // contenido y con la nav inferior fija, quedando superpuesto.
  const esInicio = pathname === "/";

  return (
    <>
      <Header />
      <main key={pathname} className="flex-1 animate-fade-in">
        {children}
      </main>
      <Footer className={esInicio ? "" : "hidden md:block"} />
      <MobileNav />
      <MooeWidget />
    </>
  );
}
