export const HN_BOUNDS = {
  latMin: 12.9,
  latMax: 16.5,
  lngMin: -89.4,
  lngMax: -83.1,
};

export function latLngToPercent(lat: number, lng: number) {
  const x = ((lng - HN_BOUNDS.lngMin) / (HN_BOUNDS.lngMax - HN_BOUNDS.lngMin)) * 100;
  const y = (1 - (lat - HN_BOUNDS.latMin) / (HN_BOUNDS.latMax - HN_BOUNDS.latMin)) * 100;
  return {
    x: Math.min(96, Math.max(4, x)),
    y: Math.min(96, Math.max(4, y)),
  };
}
