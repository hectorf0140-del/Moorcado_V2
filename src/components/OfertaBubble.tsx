"use client";

import { useState } from "react";
import { Check, X, HandCoins, Sparkles } from "lucide-react";
import type { MensajeChat } from "@/lib/mensajesDb";
import type { PlanId } from "@/lib/types";
import { calcularComision } from "@/lib/comision";
import { formatLempiras } from "@/lib/format";

const ETIQUETA_ESTADO: Record<NonNullable<MensajeChat["ofertaEstado"]>, string> = {
  pendiente: "Pendiente",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  superada: "Superada por una oferta más nueva",
};

/**
 * Burbuja de oferta dentro del chat (ChatPanel y MensajesClient la
 * comparten). `plan` es el plan del vendedor del anuncio — si no se
 * conoce (no siempre está a mano en la bandeja general) no se muestra
 * la comisión ni la sugerencia de IA en vez de adivinar.
 */
export default function OfertaBubble({
  mensaje,
  esMio,
  plan,
  precioPedido,
  raza,
  onResponder,
  respondiendo,
}: {
  mensaje: MensajeChat;
  esMio: boolean;
  plan: PlanId | null;
  precioPedido?: number;
  raza?: string;
  onResponder?: (respuesta: "aceptada" | "rechazada") => void;
  respondiendo?: boolean;
}) {
  const [sugerencia, setSugerencia] = useState<string | null>(null);
  const [cargandoSugerencia, setCargandoSugerencia] = useState(false);
  const [errorSugerencia, setErrorSugerencia] = useState(false);

  const monto = mensaje.ofertaMonto ?? 0;
  const estado = mensaje.ofertaEstado ?? "pendiente";
  const puedeResponder = !esMio && estado === "pendiente" && onResponder;
  const comisionVendedor = plan ? calcularComision(monto, plan) : null;

  async function pedirSugerencia() {
    if (!plan || !precioPedido || cargandoSugerencia) return;
    setCargandoSugerencia(true);
    setErrorSugerencia(false);
    try {
      const resp = await fetch("/api/sugerencia-oferta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ precioPedido, ofertaMonto: monto, plan, raza }),
      });
      const data = (await resp.json()) as { ok: boolean; sugerencia?: string };
      if (data.ok && data.sugerencia) {
        setSugerencia(data.sugerencia);
      } else {
        setErrorSugerencia(true);
      }
    } catch {
      setErrorSugerencia(true);
    } finally {
      setCargandoSugerencia(false);
    }
  }

  return (
    <div
      className={`w-64 max-w-full rounded-2xl border p-3 text-sm ${
        esMio
          ? "border-white/20 bg-moorcado-green text-white"
          : "border-black/10 bg-white text-moorcado-gray-dark"
      }`}
    >
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide opacity-80">
        <HandCoins className="h-3.5 w-3.5" />
        Oferta
      </div>
      <p className="mt-1 font-display text-lg font-bold">{formatLempiras(monto)}</p>

      {comisionVendedor !== null && (
        <p className={`mt-1 text-xs ${esMio ? "text-white/75" : "text-moorcado-gray-dark/60"}`}>
          Comisión Moorcado: {formatLempiras(comisionVendedor)} · le quedarían{" "}
          {formatLempiras(monto - comisionVendedor)} al vendedor
        </p>
      )}

      <p
        className={`mt-1.5 text-xs font-medium ${
          estado === "aceptada"
            ? esMio
              ? "text-white"
              : "text-moorcado-green"
            : estado === "rechazada"
              ? esMio
                ? "text-white/70"
                : "text-red-600"
              : esMio
                ? "text-white/70"
                : "text-moorcado-gray-dark/50"
        }`}
      >
        {ETIQUETA_ESTADO[estado]}
      </p>

      {estado === "pendiente" && plan && precioPedido ? (
        <div className={`mt-2 rounded-xl p-2 ${esMio ? "bg-black/10" : "bg-moorcado-gray-light"}`}>
          {sugerencia ? (
            <p className={`text-xs ${esMio ? "text-white/90" : "text-moorcado-gray-dark/80"}`}>
              <Sparkles className="mr-1 inline h-3 w-3" />
              {sugerencia}
            </p>
          ) : (
            <button
              type="button"
              onClick={pedirSugerencia}
              disabled={cargandoSugerencia}
              className={`flex items-center gap-1.5 text-xs font-semibold ${
                esMio ? "text-white/90" : "text-moorcado-green"
              } disabled:opacity-50`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {cargandoSugerencia ? "Pensando..." : "Sugerencia IA"}
            </button>
          )}
          {errorSugerencia && (
            <p className="mt-1 text-[11px] text-red-500">No se pudo pedir la sugerencia.</p>
          )}
        </div>
      ) : null}

      {puedeResponder && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={respondiendo}
            onClick={() => onResponder("aceptada")}
            className="flex flex-1 items-center justify-center gap-1 rounded-full bg-moorcado-green py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            Aceptar
          </button>
          <button
            type="button"
            disabled={respondiendo}
            onClick={() => onResponder("rechazada")}
            className="flex flex-1 items-center justify-center gap-1 rounded-full bg-moorcado-gray-light py-1.5 text-xs font-semibold text-moorcado-gray-dark disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
            Rechazar
          </button>
        </div>
      )}
    </div>
  );
}
