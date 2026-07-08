"use client";

import dynamic from "next/dynamic";

// Leaflet usa `window`, así que el mapa solo puede renderizarse en cliente.
const HondurasMap = dynamic(() => import("./HondurasMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#dfeee0] text-sm text-moorcado-gray-dark/60">
      Cargando mapa...
    </div>
  ),
});

export default function MiniMap({
  lat,
  lng,
  label,
}: {
  lat: number;
  lng: number;
  label?: string;
}) {
  return (
    <div className="relative aspect-16/9 w-full overflow-hidden rounded-2xl bg-[#dfeee0]">
      <HondurasMap
        puntos={[{ id: "ubicacion", lat, lng }]}
        activoId="ubicacion"
        onSelect={() => {}}
        center={[lat, lng]}
        zoom={12}
      />
      {label && (
        <span className="absolute bottom-2 left-2 z-1001 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-moorcado-gray-dark shadow">
          {label}
        </span>
      )}
    </div>
  );
}
