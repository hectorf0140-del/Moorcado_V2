"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid2x2, Plus, MessageCircle, User } from "lucide-react";

const items = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/catalogo", label: "Catálogo", icon: Grid2x2 },
  { href: "/publicar", label: "Publicar", icon: Plus, primary: true },
  { href: "/mensajes", label: "Mensajes", icon: MessageCircle },
  { href: "/perfil", label: "Perfil", icon: User },
];

const RUTAS_SIN_NAV = ["/login", "/registro", "/recuperar"];

export default function MobileNav() {
  const pathname = usePathname();

  if (RUTAS_SIN_NAV.includes(pathname)) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-2">
        {items.map(({ href, label, icon: Icon, primary }) => {
          const active = pathname === href;
          if (primary) {
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-moorcado-green text-white shadow-lg shadow-moorcado-green/30 transition active:scale-95"
              >
                <Icon className="h-6 w-6" strokeWidth={2.4} />
              </Link>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 text-[11px] font-medium ${
                active ? "text-moorcado-green" : "text-moorcado-gray-dark/60"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
