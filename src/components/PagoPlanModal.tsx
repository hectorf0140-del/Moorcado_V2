"use client";

import { useState } from "react";
import { CreditCard, Lock, X } from "lucide-react";
import type { PlanId } from "@/lib/types";

const NOMBRES_PLAN: Record<PlanId, string> = {
  gratuito: "Gratuito",
  basico: "Básico",
  premium: "Premium",
};

const PRECIOS_PLAN: Record<PlanId, string> = {
  gratuito: "L. 0",
  basico: "L. 349/mes",
  premium: "L. 799/mes",
};

function formatearNumeroTarjeta(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatearVencimiento(v: string) {
  const digitos = v.replace(/\D/g, "").slice(0, 4);
  if (digitos.length <= 2) return digitos;
  return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
}

export default function PagoPlanModal({
  plan,
  error,
  onCancelar,
  onConfirmar,
}: {
  plan: PlanId;
  error?: string | null;
  onCancelar: () => void;
  onConfirmar: () => Promise<void>;
}) {
  const [nombreTarjeta, setNombreTarjeta] = useState("");
  const [numeroTarjeta, setNumeroTarjeta] = useState("");
  const [vencimiento, setVencimiento] = useState("");
  const [cvv, setCvv] = useState("");
  const [procesando, setProcesando] = useState(false);

  const numeroValido = numeroTarjeta.replace(/\D/g, "").length === 16;
  const vencimientoValido = /^\d{2}\/\d{2}$/.test(vencimiento);
  const cvvValido = /^\d{3,4}$/.test(cvv);
  const formularioValido =
    nombreTarjeta.trim().length > 2 && numeroValido && vencimientoValido && cvvValido;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formularioValido || procesando) return;
    setProcesando(true);
    // Simula el tiempo de procesamiento de la pasarela de pago — esta app
    // no tiene una integración real (Stripe/PayPal/etc), así que el cobro
    // se simula por completo en el cliente.
    await new Promise((resolve) => setTimeout(resolve, 900));
    await onConfirmar();
    setProcesando(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold text-moorcado-gray-dark">
            <CreditCard className="h-5 w-5 text-moorcado-green" />
            Pagar plan {NOMBRES_PLAN[plan]}
          </h3>
          <button
            type="button"
            onClick={onCancelar}
            aria-label="Cerrar"
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-moorcado-gray-light"
          >
            <X className="h-4 w-4 text-moorcado-gray-dark/60" />
          </button>
        </div>
        <p className="mt-1 text-sm text-moorcado-gray-dark/60">
          {NOMBRES_PLAN[plan]} — {PRECIOS_PLAN[plan]}
        </p>

        <div className="mt-5 space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
              Nombre en la tarjeta
            </span>
            <input
              type="text"
              required
              value={nombreTarjeta}
              onChange={(e) => setNombreTarjeta(e.target.value)}
              placeholder="Como aparece en la tarjeta"
              className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green focus:ring-2 focus:ring-moorcado-green/20"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
              Número de tarjeta
            </span>
            <input
              type="text"
              inputMode="numeric"
              required
              value={numeroTarjeta}
              onChange={(e) => setNumeroTarjeta(formatearNumeroTarjeta(e.target.value))}
              placeholder="1234 5678 9012 3456"
              className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green focus:ring-2 focus:ring-moorcado-green/20"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
                Vencimiento
              </span>
              <input
                type="text"
                inputMode="numeric"
                required
                value={vencimiento}
                onChange={(e) => setVencimiento(formatearVencimiento(e.target.value))}
                placeholder="MM/AA"
                className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green focus:ring-2 focus:ring-moorcado-green/20"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
                CVV
              </span>
              <input
                type="text"
                inputMode="numeric"
                required
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="123"
                className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green focus:ring-2 focus:ring-moorcado-green/20"
              />
            </label>
          </div>
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-xs text-moorcado-gray-dark/50">
          <Lock className="h-3.5 w-3.5" />
          Pago simulado — no se hace ningún cobro real.
        </p>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancelar}
            className="flex-1 rounded-full bg-moorcado-gray-light py-3 text-sm font-bold text-moorcado-gray-dark"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!formularioValido || procesando}
            className="flex-1 rounded-full bg-moorcado-green py-3 text-sm font-bold text-white disabled:opacity-40"
          >
            {procesando ? "Procesando..." : "Confirmar pago"}
          </button>
        </div>
      </form>
    </div>
  );
}
