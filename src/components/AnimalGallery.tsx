"use client";

import { useState } from "react";
import { Beef } from "lucide-react";

export default function AnimalGallery({
  colorPrimario,
  colorSecundario,
  cantidad,
}: {
  colorPrimario: string;
  colorSecundario: string;
  cantidad: number;
}) {
  const [activo, setActivo] = useState(0);
  const fotos = Array.from({ length: cantidad });

  return (
    <div>
      <div
        className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-2xl"
        style={{
          background: `linear-gradient(${135 + activo * 12}deg, ${colorPrimario} 0%, ${colorSecundario} 100%)`,
        }}
      >
        <Beef className="h-24 w-24 text-white/90" strokeWidth={1.3} />
        <span className="absolute bottom-3 right-3 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white">
          {activo + 1} / {cantidad}
        </span>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none">
        {fotos.map((_, i) => (
          <button
            key={i}
            onClick={() => setActivo(i)}
            className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition ${
              activo === i ? "ring-moorcado-green" : "ring-transparent"
            }`}
            style={{
              background: `linear-gradient(${135 + i * 12}deg, ${colorPrimario} 0%, ${colorSecundario} 100%)`,
            }}
            aria-label={`Foto ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
