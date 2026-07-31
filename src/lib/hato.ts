/**
 * Helpers puros de Rumi (hato): ids, cálculo de próxima revisión/última
 * vacuna a partir de las citas reales de un animal (en vez del campo fijo
 * que quedaba pegado a "+45 días del registro"), y el snapshot diario que
 * alimenta la gráfica de tendencia.
 */
import type { AnimalHato, CitaVeterinaria, HatoSnapshot, Usuario } from "./types";

export const ESTADOS_HATO: Record<AnimalHato["estado"], { label: string; cls: string }> = {
  sana: { label: "Sana", cls: "bg-moorcado-green/10 text-moorcado-green" },
  en_tratamiento: { label: "En tratamiento", cls: "bg-red-100 text-red-600" },
  prenada: { label: "Preñada", cls: "bg-moorcado-gold/15 text-moorcado-brown" },
  seca: { label: "Seca", cls: "bg-moorcado-gray-light text-moorcado-gray-dark/70" },
};

export const TIPOS_CITA: Record<CitaVeterinaria["tipo"], string> = {
  revision: "Revisión general",
  vacuna: "Vacuna",
  desparasitacion: "Desparasitación",
  reproduccion: "Reproducción",
  emergencia: "Emergencia",
  otro: "Otro",
};

function generarId(prefijo: string): string {
  return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function generarIdHato(): string {
  return generarId("h");
}

export function generarIdCita(): string {
  return generarId("c");
}

export function diasHasta(fecha: string): number {
  return Math.round((new Date(fecha).getTime() - Date.now()) / 86_400_000);
}

export function citasPendientesOrdenadas(animal: AnimalHato): CitaVeterinaria[] {
  return (animal.citas ?? [])
    .filter((c) => c.estado === "pendiente")
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
}

export function historialCitasOrdenado(animal: AnimalHato): CitaVeterinaria[] {
  return [...(animal.citas ?? [])].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );
}

/** Próxima revisión: la cita pendiente más cercana; si el animal aún no tiene
 * citas, cae al campo legado; si ya tiene citas pero ninguna pendiente, no hay. */
export function proximaRevisionDe(animal: AnimalHato): string | null {
  const [primeraPendiente] = citasPendientesOrdenadas(animal);
  if (primeraPendiente) return primeraPendiente.fecha;
  if (!animal.citas || animal.citas.length === 0) return animal.proximaRevision || null;
  return null;
}

export function ultimaVacunaCompletadaDe(animal: AnimalHato): string | null {
  const completadas = (animal.citas ?? [])
    .filter((c) => c.estado === "completada" && c.tipo === "vacuna")
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  if (completadas[0]) return completadas[0].fecha;
  if (!animal.citas || animal.citas.length === 0) return animal.ultimaVacuna || null;
  return null;
}

export interface CitaConAnimal {
  animal: AnimalHato;
  cita: CitaVeterinaria;
}

/** Citas pendientes, sin recordatorio enviado, dentro de `dias` días (incluye vencidas). */
export function citasPorRecordar(hato: AnimalHato[], dias: number): CitaConAnimal[] {
  const resultado: CitaConAnimal[] = [];
  for (const animal of hato) {
    for (const cita of animal.citas ?? []) {
      if (cita.estado === "pendiente" && !cita.recordatorioEnviado && diasHasta(cita.fecha) <= dias) {
        resultado.push({ animal, cita });
      }
    }
  }
  return resultado;
}

export interface TendenciaValor {
  actual: number;
  hace30Dias: number | null;
  cambioPct: number | null;
}

/** Compara el valor total actual del hato contra el snapshot más cercano a 30 días atrás. */
export function tendenciaValorHato(historial: HatoSnapshot[]): TendenciaValor {
  if (historial.length === 0) return { actual: 0, hace30Dias: null, cambioPct: null };
  const ordenado = [...historial].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const actual = ordenado[ordenado.length - 1].valorTotal;
  const haceUnMes = new Date();
  haceUnMes.setDate(haceUnMes.getDate() - 30);
  const previos = ordenado.filter((s) => new Date(s.fecha).getTime() <= haceUnMes.getTime());
  const hace30Dias = previos.length > 0 ? previos[previos.length - 1].valorTotal : null;
  const cambioPct = hace30Dias ? ((actual - hace30Dias) / hace30Dias) * 100 : null;
  return { actual, hace30Dias, cambioPct };
}

/** Agrega/reemplaza el snapshot de hoy en `hatoHistorial` a partir del hato actual del usuario. */
export function registrarSnapshot(usuario: Usuario): Usuario {
  const hato = usuario.hato ?? [];
  const hoy = new Date().toISOString().split("T")[0];
  const valorTotal = hato.reduce((acc, a) => acc + a.valorEstimado, 0);
  const produccionTotal = hato.reduce((acc, a) => acc + (a.produccionLitrosDia ?? 0), 0);
  const sinHoy = (usuario.hatoHistorial ?? []).filter((s) => s.fecha !== hoy);
  const hatoHistorial = [...sinHoy, { fecha: hoy, valorTotal, produccionTotal, animales: hato.length }]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(-180);
  return { ...usuario, hatoHistorial };
}
