/**
 * Motor de valoración de precio de ganado.
 * Simula un análisis de IA con fórmula determinista.
 * En producción, este módulo se conectaría a la API de Groq
 * enviando los parámetros del animal como contexto al modelo.
 *
 * Calibración (jul 2026): la tabla anterior subvaluaba sistemáticamente —
 * un animal publicado en L30,000 podía salir estimado en menos de la mitad.
 * Dos causas: (1) los L/kg base estaban ~30% por debajo del mercado real
 * hondureño, y (2) la fórmula ignoraba `tipo` (leche/carne/doble/
 * reproductor), tratando todo como carne pura por peso — pero un animal
 * lechero o reproductor vale mucho más que su peso en carne, por la
 * producción/genética futura que representa. Se recalibró con dos fuentes:
 *   a) Precio de carne al público en Honduras (~95-98 L/lb ≈ 209-216 L/kg
 *      en pie de venta al consumidor a jul 2026) descontado por rendimiento
 *      en canal (~45-55%), que da un ancla de referencia de ganado en pie
 *      tipo carne de ~95-115 L/kg.
 *   b) Los anuncios activos ya publicados en Moorcado: el promedio real de
 *      L/kg por tipo (carne ≈110, doble ≈121, leche ≈151) — leche vale
 *      ~38% más que carne, y doble ~10% más, lo que fija los multiplicadores
 *      de `MULTIPLICADOR_TIPO` de abajo.
 */
import type { TipoGanado, ValoracionResult } from "./types";

// Precio base por kg para un animal tipo "carne" (L/kg) — el resto de tipos
// se ajusta con MULTIPLICADOR_TIPO.
const PRECIO_POR_KG: Record<string, number> = {
  Angus: 130,
  Simmental: 125,
  Holstein: 120,
  Brangus: 118,
  "Pardo Suizo": 115,
  Brahman: 110,
  Jersey: 108,
  Gyr: 105,
  Indubrasil: 100,
  Criollo: 92,
  // fallback para razas no listadas
  _default: 105,
};

// Un animal de leche o doble propósito no se compra por su peso en carne:
// se compra por la producción (o potencial reproductivo) que representa.
// Calibrado contra el promedio real L/kg de los anuncios activos de Moorcado
// por tipo (ver comentario de arriba).
const MULTIPLICADOR_TIPO: Record<TipoGanado, number> = {
  carne: 1,
  doble: 1.12,
  leche: 1.35,
  reproductor: 1.55,
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
  tipo,
  registroSag = false,
  registroGenealogico = false,
  produccionLitrosDia,
  comparablesPlataforma = [],
}: {
  raza: string;
  pesoKg: number;
  edadMeses: number;
  /** leche/carne/doble/reproductor — sin esto se asume "carne" (peso puro). */
  tipo?: TipoGanado;
  /** Animal con registro SAG — trazabilidad que el comprador paga de más. */
  registroSag?: boolean;
  /** Tiene padre/madre/registro genealógico documentado. */
  registroGenealogico?: boolean;
  /** Producción diaria en litros, si aplica (leche/doble). */
  produccionLitrosDia?: number;
  /**
   * L/kg (precio ÷ peso) de anuncios activos comparables ya publicados en
   * Moorcado (misma raza y tipo) — el "estándar de la plataforma" que
   * pidió el usuario: si hay suficientes anuncios reales para comparar, el
   * estimado se ajusta hacia lo que la gente está cobrando de verdad en
   * vez de depender solo de la tabla fija de abajo.
   */
  comparablesPlataforma?: number[];
}): ValoracionResult {
  let precioPorKg = PRECIO_POR_KG[raza] ?? PRECIO_POR_KG._default;
  precioPorKg *= tipo ? MULTIPLICADOR_TIPO[tipo] : 1;
  if (registroSag) precioPorKg *= 1.06;
  if (registroGenealogico) precioPorKg *= 1.08;
  if (produccionLitrosDia && produccionLitrosDia > 0 && (tipo === "leche" || tipo === "doble")) {
    precioPorKg *= Math.min(1.15, 1 + produccionLitrosDia * 0.01);
  }

  // Mínimo de 3 comparables para no dejar que uno o dos anuncios atípicos
  // (ej. un ternero recién nacido con precio "de arranque") muevan el
  // estimado — con suficiente muestra, se promedia 70% fórmula / 30%
  // mercado real de la plataforma.
  if (comparablesPlataforma.length >= 3) {
    const promedioPlataforma =
      comparablesPlataforma.reduce((suma, r) => suma + r, 0) / comparablesPlataforma.length;
    precioPorKg = precioPorKg * 0.7 + promedioPlataforma * 0.3;
  }

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
