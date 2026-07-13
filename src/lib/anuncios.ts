import type { Anuncio } from "./types";

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
