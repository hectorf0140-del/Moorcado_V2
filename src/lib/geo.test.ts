import fc from "fast-check";
import {
  HN_BOUNDS,
  UBICACION_REFERENCIA_DEFAULT,
  calcularDistanciaKm,
  coordenadasParaDepartamento,
  coordenadasEfectivas,
} from "./geo";

describe("calcularDistanciaKm", () => {
  it("es 0 para el mismo punto", () => {
    expect(calcularDistanciaKm(14.0723, -87.1921, 14.0723, -87.1921)).toBe(0);
  });

  it("es simétrica", () => {
    const a = { lat: 15.5049, lng: -88.025 }; // Cortés
    const b = { lat: 13.3011, lng: -87.1897 }; // Choluteca
    expect(calcularDistanciaKm(a.lat, a.lng, b.lat, b.lng)).toBe(
      calcularDistanciaKm(b.lat, b.lng, a.lat, a.lng)
    );
  });

  it("da un resultado razonable entre dos ciudades reales de Honduras", () => {
    // Tegucigalpa -> San Pedro Sula, ~180-190 km en línea recta.
    const d = calcularDistanciaKm(14.0723, -87.1921, 15.5049, -88.025);
    expect(d).toBeGreaterThan(150);
    expect(d).toBeLessThan(220);
  });

  it("nunca da negativo ni NaN para coordenadas dentro de Honduras", () => {
    fc.assert(
      fc.property(
        fc.double({ min: HN_BOUNDS.latMin, max: HN_BOUNDS.latMax, noNaN: true }),
        fc.double({ min: HN_BOUNDS.lngMin, max: HN_BOUNDS.lngMax, noNaN: true }),
        fc.double({ min: HN_BOUNDS.latMin, max: HN_BOUNDS.latMax, noNaN: true }),
        fc.double({ min: HN_BOUNDS.lngMin, max: HN_BOUNDS.lngMax, noNaN: true }),
        (lat1, lng1, lat2, lng2) => {
          const d = calcularDistanciaKm(lat1, lng1, lat2, lng2);
          expect(Number.isNaN(d)).toBe(false);
          expect(d).toBeGreaterThanOrEqual(0);
        }
      )
    );
  });
});

describe("coordenadasParaDepartamento", () => {
  it("es determinística: misma semilla da siempre el mismo resultado", () => {
    const a = coordenadasParaDepartamento("Cortés", "anuncio-123");
    const b = coordenadasParaDepartamento("Cortés", "anuncio-123");
    expect(a).toEqual(b);
  });

  it("cae dentro de Honduras para todos los departamentos conocidos", () => {
    const departamentos = [
      "Atlántida",
      "Choluteca",
      "Colón",
      "Comayagua",
      "Copán",
      "Cortés",
      "El Paraíso",
      "Francisco Morazán",
      "Gracias a Dios",
      "Intibucá",
      "Islas de la Bahía",
      "La Paz",
      "Lempira",
      "Ocotepeque",
      "Olancho",
      "Santa Bárbara",
      "Valle",
      "Yoro",
    ];
    for (const dep of departamentos) {
      // Distintas semillas para no depender de un solo hash.
      for (const semilla of ["a", "b", "anuncio-1", "anuncio-2"]) {
        const { lat, lng } = coordenadasParaDepartamento(dep, semilla);
        expect(lat).toBeGreaterThanOrEqual(HN_BOUNDS.latMin);
        expect(lat).toBeLessThanOrEqual(HN_BOUNDS.latMax);
        expect(lng).toBeGreaterThanOrEqual(HN_BOUNDS.lngMin);
        expect(lng).toBeLessThanOrEqual(HN_BOUNDS.lngMax);
      }
    }
  });

  it("usa la ubicación de referencia por defecto si el departamento no existe", () => {
    const { lat, lng } = coordenadasParaDepartamento("Departamento Inventado", "x");
    expect(Math.abs(lat - UBICACION_REFERENCIA_DEFAULT.lat)).toBeLessThan(0.2);
    expect(Math.abs(lng - UBICACION_REFERENCIA_DEFAULT.lng)).toBeLessThan(0.2);
  });
});

describe("coordenadasEfectivas", () => {
  it("sustituye la coordenada rota conocida por una derivada del departamento", () => {
    const anuncio = { id: "anuncio-1", lat: 14.0, lng: -87.2, departamento: "Cortés" };
    const efectivas = coordenadasEfectivas(anuncio);
    expect(efectivas).toEqual(coordenadasParaDepartamento("Cortés", "anuncio-1"));
  });

  it("deja pasar coordenadas reales sin tocarlas", () => {
    const anuncio = { id: "anuncio-2", lat: 15.5049, lng: -88.025, departamento: "Cortés" };
    expect(coordenadasEfectivas(anuncio)).toEqual({ lat: 15.5049, lng: -88.025 });
  });
});
