import type { Anuncio } from "./types";
import { esAnuncioVisible, anunciosVisibles } from "./anuncios";

function anuncio(overrides: Partial<Anuncio>): Anuncio {
  return { id: "a1", activo: true, vendido: false, enNegociacion: false, ...overrides } as Anuncio;
}

describe("esAnuncioVisible", () => {
  it("es visible por defecto (activo, no vendido, no en negociación)", () => {
    expect(esAnuncioVisible(anuncio({}))).toBe(true);
  });

  it("no es visible si está vendido", () => {
    expect(esAnuncioVisible(anuncio({ vendido: true }))).toBe(false);
  });

  it("no es visible si está en negociación", () => {
    expect(esAnuncioVisible(anuncio({ enNegociacion: true }))).toBe(false);
  });

  it("no es visible si activo es false (pausado o retirado por moderación)", () => {
    expect(esAnuncioVisible(anuncio({ activo: false }))).toBe(false);
    expect(esAnuncioVisible(anuncio({ activo: false, retiradoPorModeracion: true }))).toBe(false);
  });
});

describe("anunciosVisibles", () => {
  it("filtra una lista dejando solo los disponibles", () => {
    const lista = [
      anuncio({ id: "disponible" }),
      anuncio({ id: "vendido", vendido: true }),
      anuncio({ id: "negociacion", enNegociacion: true }),
      anuncio({ id: "pausado", activo: false }),
    ];
    expect(anunciosVisibles(lista).map((a) => a.id)).toEqual(["disponible"]);
  });
});
