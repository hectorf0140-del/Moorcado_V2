"use client";

import { useState } from "react";
import {
  Bell,
  Heart,
  MessageCircle,
  RefreshCw,
  Sparkles,
  Syringe,
} from "lucide-react";
import { notificaciones as inicial } from "@/lib/mock-data";
import type { NotificacionItem } from "@/lib/types";

const ICONOS: Record<NotificacionItem["tipo"], typeof Bell> = {
  mensaje: MessageCircle,
  animal_similar: Sparkles,
  favorito: Heart,
  vacuna: Syringe,
  promocion: Sparkles,
  renovacion: RefreshCw,
};

export default function NotificacionesClient() {
  const [items, setItems] = useState<NotificacionItem[]>(inicial);
  const [filtro, setFiltro] = useState<"todas" | "no_leidas">("todas");

  const visibles = items.filter((n) => filtro === "todas" || !n.leida);
  const noLeidas = items.filter((n) => !n.leida).length;

  function marcarLeida(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
  }

  function marcarTodasLeidas() {
    setItems((prev) => prev.map((n) => ({ ...n, leida: true })));
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-moorcado-gray-dark">
          Notificaciones
        </h1>
        {noLeidas > 0 && (
          <button
            onClick={marcarTodasLeidas}
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
              onClick={() => marcarLeida(n.id)}
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
                <p className="mt-1 text-xs text-moorcado-gray-dark/40">{n.hora}</p>
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
