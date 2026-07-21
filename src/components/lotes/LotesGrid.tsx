"use client";

import { useState } from "react";
import { AnimatePresence, LayoutGroup } from "motion/react";
import type { Anuncio } from "@/lib/types";
import AnimalCard from "@/components/AnimalCard";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import MotionProvider from "./MotionProvider";
import LoteCard from "./LoteCard";
import LoteDetalle from "./LoteDetalle";

/**
 * Las animaciones (morfeo card → ficha, reacomodo de layout) son solo
 * para desktop. En mobile se renderiza la card original sin Motion —
 * ni siquiera se carga el bundle de Motion ahí, nada que pesarle a un
 * Android de gama media.
 */
export default function LotesGrid({ anuncios }: { anuncios: Anuncio[] }) {
  const esMobile = useMediaQuery("(max-width: 767px)");

  if (esMobile) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {anuncios.map((a) => (
          <AnimalCard key={a.id} animal={a} />
        ))}
      </div>
    );
  }

  return <LotesGridDesktop anuncios={anuncios} />;
}

/**
 * `LayoutGroup id="catalogo"` aísla los layoutId de esta grilla de
 * cualquier otra que use los mismos IDs de anuncio en otra parte de la
 * página (ej. favoritos), para que el morfeo no intente saltar entre dos
 * grillas distintas a la vez.
 */
function LotesGridDesktop({ anuncios }: { anuncios: Anuncio[] }) {
  const [abiertoId, setAbiertoId] = useState<string | null>(null);
  const abierto = anuncios.find((a) => a.id === abiertoId) ?? null;

  return (
    <MotionProvider>
      <LayoutGroup id="catalogo">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {anuncios.map((a) => (
            <LoteCard key={a.id} anuncio={a} onAbrir={() => setAbiertoId(a.id)} />
          ))}
        </div>

        <AnimatePresence>
          {abierto && <LoteDetalle key={abierto.id} anuncio={abierto} onCerrar={() => setAbiertoId(null)} />}
        </AnimatePresence>
      </LayoutGroup>
    </MotionProvider>
  );
}
