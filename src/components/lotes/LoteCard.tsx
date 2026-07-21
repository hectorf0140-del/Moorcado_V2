"use client";

import { m, useReducedMotion } from "motion/react";
import type { Anuncio } from "@/lib/types";
import { formatLempiras } from "@/lib/format";
import AnimalImage from "@/components/AnimalImage";

/**
 * layoutId compartidos con LoteDetalle para el morfeo foto/identificador/
 * precio. El resto de la card (raza, peso) no lleva layoutId: solo existe
 * en el grid, así que aparece/desaparece con opacity normal.
 *
 * Solo se usa en desktop — LotesGrid renderiza AnimalCard (sin Motion) en
 * mobile, así que no hay que preocuparse por costo de animación ahí.
 */
export const fotoLayoutId = (id: string) => `lote-foto-${id}`;
export const tituloLayoutId = (id: string) => `lote-titulo-${id}`;
export const precioLayoutId = (id: string) => `lote-precio-${id}`;

export default function LoteCard({
  anuncio,
  onAbrir,
}: {
  anuncio: Anuncio;
  onAbrir: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <m.div
      layout={!prefersReducedMotion}
      transition={prefersReducedMotion ? { duration: 0.1 } : undefined}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
    >
      <m.button
        type="button"
        onClick={onAbrir}
        aria-label={`Ver detalle de ${anuncio.titulo}`}
        className="block w-full text-left"
      >
        <m.div layoutId={prefersReducedMotion ? undefined : fotoLayoutId(anuncio.id)} className="relative aspect-[4/3] w-full">
          <AnimalImage
            src={anuncio.imagenes?.[0]}
            colorPrimario={anuncio.colorPrimario}
            colorSecundario={anuncio.colorSecundario}
            className="h-full w-full"
          />
        </m.div>

        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <m.h3
            layoutId={prefersReducedMotion ? undefined : tituloLayoutId(anuncio.id)}
            className="font-display font-semibold text-moorcado-gray-dark"
          >
            {anuncio.titulo}
          </m.h3>

          <p className="text-sm text-moorcado-gray-dark/60">
            {anuncio.raza} · {anuncio.pesoKg} kg
          </p>

          <m.p
            layoutId={prefersReducedMotion ? undefined : precioLayoutId(anuncio.id)}
            className="font-display text-lg font-bold text-moorcado-green"
          >
            {formatLempiras(anuncio.precio)}
          </m.p>
        </div>
      </m.button>
    </m.div>
  );
}
