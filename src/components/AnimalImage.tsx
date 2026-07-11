"use client";

import { useState } from "react";
import { Beef } from "lucide-react";

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

  // Reinicia el estado de fallo cuando cambia la imagen (sin useEffect,
  // siguiendo el patrón de React para ajustar estado ante cambios de props).
  if (src !== srcPrevio) {
    setSrcPrevio(src);
    setFallo(false);
  }

  if (src && !fallo) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- puede ser base64 o URL externa.
            Sin loading="lazy" y sin cronómetro de "se tardó demasiado": ambos causaban que fotos
            perfectamente válidas se marcaran como rotas por timing del navegador, no por un error
            real. Ahora solo se cae al ícono de repuesto ante un onError real o una imagen de 1x1. */}
        <img
          src={src}
          alt=""
          onLoad={(e) => {
            // Una foto real nunca es de 1x1 — eso es un placeholder de
            // prueba guardado por error, no una foto visible.
            const img = e.currentTarget;
            if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
              setFallo(true);
            }
          }}
          onError={() => setFallo(true)}
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
