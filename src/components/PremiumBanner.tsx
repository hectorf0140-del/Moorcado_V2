"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

/**
 * Recordatorio persistente para cuentas Empresa sin Premium — no bloquea
 * nada (Premium sigue siendo opcional), pero se muestra en todo el sitio
 * hasta que la cuenta se suscriba o cierre el aviso. Cerrarlo solo lo oculta
 * por esta visita (vive en estado de componente, no en localStorage): al
 * volver a entrar reaparece, para que sea un recordatorio real y no algo
 * que se cierra una vez y se olvida para siempre.
 */
export default function PremiumBanner() {
  const sesion = useAppStore((s) => s.sesion);
  const usuarios = useAppStore((s) => s.usuarios);
  const pathname = usePathname();
  const [cerrado, setCerrado] = useState(false);

  const usuario = sesion ? usuarios.find((u) => u.id === sesion.usuarioId) : undefined;
  const debeMostrarse =
    !cerrado && !!usuario && usuario.tipo === "empresa" && usuario.plan !== "premium" && pathname !== "/planes";

  if (!debeMostrarse) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 bg-moorcado-gold px-4 py-2 text-center text-sm font-semibold text-white">
      <span className="flex items-center gap-1.5">
        <Crown className="h-4 w-4 shrink-0" />
        Tu cuenta Empresa aún no tiene Premium — desbloquea Rumi, registro SAG y prioridad en
        búsquedas.
      </span>
      <Link href="/planes" className="underline underline-offset-2 hover:no-underline">
        Ver planes
      </Link>
      <button
        onClick={() => setCerrado(true)}
        aria-label="Cerrar aviso"
        className="ml-1 rounded-full p-0.5 hover:bg-white/20"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
