/**
 * Motor de valoración de precio de ganado.
 * Simula un análisis de IA con fórmula determinista.
 * En producción, este módulo se conectaría a la API de Groq
 * enviando los parámetros del animal como contexto al modelo.
 */
import type { ValoracionResult } from "./types";

// Precio base por kg según raza (L/kg)
const PRECIO_POR_KG: Record<string, number> = {
  Holstein: 95,
  Jersey: 88,
  "Pardo Suizo": 92,
  Brahman: 85,
  Gyr: 83,
  Brangus: 90,
  Angus: 105,
  Simmental: 100,
  Indubrasil: 80,
  Criollo: 72,
  // fallback para razas no listadas
  _default: 85,
};

/**
 * Factor multiplicador por edad.
 * Animales jóvenes (< 12m) o muy viejos (> 72m) tienen descuento.
 */
function getAgeFactor(edadMeses: number): number {
  if (edadMeses < 6) return 0.65;
  if (edadMeses < 12) return 0.8;
  if (edadMeses < 24) return 0.92;
  if (edadMeses <= 48) return 1.0;
  if (edadMeses <= 60) return 0.95;
  return 0.88;
}

/**
 * Redondear al múltiplo de 100 más cercano.
 */
function redondear100(n: number): number {
  return Math.round(n / 100) * 100;
}

export function calcularValoracion({
  raza,
  pesoKg,
  edadMeses,
}: {
  raza: string;
  pesoKg: number;
  edadMeses: number;
}): ValoracionResult {
  const precioPorKg = PRECIO_POR_KG[raza] ?? PRECIO_POR_KG._default;
  const ageFactor = getAgeFactor(edadMeses);
  const estimadoRaw = precioPorKg * pesoKg * ageFactor;
  const estimado = redondear100(estimadoRaw);

  // Rango ±8%
  const rangoMin = redondear100(estimado * 0.92);
  const rangoMax = redondear100(estimado * 1.08);

  // Confianza: Alta si la raza está en la tabla, Media si usó fallback
  const confianza: ValoracionResult["confianza"] =
    raza in PRECIO_POR_KG ? "Alta" : "Media";

  return { estimado, rangoMin, rangoMax, confianza };
}
