import Link from "next/link";
import Logo from "./Logo";
import { Wifi } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mb-16 mt-auto border-t border-black/5 bg-white md:mb-0">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-3 text-sm text-moorcado-gray-dark/70">
              El mercado digital del ganado en Honduras. Compra, vende y
              gestiona tu hato con confianza.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-moorcado-green">
              <Wifi className="h-3.5 w-3.5" />
              Conectado
            </div>
          </div>
          <FooterCol
            title="Explorar"
            links={[
              { href: "/catalogo", label: "Catálogo" },
              { href: "/mapa", label: "Mapa" },
              { href: "/planes", label: "Planes" },
              { href: "/rumi", label: "Rumi Premium" },
            ]}
          />
          <FooterCol
            title="Cuenta"
            links={[
              { href: "/login", label: "Iniciar sesión" },
              { href: "/registro", label: "Crear cuenta" },
              { href: "/perfil", label: "Mi perfil" },
              { href: "/dashboard", label: "Mi dashboard" },
            ]}
          />
          <FooterCol
            title="Soporte"
            links={[
              { href: "/", label: "Centro de ayuda" },
              { href: "/", label: "Seguridad" },
              { href: "/", label: "Términos y condiciones" },
              { href: "/admin", label: "Administración" },
            ]}
          />
        </div>
        <p className="mt-10 border-t border-black/5 pt-6 text-xs text-moorcado-gray-dark/50">
          © 2026 Moorcado. Hecho para el sector ganadero de Honduras.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="font-display text-sm font-semibold text-moorcado-gray-dark">
        {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-sm text-moorcado-gray-dark/70 hover:text-moorcado-green"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
