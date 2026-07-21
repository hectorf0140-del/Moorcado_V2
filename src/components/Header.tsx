"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  MessageCircle,
  Search,
  Plus,
  LogOut,
  LayoutDashboard,
  User,
  Store,
} from "lucide-react";
import Logo from "./Logo";
import { useAppStore } from "@/store/useAppStore";

const navLinksBase = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/mapa", label: "Mapa" },
  { href: "/solicitudes", label: "Busco Ganado" },
];

// En estas rutas el formulario es el único propósito de la pantalla — el
// buscador de ganado del header solo distrae del inicio de sesión/registro.
const RUTAS_SIN_BUSCADOR = ["/login", "/registro", "/recuperar"];

export default function Header() {
  const pathname = usePathname();
  // Transparente solo en la landing, flotando sobre la foto del hero, y
  // fijo (no absolute) para que siga presente al hacer scroll — en cuanto
  // se pasa el hero se vuelve sólido, con transición suave.
  const esLanding = pathname === "/";
  const [scrolleado, setScrolleado] = useState(false);
  const mostrarClaro = esLanding && !scrolleado;
  const router = useRouter();
  const sesion = useAppStore((s) => s.sesion);
  const usuarios = useAppStore((s) => s.usuarios);
  const logout = useAppStore((s) => s.logout);
  const notificaciones = useAppStore((s) => s.notificaciones);
  const cargarNotificaciones = useAppStore((s) => s.cargarNotificaciones);
  const mensajes = useAppStore((s) => s.mensajes);
  const cargarBandejaMensajes = useAppStore((s) => s.cargarBandejaMensajes);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    if (!esLanding) return;
    const onScroll = () => setScrolleado(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [esLanding]);

  function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    const q = busqueda.trim();
    router.push(q ? `/catalogo?q=${encodeURIComponent(q)}` : "/catalogo");
  }

  useEffect(() => {
    if (!sesion) return;
    void cargarNotificaciones();
    void cargarBandejaMensajes();
    const id = setInterval(() => {
      void cargarNotificaciones();
      void cargarBandejaMensajes();
    }, 15000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesion?.usuarioId]);

  const notificacionesSinLeer = sesion ? notificaciones.filter((n) => !n.leida).length : 0;
  const mensajesSinLeer = sesion
    ? Object.values(mensajes).reduce(
        (total, hilo) =>
          total +
          hilo.filter((m) => m.destinatarioId === sesion.usuarioId && m.leido === false).length,
        0
      )
    : 0;
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
    setMenuAbierto(false);
    logout();
    router.push("/");
  }

  return (
    <header
      className={
        esLanding
          ? `fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
              scrolleado
                ? "border-b border-black/5 bg-white/95 backdrop-blur"
                : "bg-transparent"
            }`
          : "sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur"
      }
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Logo light={mostrarClaro} />

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                mostrarClaro
                  ? pathname === link.href
                    ? "bg-white/15 text-white"
                    : "text-white/85 hover:bg-white/10"
                  : pathname === link.href
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
          <IconLink href="/notificaciones" label="Notificaciones" count={notificacionesSinLeer} light={mostrarClaro}>
            <Bell className="h-5 w-5" />
          </IconLink>
          <IconLink href="/mensajes" label="Mensajes" count={mensajesSinLeer} light={mostrarClaro}>
            <MessageCircle className="h-5 w-5" />
          </IconLink>

          {sesion ? (
            <div className="relative ml-1">
              <button
                onClick={() => setMenuAbierto((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white transition hover:opacity-90"
                style={{ backgroundColor: sesion.avatarColor ?? "#1F4D2C" }}
                aria-label="Cuenta"
                aria-expanded={menuAbierto}
                title={sesion.nombre}
              >
                {sesion.iniciales}
              </button>

              {menuAbierto && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuAbierto(false)}
                  />
                  <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl bg-white py-1.5 shadow-lg ring-1 ring-black/10">
                    <div className="border-b border-black/5 px-4 py-2.5">
                      <p className="truncate text-sm font-semibold text-moorcado-gray-dark">
                        {sesion.nombre}
                      </p>
                    </div>
                    <DropdownLink
                      href="/perfil"
                      icon={User}
                      label="Mi perfil"
                      onClick={() => setMenuAbierto(false)}
                    />
                    <DropdownLink
                      href="/dashboard"
                      icon={LayoutDashboard}
                      label="Dashboard"
                      onClick={() => setMenuAbierto(false)}
                    />
                    <DropdownLink
                      href="/dashboard/vendedor"
                      icon={Store}
                      label="Panel de vendedor"
                      onClick={() => setMenuAbierto(false)}
                    />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="ml-1 hidden items-center gap-1.5 sm:flex">
              <Link
                href="/login"
                className={`rounded-full px-3.5 py-2 text-sm font-medium ${
                  mostrarClaro
                    ? "text-white hover:bg-white/10"
                    : "text-moorcado-gray-dark hover:bg-moorcado-gray-light"
                }`}
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
        </div>
      </div>

      {!RUTAS_SIN_BUSCADOR.includes(pathname ?? "") && (
        <form onSubmit={handleBuscar} className="border-t border-black/5 px-4 pb-3 pt-2 md:hidden">
          <label className="flex items-center gap-2 rounded-full bg-moorcado-gray-light px-4 py-2.5">
            <Search className="h-4 w-4 text-moorcado-gray-dark/60" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar ganado..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-moorcado-gray-dark/50"
            />
          </label>
        </form>
      )}
    </header>
  );
}

function IconLink({
  href,
  label,
  children,
  count,
  light = false,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  count?: number;
  light?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`relative flex h-9 w-9 items-center justify-center rounded-full transition ${
        light ? "text-white hover:bg-white/10" : "text-moorcado-gray-dark hover:bg-moorcado-gray-light"
      }`}
    >
      {children}
      {Boolean(count) && count! > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
          {count! > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

function DropdownLink({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: typeof User;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-moorcado-gray-dark hover:bg-moorcado-gray-light"
    >
      <Icon className="h-4 w-4 text-moorcado-gray-dark/60" />
      {label}
    </Link>
  );
}
