import type { PlanId } from "./types";

/**
 * Comisión plana del 5%, igual para todos los planes. `plan` se mantiene
 * en la firma por compatibilidad con quien la llama (OfertaBubble, la
 * sugerencia de IA) aunque ya no cambie el resultado.
 */
export function porcentajeComision(_plan: PlanId): number {
  return 0.05;
}

/** Comisión sobre el monto negociado (la oferta), no sobre el precio pedido. */
export function calcularComision(monto: number, plan: PlanId): number {
  return Math.round(monto * porcentajeComision(plan));
}
