"use client";

import { useState } from "react";
import { Check, X, HandCoins, Sparkles } from "lucide-react";
import type { MensajeChat } from "@/lib/mensajesDb";
import type { PlanId } from "@/lib/types";
import { calcularComision, porcentajeComision } from "@/lib/comision";
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
 * la comisión ni la sugerencia de IA en vez de adivinar. Ambas también
 * se ocultan por completo si quien mira no es el vendedor (`esVendedor`).
 */
export default function OfertaBubble({
  mensaje,
  esMio,
  plan,
  precioPedido,
  raza,
  esVendedor,
  onResponder,
  respondiendo,
}: {
  mensaje: MensajeChat;
  esMio: boolean;
  plan: PlanId | null;
  precioPedido?: number;
  raza?: string;
  /** Solo el vendedor ve la comisión y la sugerencia de IA — al comprador no le concierne. */
  esVendedor: boolean;
  onResponder?: (respuesta: "aceptada" | "rechazada") => void;
  respondiendo?: boolean;
}) {
  const [sugerencia, setSugerencia] = useState<string | null>(null);
  const [cargandoSugerencia, setCargandoSugerencia] = useState(false);
  const [errorSugerencia, setErrorSugerencia] = useState(false);

  const monto = mensaje.ofertaMonto ?? 0;
  const estado = mensaje.ofertaEstado ?? "pendiente";
  const puedeResponder = !esMio && estado === "pendiente" && onResponder;
  const comisionVendedor = esVendedor && plan ? calcularComision(monto, plan) : null;
  const porcentaje = plan ? porcentajeComision(plan) : null;

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

      {comisionVendedor !== null && porcentaje !== null && (
        <p className={`mt-1 text-xs ${esMio ? "text-white/75" : "text-moorcado-gray-dark/60"}`}>
          Comisión Moorcado ({(porcentaje * 100).toLocaleString("es-HN")}%):{" "}
          {formatLempiras(comisionVendedor)} · te quedarían{" "}
          {formatLempiras(monto - comisionVendedor)}
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

      {estado === "pendiente" && esVendedor && plan && precioPedido ? (
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
              {cargandoSugerencia ? "Consultando..." : "¿Me conviene vender? (consultar IA)"}
            </button>
          )}
          {errorSugerencia && (
            <p className="mt-1 text-[11px] text-red-500">
              No se pudo consultar a la IA.{" "}
              <button
                type="button"
                onClick={pedirSugerencia}
                className="font-semibold underline"
              >
                Reintentar
              </button>
            </p>
          )}
        </div>
      ) : null}

      {puedeResponder && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={respondiendo}
            onClick={() => onResponder("aceptada")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-moorcado-green py-2 text-xs font-bold text-white shadow-sm transition hover:bg-moorcado-green/90 active:scale-[0.97] disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            Aceptar
          </button>
          <button
            type="button"
            disabled={respondiendo}
            onClick={() => onResponder("rechazada")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full border-2 border-red-200 bg-white py-2 text-xs font-bold text-red-600 shadow-sm transition hover:border-red-300 hover:bg-red-50 active:scale-[0.97] disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            Rechazar
          </button>
        </div>
      )}
    </div>
  );
}
