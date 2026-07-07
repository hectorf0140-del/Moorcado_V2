"use client";

import { useEffect, useRef, useState } from "react";
import { Beef } from "lucide-react";

// Tiempo máximo de espera antes de dar por rota una imagen que nunca
// dispara error ni load (ej. loremflickr.com sin respuesta/bloqueado
// por red, en vez de un 404 explícito).
const TIEMPO_ESPERA_MS = 8000;

export default function AnimalImage({
  src,
  colorPrimario,
  colorSecundario,
  className = "",
  iconClassName = "w-10 h-10",
}: {
  src?: string;
  colorPrimario: string;
  colorSecundario: string;
  className?: string;
  iconClassName?: string;
}) {
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
    if (!src) return;
    timerRef.current = setTimeout(() => setFallo(true), TIEMPO_ESPERA_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [src]);

  function limpiarTemporizador() {
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  if (src && !fallo) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- puede ser base64 o URL externa */}
        <img
          src={src}
          alt=""
          loading="lazy"
          onLoad={(e) => {
            limpiarTemporizador();
            // Una foto real nunca es de 1x1 — eso es un placeholder de
            // prueba guardado por error, no una foto visible.
            const img = e.currentTarget;
            if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
              setFallo(true);
            }
          }}
          onError={() => {
            limpiarTemporizador();
            setFallo(true);
          }}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(135deg, ${colorPrimario} 0%, ${colorSecundario} 100%)`,
      }}
    >
      <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_40%)]" />
      <Beef className={`${iconClassName} text-white/90 drop-shadow`} strokeWidth={1.5} />
    </div>
  );
}
