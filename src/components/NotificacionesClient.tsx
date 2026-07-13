"use client";

import { useEffect, useState } from "react";
import {
  Ban,
  Bell,
  FileWarning,
  Gavel,
  Heart,
  MessageCircle,
  RefreshCw,
  ShieldOff,
  Sparkles,
  Syringe,
  ThumbsDown,
} from "lucide-react";
import type { NotificacionItem } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { PantallaCargando } from "@/components/Spinner";

const ICONOS: Record<NotificacionItem["tipo"], typeof Bell> = {
  mensaje: MessageCircle,
  animal_similar: Sparkles,
  favorito: Heart,
  vacuna: Syringe,
  promocion: Sparkles,
  renovacion: RefreshCw,
  reporte_resuelto: FileWarning,
  publicacion_retirada: Ban,
  apelacion_aceptada: Gavel,
  apelacion_rechazada: ThumbsDown,
  cuenta_suspendida: ShieldOff,
};

export default function NotificacionesClient() {
  const { sesion, loading } = useAuthGuard();
  const notificaciones = useAppStore((s) => s.notificaciones);
  const cargarNotificaciones = useAppStore((s) => s.cargarNotificaciones);
  const marcarNotificacionLeida = useAppStore((s) => s.marcarNotificacionLeida);
  const marcarTodasNotificacionesLeidas = useAppStore((s) => s.marcarTodasNotificacionesLeidas);
  const [filtro, setFiltro] = useState<"todas" | "no_leidas">("todas");

  useEffect(() => {
    if (sesion) void cargarNotificaciones();
  }, [sesion, cargarNotificaciones]);

  if (loading || !sesion) {
    return (
      <PantallaCargando color="gris" />
    );
  }

  const visibles = notificaciones.filter((n) => filtro === "todas" || !n.leida);
  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-moorcado-gray-dark">
          Notificaciones
        </h1>
        {noLeidas > 0 && (
          <button
            onClick={() => void marcarTodasNotificacionesLeidas()}
            className="text-sm font-semibold text-moorcado-green"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        {(["todas", "no_leidas"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              filtro === f
                ? "bg-moorcado-green text-white"
                : "bg-white text-moorcado-gray-dark ring-1 ring-black/10"
            }`}
          >
            {f === "todas" ? "Todas" : `No leídas (${noLeidas})`}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-2">
        {visibles.length === 0 && (
          <p className="rounded-2xl bg-white p-8 text-center text-sm text-moorcado-gray-dark/50 shadow-sm ring-1 ring-black/5">
            No tienes notificaciones aquí.
          </p>
        )}
        {visibles.map((n) => {
          const Icon = ICONOS[n.tipo];
          return (
            <button
              key={n.id}
              onClick={() => void marcarNotificacionLeida(n.id)}
              className={`flex w-full items-start gap-3 rounded-2xl p-4 text-left shadow-sm ring-1 ring-black/5 transition ${
                n.leida ? "bg-white" : "bg-moorcado-green/5"
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-moorcado-green/10 text-moorcado-green">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-moorcado-gray-dark">
                  {n.titulo}
                </p>
                <p className="text-sm text-moorcado-gray-dark/60">{n.descripcion}</p>
                <p className="mt-1 text-xs text-moorcado-gray-dark/40">
                  {new Date(n.hora).toLocaleString("es-HN")}
                </p>
              </div>
              {!n.leida && (
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-moorcado-green" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
