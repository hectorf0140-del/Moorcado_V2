"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Crown } from "lucide-react";
import type { PlanId } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import PagoPlanModal from "@/components/PagoPlanModal";

const planes: {
  id: PlanId;
  nombre: string;
  precio: string;
  periodo: string;
  descripcion: string;
  beneficios: string[];
  destacado: boolean;
  soloEmpresa?: boolean;
}[] = [
  {
    id: "gratuito",
    nombre: "Gratuito",
    precio: "L. 0",
    periodo: "/siempre",
    descripcion: "Para empezar a vender sin costo.",
    beneficios: ["5 publicaciones", "Chat con compradores", "Favoritos"],
    destacado: false,
  },
  {
    id: "basico",
    nombre: "Básico",
    precio: "L. 349",
    periodo: "/mes",
    descripcion: "Para ganaderos que venden con frecuencia.",
    beneficios: [
      "Publicaciones ilimitadas",
      "Estadísticas de tus publicaciones",
      "IA para recomendaciones",
    ],
    destacado: false,
  },
  {
    id: "premium",
    nombre: "Premium",
    precio: "L. 799",
    periodo: "/mes",
    descripcion: "La experiencia completa de Moorcado — exclusivo para cuentas Empresa.",
    beneficios: [
      "Todo lo del plan Básico",
      "Gestión del hato con Rumi",
      "Registro SAG y trazabilidad",
      "Búsquedas guardadas con alerta",
      "Prioridad en resultados de búsqueda",
      "Rumi Pro disponible como add-on (veterinarios, historial médico)",
    ],
    destacado: true,
    soloEmpresa: true,
  },
];

const PLANES_VALIDOS: PlanId[] = ["gratuito", "basico", "premium"];

export default function PlanesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sesion = useAppStore((s) => s.sesion);
  const usuarios = useAppStore((s) => s.usuarios);
  const actualizarUsuario = useAppStore((s) => s.actualizarUsuario);
  const [planAPagar, setPlanAPagar] = useState<PlanId | null>(null);

  const usuarioActual = sesion ? usuarios.find((u) => u.id === sesion.usuarioId) : undefined;

  // Si venimos de "Elegir plan" antes de tener cuenta (registro?plan=X), al
  // volver aquí ya logueados se abre el cobro directo para ese plan, en vez
  // de otorgarlo gratis. Se procesa una sola vez (no en un efecto ligado a
  // `usuarioActual`, que cambia de referencia en cada sincronización de
  // fondo y volvería a abrir el modal ya cerrado por el usuario).
  const [planParamProcesado, setPlanParamProcesado] = useState(false);
  if (sesion && usuarioActual && !planParamProcesado) {
    setPlanParamProcesado(true);
    const planParam = searchParams.get("plan");
    if (
      planParam &&
      PLANES_VALIDOS.includes(planParam as PlanId) &&
      planParam !== "gratuito" &&
      !(planParam === "premium" && usuarioActual.tipo !== "empresa")
    ) {
      setPlanAPagar(planParam as PlanId);
    }
  }

  async function aplicarPlan(planId: PlanId) {
    if (!usuarioActual) return;
    // La regla "Premium solo para empresa" ya no es solo de UI: activar_plan
    // (RPC) la valida server-side y rechaza el cambio si no se cumple.
    const { activarPlanDb } = await import("@/lib/usuariosDb");
    const ok = await activarPlanDb(planId);
    if (!ok) return;
    actualizarUsuario({ ...usuarioActual, plan: planId });
  }

  function handleElegir(planId: PlanId) {
    if (!sesion) {
      router.push(`/registro?plan=${planId}`);
      return;
    }
    if (!usuarioActual) {
      router.push("/perfil");
      return;
    }
    if (planId === usuarioActual.plan) return;
    if (planId === "premium" && usuarioActual.tipo !== "empresa") return;

    // Bajar a gratuito no cuesta nada — no hace falta cobrar. Cualquier
    // otro plan (nuevo o distinto) pasa primero por el cobro simulado.
    if (planId === "gratuito") {
      void aplicarPlan(planId);
      return;
    }
    setPlanAPagar(planId);
  }

  async function handleConfirmarPago() {
    if (!planAPagar) return;
    await aplicarPlan(planAPagar);
    setPlanAPagar(null);
    router.push("/perfil");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-moorcado-gray-dark">
          Elige tu plan
        </h1>
        <p className="mt-2 text-moorcado-gray-dark/60">
          Impulsa tus ventas y gestiona tu hato con las herramientas
          adecuadas.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {planes.map((plan) => {
          const bloqueadoPorTipo =
            !!plan.soloEmpresa && !!sesion && !!usuarioActual && usuarioActual.tipo !== "empresa";
          return (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-3xl bg-white p-7 shadow-sm ring-1 ${
              plan.destacado
                ? "ring-2 ring-moorcado-gold sm:-translate-y-3"
                : "ring-black/5"
            }`}
          >
            {plan.destacado && (
              <span className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-moorcado-gold px-3.5 py-1.5 text-xs font-bold text-white shadow">
                <Crown className="h-3.5 w-3.5" />
                Más popular
              </span>
            )}
            <h2 className="font-display text-xl font-bold text-moorcado-gray-dark">
              {plan.nombre}
            </h2>
            <p className="mt-1 text-sm text-moorcado-gray-dark/60">
              {plan.descripcion}
            </p>
            <p className="mt-5">
              <span className="font-display text-3xl font-extrabold text-moorcado-gray-dark">
                {plan.precio}
              </span>
              <span className="text-sm text-moorcado-gray-dark/50">
                {plan.periodo}
              </span>
            </p>

            <ul className="mt-6 flex-1 space-y-3">
              {plan.beneficios.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-moorcado-gray-dark/80">
                  <Check
                    className={`mt-0.5 h-4 w-4 shrink-0 ${
                      plan.destacado ? "text-moorcado-gold" : "text-moorcado-green"
                    }`}
                  />
                  {b}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleElegir(plan.id)}
              disabled={usuarioActual?.plan === plan.id || bloqueadoPorTipo}
              className={`mt-7 w-full rounded-full py-3 text-sm font-bold transition disabled:opacity-50 ${
                plan.destacado
                  ? "bg-moorcado-gold text-white hover:brightness-105"
                  : "bg-moorcado-green text-white hover:bg-moorcado-green/90"
              }`}
            >
              {usuarioActual?.plan === plan.id
                ? "Tu plan actual"
                : bloqueadoPorTipo
                  ? "Solo para cuentas Empresa"
                  : sesion
                    ? plan.id === "gratuito"
                      ? "Cambiar a este plan"
                      : "Pagar y cambiar"
                    : plan.id === "gratuito"
                      ? "Comenzar gratis"
                      : "Elegir plan"}
            </button>
            {bloqueadoPorTipo && (
              <p className="mt-2 text-center text-xs text-moorcado-gray-dark/50">
                Tu cuenta es tipo {usuarioActual?.tipo}. Este plan requiere una cuenta Empresa.
              </p>
            )}
          </div>
          );
        })}
      </div>

      {planAPagar && (
        <PagoPlanModal
          plan={planAPagar}
          onCancelar={() => setPlanAPagar(null)}
          onConfirmar={handleConfirmarPago}
        />
      )}
    </div>
  );
}
