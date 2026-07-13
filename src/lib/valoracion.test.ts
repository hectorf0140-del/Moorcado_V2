import fc from "fast-check";
import { calcularValoracion } from "./valoracion";

describe("calcularValoracion", () => {
  it("da confianza Alta para una raza conocida", () => {
    const r = calcularValoracion({ raza: "Holstein", pesoKg: 400, edadMeses: 24 });
    expect(r.confianza).toBe("Alta");
  });

  it("da confianza Media y usa el precio de fallback para una raza desconocida", () => {
    const conocida = calcularValoracion({ raza: "_default", pesoKg: 400, edadMeses: 24 });
    const desconocida = calcularValoracion({ raza: "Raza Inventada", pesoKg: 400, edadMeses: 24 });
    expect(desconocida.confianza).toBe("Media");
    expect(desconocida.estimado).toBe(conocida.estimado);
  });

  it("penaliza animales muy jóvenes frente a un adulto del mismo peso", () => {
    const joven = calcularValoracion({ raza: "Angus", pesoKg: 300, edadMeses: 4 });
    const adulto = calcularValoracion({ raza: "Angus", pesoKg: 300, edadMeses: 36 });
    expect(joven.estimado).toBeLessThan(adulto.estimado);
  });

  it("el rango siempre contiene el estimado, redondeado a centenas", () => {
    const r = calcularValoracion({ raza: "Brahman", pesoKg: 350, edadMeses: 30 });
    expect(r.estimado % 100).toBe(0);
    expect(r.rangoMin % 100).toBe(0);
    expect(r.rangoMax % 100).toBe(0);
    expect(r.rangoMin).toBeLessThanOrEqual(r.estimado);
    expect(r.rangoMax).toBeGreaterThanOrEqual(r.estimado);
  });

  it("propiedad: para cualquier peso/edad razonable, rangoMin <= estimado <= rangoMax", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          "Holstein",
          "Jersey",
          "Pardo Suizo",
          "Brahman",
          "Gyr",
          "Brangus",
          "Angus",
          "Simmental",
          "Indubrasil",
          "Criollo",
          "Raza sin listar"
        ),
        fc.integer({ min: 30, max: 1200 }),
        fc.integer({ min: 0, max: 180 }),
        (raza, pesoKg, edadMeses) => {
          const r = calcularValoracion({ raza, pesoKg, edadMeses });
          expect(r.rangoMin).toBeLessThanOrEqual(r.estimado);
          expect(r.rangoMax).toBeGreaterThanOrEqual(r.estimado);
          expect(r.estimado).toBeGreaterThanOrEqual(0);
        }
      )
    );
  });
});
