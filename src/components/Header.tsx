"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, MessageCircle, Search, Plus, LogOut, LayoutDashboard } from "lucide-react";
import Logo from "./Logo";
import { useAppStore } from "@/store/useAppStore";

const navLinksBase = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/mapa", label: "Mapa" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const sesion = useAppStore((s) => s.sesion);
  const usuarios = useAppStore((s) => s.usuarios);
  const logout = useAppStore((s) => s.logout);

  const usuarioActual = sesion ? usuarios.find((u) => u.id === sesion.usuarioId) : undefined;
  const esEmpresa = usuarioActual?.tipo === "empresa";
  const navLinks = [
    ...navLinksBase,
    sesion
      ? { href: "/verificacion", label: "Verificación" }
      : { href: "/planes", label: "Planes" },
    ...(esEmpresa ? [{ href: "/rumi", label: "Rumi" }] : []),
  ];

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Logo />

        <div className="hidden flex-1 max-w-xl md:block">
          <label className="flex items-center gap-2 rounded-full bg-moorcado-gray-light px-4 py-2.5">
            <Search className="h-4 w-4 text-moorcado-gray-dark/60" />
            <input
              type="text"
              placeholder="Buscar por raza, departamento o palabra clave..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-moorcado-gray-dark/50"
            />
          </label>
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "bg-moorcado-green/10 text-moorcado-green"
                  : "text-moorcado-gray-dark hover:bg-moorcado-gray-light"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/publicar"
            className="hidden items-center gap-1.5 rounded-full bg-moorcado-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-moorcado-green/90 sm:flex"
          >
            <Plus className="h-4 w-4" />
            Publicar Animal
          </Link>
          <IconLink href="/notificaciones" label="Notificaciones">
            <Bell className="h-5 w-5" />
          </IconLink>
          <IconLink href="/mensajes" label="Mensajes">
            <MessageCircle className="h-5 w-5" />
          </IconLink>

          {sesion ? (
            <div className="relative ml-1 flex items-center gap-1">
              <Link
                href="/dashboard"
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white transition hover:opacity-90"
                style={{ backgroundColor: sesion.avatarColor ?? "#1F4D2C" }}
                aria-label="Dashboard"
                title={sesion.nombre}
              >
                {sesion.iniciales}
              </Link>
              <button
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                className="flex h-8 w-8 items-center justify-center rounded-full text-moorcado-gray-dark/60 hover:bg-moorcado-gray-light hover:text-moorcado-gray-dark"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="ml-1 hidden items-center gap-1.5 sm:flex">
              <Link
                href="/login"
                className="rounded-full px-3.5 py-2 text-sm font-medium text-moorcado-gray-dark hover:bg-moorcado-gray-light"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="rounded-full bg-moorcado-green px-3.5 py-2 text-sm font-semibold text-white hover:bg-moorcado-green/90"
              >
                Registrarse
              </Link>
            </div>
          )}

          {sesion && (
            <Link
              href="/dashboard"
              aria-label="Dashboard"
              className="hidden items-center gap-1.5 rounded-full border border-black/10 px-3 py-2 text-sm font-medium text-moorcado-gray-dark hover:bg-moorcado-gray-light sm:flex lg:hidden"
            >
              <LayoutDashboard className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      <div className="border-t border-black/5 px-4 pb-3 pt-2 md:hidden">
        <label className="flex items-center gap-2 rounded-full bg-moorcado-gray-light px-4 py-2.5">
          <Search className="h-4 w-4 text-moorcado-gray-dark/60" />
          <input
            type="text"
            placeholder="Buscar ganado..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-moorcado-gray-dark/50"
          />
        </label>
      </div>
    </header>
  );
}

function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-moorcado-gray-dark transition hover:bg-moorcado-gray-light"
    >
      {children}
    </Link>
  );
}
