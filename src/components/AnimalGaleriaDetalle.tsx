"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Beef } from "lucide-react";

// Tiempo máximo de espera antes de dar por rota una imagen que nunca
// dispara error ni load (ej. loremflickr.com sin respuesta/bloqueado
// por red, en vez de un 404 explícito).
const TIEMPO_ESPERA_MS = 8000;

function useFallo(src: string) {
  const [fallo, setFallo] = useState(false);
  const [srcPrevio, setSrcPrevio] = useState(src);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reinicia el estado de fallo cuando cambia la imagen (sin useEffect,
  // siguiendo el patrón de React para ajustar estado ante cambios de props).
  if (src !== srcPrevio) {
    setSrcPrevio(src);
    setFallo(false);
  }

  useEffect(() => {
    timerRef.current = setTimeout(() => setFallo(true), TIEMPO_ESPERA_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [src]);

  function limpiarTemporizador() {
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  return {
    fallo,
    onLoad: (e: React.SyntheticEvent<HTMLImageElement>) => {
      limpiarTemporizador();
      // Una foto real nunca es de 1x1 — eso es un placeholder de prueba
      // guardado por error, no una foto visible.
      const img = e.currentTarget;
      if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
        setFallo(true);
      }
    },
    onError: () => {
      limpiarTemporizador();
      setFallo(true);
    },
  };
}

// Galería con fallback: si una foto real falla o nunca termina de cargar
// (ej. loremflickr caído/lento/bloqueado), se muestra un degradado en vez
// de un ícono de imagen rota indefinidamente.
export default function AnimalGaleriaDetalle({
  imagenes,
  colorPrimario,
  colorSecundario,
}: {
  imagenes: string[];
  colorPrimario: string;
  colorSecundario: string;
}) {
  const principal = useFallo(imagenes[0]);

  return (
    <div>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-moorcado-gray-light">
        {principal.fallo ? (
          <Fallback colorPrimario={colorPrimario} colorSecundario={colorSecundario} />
        ) : (
          <Image
            src={imagenes[0]}
            alt="Foto principal del animal"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 65vw"
            unoptimized
            onLoad={principal.onLoad}
            onError={principal.onError}
          />
        )}
      </div>
      {imagenes.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none">
          {imagenes.map((src, i) => (
            <Miniatura key={i} src={src} indice={i} colorPrimario={colorPrimario} colorSecundario={colorSecundario} />
          ))}
        </div>
      )}
    </div>
  );
}

function Miniatura({
  src,
  indice,
  colorPrimario,
  colorSecundario,
}: {
  src: string;
  indice: number;
  colorPrimario: string;
  colorSecundario: string;
}) {
  const { fallo, onLoad, onError } = useFallo(src);

  return (
    <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg ring-2 ring-transparent">
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
          onLoad={onLoad}
          onError={onError}
        />
      )}
    </div>
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
