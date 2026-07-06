"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { formatLempiras } from "@/lib/format";
import { latLngToPercent } from "@/lib/geo";
import AnimalImage from "./AnimalImage";

const DISTANCIAS = [
  { label: "10 km", valor: 10 },
  { label: "25 km", valor: 25 },
  { label: "50 km", valor: 50 },
  { label: "Todo el país", valor: 9999 },
];

export default function MapaClient() {
  const [distancia, setDistancia] = useState(9999);
  const [activoId, setActivoId] = useState<string | null>(null);
  const anuncios = useAppStore((s) => s.anuncios);

  const visibles = useMemo(
    () =>
      anuncios.filter(
        (a) => a.activo !== false && !a.vendido && a.distanciaKm <= distancia
      ),
    [anuncios, distancia]
  );

  const activo = anuncios.find((a) => a.id === activoId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-moorcado-gray-dark">
            Mapa de Honduras
          </h1>
          <p className="text-sm text-moorcado-gray-dark/60">
            {visibles.length} publicaciones cerca de ti
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {DISTANCIAS.map((d) => (
            <button
              key={d.label}
              onClick={() => setDistancia(d.valor)}
              className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
                distancia === d.valor
                  ? "bg-moorcado-green text-white"
                  : "bg-white text-moorcado-gray-dark ring-1 ring-black/10"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-5 aspect-[16/10] w-full overflow-hidden rounded-3xl bg-[#dfeee0] shadow-sm ring-1 ring-black/5 sm:aspect-[16/8]">
        <svg className="absolute inset-0 h-full w-full opacity-40" aria-hidden>
          <defs>
            <pattern id="mapa-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#2E7D32" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mapa-grid)" />
        </svg>

        {visibles.map((a) => {
          const { x, y } = latLngToPercent(a.lat, a.lng);
          return (
            <button
              key={a.id}
              onClick={() => setActivoId(a.id)}
              style={{ left: `${x}%`, top: `${y}%` }}
              className="absolute -translate-x-1/2 -translate-y-full transition hover:z-10 hover:scale-110"
              aria-label={a.nombre}
            >
              <MapPin
                className={`h-8 w-8 drop-shadow ${
                  activoId === a.id
                    ? "fill-moorcado-gold text-white"
                    : "fill-moorcado-green text-white"
                }`}
              />
            </button>
          );
        })}

        {activo && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-lg sm:left-4 sm:right-auto sm:w-80">
            <AnimalImage
              colorPrimario={activo.colorPrimario}
              colorSecundario={activo.colorSecundario}
              className="h-16 w-16 shrink-0 rounded-xl"
              iconClassName="w-7 h-7"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-moorcado-gray-dark">
                {activo.nombre} · {activo.raza}
              </p>
              <p className="text-sm text-moorcado-green">
                {formatLempiras(activo.precio)}
              </p>
              <p className="text-xs text-moorcado-gray-dark/60">
                {activo.municipio}, {activo.departamento} · {activo.distanciaKm} km
              </p>
            </div>
            <Link
              href={`/animal/${activo.id}`}
              className="shrink-0 rounded-full bg-moorcado-green px-3 py-2 text-xs font-bold text-white"
            >
              Ver
            </Link>
            <button
              onClick={() => setActivoId(null)}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-moorcado-gray-dark text-white"
              aria-label="Cerrar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibles.map((a) => (
          <button
            key={a.id}
            onClick={() => setActivoId(a.id)}
            className={`flex items-center gap-3 rounded-xl bg-white p-3 text-left shadow-sm ring-1 transition hover:-translate-y-0.5 ${
              activoId === a.id ? "ring-moorcado-green" : "ring-black/5"
            }`}
          >
            <AnimalImage
              colorPrimario={a.colorPrimario}
              colorSecundario={a.colorSecundario}
              className="h-12 w-12 shrink-0 rounded-lg"
              iconClassName="w-5 h-5"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-moorcado-gray-dark">
                {a.nombre}
              </p>
              <p className="text-xs text-moorcado-gray-dark/60">
                {a.departamento} · {a.distanciaKm} km
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
