"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { HN_BOUNDS } from "@/lib/geo";

// El contenedor usa aspect-ratio de Tailwind, que se aplica después del
// primer render de Leaflet. Sin esto, el mapa mide 0x0 al montar y calcula
// mal los tiles/pines (quedan fuera de vista hasta hacer resize manual).
function AjustarTamano() {
  const map = useMap();
  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 100);
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => {
      clearTimeout(id);
      ro.disconnect();
    };
  }, [map]);
  return null;
}

const HN_CENTER: [number, number] = [14.7, -86.2];

function pinIcon(color: string, size: number) {
  return L.divIcon({
    className: "",
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.35))">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
      <circle cx="12" cy="10" r="3" fill="white" stroke="none"/>
    </svg>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

const ICONO_NORMAL = pinIcon("#2E7D32", 32);
const ICONO_ACTIVO = pinIcon("#D4AF37", 40);

export interface PuntoMapa {
  id: string;
  lat: number;
  lng: number;
}

export default function HondurasMap({
  puntos,
  activoId,
  onSelect,
}: {
  puntos: PuntoMapa[];
  activoId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <MapContainer
      center={HN_CENTER}
      zoom={7}
      minZoom={6}
      maxBounds={[
        [HN_BOUNDS.latMin - 1, HN_BOUNDS.lngMin - 1],
        [HN_BOUNDS.latMax + 1, HN_BOUNDS.lngMax + 1],
      ]}
      maxBoundsViscosity={0.8}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <AjustarTamano />
      {puntos.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={p.id === activoId ? ICONO_ACTIVO : ICONO_NORMAL}
          eventHandlers={{ click: () => onSelect(p.id) }}
        />
      ))}
    </MapContainer>
  );
}
