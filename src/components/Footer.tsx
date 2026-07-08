"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "./Logo";
import { Wifi, WifiOff } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function Footer() {
  const sesion = useAppStore((s) => s.sesion);
  const [enLinea, setEnLinea] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  useEffect(() => {
    const marcarEnLinea = () => setEnLinea(true);
    const marcarSinConexion = () => setEnLinea(false);
    window.addEventListener("online", marcarEnLinea);
    window.addEventListener("offline", marcarSinConexion);
    return () => {
      window.removeEventListener("online", marcarEnLinea);
      window.removeEventListener("offline", marcarSinConexion);
    };
  }, []);

  const enlacesCuenta = sesion
    ? [
        { href: "/perfil", label: "Mi perfil" },
        { href: "/dashboard/vendedor", label: "Panel de vendedor" },
      ]
    : [
        { href: "/login", label: "Iniciar sesión" },
        { href: "/registro", label: "Crear cuenta" },
      ];

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
            <div
              className={`mt-4 flex items-center gap-1.5 text-xs ${
                enLinea ? "text-moorcado-green" : "text-red-500"
              }`}
            >
              {enLinea ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {enLinea ? "Conectado" : "Sin conexión"}
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
          <FooterCol title="Cuenta" links={enlacesCuenta} />
          <FooterCol
            title="Soporte"
            links={[
              { href: "/ayuda", label: "Centro de ayuda" },
              { href: "/seguridad", label: "Seguridad" },
              { href: "/terminos", label: "Términos y condiciones" },
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
