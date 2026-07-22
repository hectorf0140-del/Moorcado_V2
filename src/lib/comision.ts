import type { PlanId } from "./types";

/**
 * Misma política ya publicada en el chat de soporte (src/lib/mooe.ts):
 * 2.5% en los planes Gratuito/Básico, 2% en Premium — un incentivo real
 * para pagar el plan, no solo un número distinto porque sí.
 */
export function porcentajeComision(plan: PlanId): number {
  return plan === "premium" ? 0.02 : 0.025;
}

/** Comisión sobre el monto negociado (la oferta), no sobre el precio pedido. */
export function calcularComision(monto: number, plan: PlanId): number {
  return Math.round(monto * porcentajeComision(plan));
}
