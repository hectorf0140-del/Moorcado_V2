export const HN_BOUNDS = {
  latMin: 12.9,
  latMax: 16.5,
  lngMin: -89.4,
  lngMax: -83.1,
};

/** Centro aproximado de cada departamento (capital o ciudad principal). */
export const CENTROS_DEPARTAMENTOS: Record<string, { lat: number; lng: number }> = {
  "Atlántida": { lat: 15.7597, lng: -86.7822 },
  "Choluteca": { lat: 13.3011, lng: -87.1897 },
  "Colón": { lat: 15.9198, lng: -85.9497 },
  "Comayagua": { lat: 14.4522, lng: -87.6459 },
  "Copán": { lat: 14.7667, lng: -88.7833 },
  "Cortés": { lat: 15.5049, lng: -88.025 },
  "El Paraíso": { lat: 13.9422, lng: -86.8442 },
  "Francisco Morazán": { lat: 14.0723, lng: -87.1921 },
  "Gracias a Dios": { lat: 15.2667, lng: -83.7803 },
  "Intibucá": { lat: 14.3167, lng: -88.1667 },
  "Islas de la Bahía": { lat: 16.32, lng: -86.5475 },
  "La Paz": { lat: 14.3167, lng: -87.6833 },
  "Lempira": { lat: 14.5833, lng: -88.5833 },
  "Ocotepeque": { lat: 14.4333, lng: -89.1833 },
  "Olancho": { lat: 14.6675, lng: -86.2205 },
  "Santa Bárbara": { lat: 14.9167, lng: -88.2333 },
  "Valle": { lat: 13.5333, lng: -87.4833 },
  "Yoro": { lat: 15.1333, lng: -87.1333 },
};

/** Tegucigalpa — punto de referencia por defecto cuando no hay geolocalización. */
export const UBICACION_REFERENCIA_DEFAULT = { lat: 14.0723, lng: -87.1921 };

function toRad(grados: number): number {
  return (grados * Math.PI) / 180;
}

/** Distancia en línea recta (fórmula de Haversine), redondeada a km enteros. */
export function calcularDistanciaKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return h;
}

// `%` en JS conserva el signo del dividendo: para un `n` negativo (la mitad
// de los casos, ya que `hashString` puede devolver cualquier entero de 32
// bits con signo) `n % 1000` daba un resultado negativo en vez de [0, 999],
// duplicando sin querer el rango del desplazamiento en
// `coordenadasParaDepartamento` (hasta ~45 km en vez de los ~16 km
// previstos, sacando puntos de Honduras en departamentos fronterizos).
function mod1000(n: number): number {
  return ((n % 1000) + 1000) % 1000;
}

/**
 * Coordenadas aproximadas dentro de un departamento: parte del centro del
 * departamento y le aplica un pequeño desplazamiento determinístico (según
 * `semilla`, normalmente el id del anuncio) para que varias publicaciones
 * del mismo departamento no queden apiladas en el mismo punto exacto del
 * mapa, pero sí sigan cayendo dentro de esa zona.
 */
export function coordenadasParaDepartamento(
  departamento: string,
  semilla: string
): { lat: number; lng: number } {
  const centro = CENTROS_DEPARTAMENTOS[departamento] ?? UBICACION_REFERENCIA_DEFAULT;
  const h = hashString(semilla);
  const offsetLat = (mod1000(h) / 1000 - 0.5) * 0.3; // ± ~16 km
  const offsetLng = (mod1000(h >> 10) / 1000 - 0.5) * 0.3;
  return { lat: centro.lat + offsetLat, lng: centro.lng + offsetLng };
}

// Coordenada fija que `PublicarForm` guardaba por error en cada publicación
// nueva antes de este fix (por eso todas mostraban "0 km": todas apuntaban
// exactamente al mismo punto). Se detecta para poder corregir en pantalla
// las publicaciones ya guardadas con este valor, sin tener que migrar la
// base de datos.
const LAT_ROTA = 14.0;
const LNG_ROTA = -87.2;

/**
 * Coordenadas a usar para mostrar/calcular distancia de un anuncio: las
 * suyas propias, o — si quedó guardado con la coordenada rota de arriba —
 * unas derivadas de su departamento, para que el dato se vea correcto
 * incluso en publicaciones creadas antes de este fix.
 */
export function coordenadasEfectivas(anuncio: {
  id: string;
  lat: number;
  lng: number;
  departamento: string;
}): { lat: number; lng: number } {
  const esCoordenadaRota =
    Math.abs(anuncio.lat - LAT_ROTA) < 0.0001 && Math.abs(anuncio.lng - LNG_ROTA) < 0.0001;
  return esCoordenadaRota
    ? coordenadasParaDepartamento(anuncio.departamento, anuncio.id)
    : { lat: anuncio.lat, lng: anuncio.lng };
}
