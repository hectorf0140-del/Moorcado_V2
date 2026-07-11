"use client";

import { useState } from "react";
import Image from "next/image";
import { Beef } from "lucide-react";

function useFallo(src: string) {
  const [fallo, setFallo] = useState(false);
  const [srcPrevio, setSrcPrevio] = useState(src);

  // Reinicia el estado de fallo cuando cambia la imagen (sin useEffect,
  // siguiendo el patrón de React para ajustar estado ante cambios de props).
  if (src !== srcPrevio) {
    setSrcPrevio(src);
    setFallo(false);
  }

  return {
    fallo,
    onLoad: (e: React.SyntheticEvent<HTMLImageElement>) => {
      // Una foto real nunca es de 1x1 — eso es un placeholder de prueba
      // guardado por error, no una foto visible.
      const img = e.currentTarget;
      if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
        setFallo(true);
      }
    },
    onError: () => setFallo(true),
  };
}

// Galería con fallback: si una foto real falla (onError real, o un
// placeholder de 1x1) se muestra un degradado en vez de un ícono de imagen
// rota. Ya no hay cronómetro de "se tardó demasiado" — causaba que fotos
// perfectamente válidas se marcaran como rotas por timing del navegador,
// no por un error real. Todas las <Image> llevan `priority` a propósito:
// next/image aplica loading="lazy" por defecto, que además de la carrera de
// timing de arriba retrasaba fotos sin necesidad. Como acá hay como máximo
// 6 fotos (MAX_FOTOS en PublicarForm), cargarlas todas de inmediato no pesa.
export default function AnimalGaleriaDetalle({
  imagenes,
  colorPrimario,
  colorSecundario,
}: {
  imagenes: string[];
  colorPrimario: string;
  colorSecundario: string;
}) {
  const [activo, setActivo] = useState(0);
  const indiceActivo = activo < imagenes.length ? activo : 0;
  const principal = useFallo(imagenes[indiceActivo] ?? "");
  const sinFotos = imagenes.length === 0;

  return (
    <div>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-moorcado-gray-light">
        {sinFotos || principal.fallo ? (
          <Fallback colorPrimario={colorPrimario} colorSecundario={colorSecundario} />
        ) : (
          <Image
            key={indiceActivo}
            src={imagenes[indiceActivo]}
            alt={`Foto ${indiceActivo + 1} del animal`}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 65vw"
            unoptimized
            priority
            onLoad={principal.onLoad}
            onError={principal.onError}
          />
        )}
      </div>
      {imagenes.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none">
          {imagenes.map((src, i) => (
            <Miniatura
              key={i}
              src={src}
              indice={i}
              activa={i === indiceActivo}
              onSeleccionar={() => setActivo(i)}
              colorPrimario={colorPrimario}
              colorSecundario={colorSecundario}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Miniatura({
  src,
  indice,
  activa,
  onSeleccionar,
  colorPrimario,
  colorSecundario,
}: {
  src: string;
  indice: number;
  activa: boolean;
  onSeleccionar: () => void;
  colorPrimario: string;
  colorSecundario: string;
}) {
  const { fallo, onLoad, onError } = useFallo(src);

  return (
    <button
      type="button"
      onClick={onSeleccionar}
      aria-label={`Ver foto ${indice + 1}`}
      aria-current={activa}
      className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition ${
        activa ? "ring-moorcado-green" : "ring-transparent hover:ring-moorcado-green/40"
      }`}
    >
      {fallo ? (
        <Fallback colorPrimario={colorPrimario} colorSecundario={colorSecundario} />
      ) : (
        <Image
          src={src}
          alt={`Foto ${indice + 1}`}
          fill
          className="object-cover"
          sizes="80px"
          unoptimized
          priority
          onLoad={onLoad}
          onError={onError}
        />
      )}
    </button>
  );
}

function Fallback({
  colorPrimario,
  colorSecundario,
}: {
  colorPrimario: string;
  colorSecundario: string;
}) {
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{
        background: `linear-gradient(135deg, ${colorPrimario} 0%, ${colorSecundario} 100%)`,
      }}
    >
      <Beef className="h-8 w-8 text-white/90" strokeWidth={1.5} />
    </div>
  );
}
