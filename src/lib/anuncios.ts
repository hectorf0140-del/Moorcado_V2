import type { Anuncio, TipoGanado } from "./types";

/**
 * Un anuncio cuenta como "visible" (catálogo, mapa, inicio, favoritos,
 * relacionados) si sigue disponible para comprar: no vendido, no en
 * negociación, y no pausado/retirado (`activo === false` cubre tanto la
 * pausa del propio vendedor como el retiro por moderación). Antes cada
 * pantalla repetía esta misma condición por su cuenta — cuando alguna la
 * olvidaba (ej. "Mis favoritos" del comprador) volvían a aparecer animales
 * ya vendidos o retirados.
 */
export function esAnuncioVisible(anuncio: Anuncio): boolean {
  return anuncio.activo !== false && !anuncio.vendido && !anuncio.enNegociacion;
}

export function anunciosVisibles(anuncios: Anuncio[]): Anuncio[] {
  return anuncios.filter(esAnuncioVisible);
}

/** "lechero"/"cárnico"/"doble propósito"/"reproductor" (form) → tipo de Animal. */
export function tipoDesdeProposito(proposito: Anuncio["proposito"]): TipoGanado {
  if (proposito === "lechero") return "leche";
  if (proposito === "cárnico") return "carne";
  if (proposito === "reproductor") return "reproductor";
  return "doble";
}

/**
 * L/kg (precio ÷ peso) de anuncios comparables ya publicados en Moorcado —
 * misma raza y tipo, visibles, con peso real (se excluyen crías muy
 * livianas para no distorsionar el promedio con precios "de arranque").
 * Es el insumo de `comparablesPlataforma` de calcularValoracion(): el
 * "estándar de mercado de la plataforma" para ese tipo de ganado.
 */
export function comparablesPrecioPorKg(
  anuncios: Anuncio[],
  raza: string,
  tipo: TipoGanado,
  excluirId?: string
): number[] {
  return anuncios
    .filter(
      (a) =>
        a.id !== excluirId &&
        a.raza === raza &&
        a.tipo === tipo &&
        a.pesoKg >= 150 &&
        a.precio > 0 &&
        esAnuncioVisible(a)
    )
    .map((a) => a.precio / a.pesoKg);
}
