import type { Anuncio } from "@/lib/types";
import AnimalImage from "@/components/AnimalImage";

/**
 * Carrusel simple de fotos reales de publicaciones: scroll horizontal
 * nativo con snap, sin JS ni librería de animación. Funciona igual de
 * bien con mouse, touch o teclado, y no le pesa nada a un Android de
 * gama media.
 */
export default function CattleCarousel({ anuncios }: { anuncios: Anuncio[] }) {
  if (anuncios.length === 0) return null;

  return (
    <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
      {anuncios.map((a) => (
        <div
          key={a.id}
          className="relative aspect-[4/3] w-56 shrink-0 snap-start overflow-hidden rounded-2xl sm:w-64"
        >
          <AnimalImage
            src={a.imagenes?.[0]}
            colorPrimario={a.colorPrimario}
            colorSecundario={a.colorSecundario}
            className="h-full w-full"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <p className="font-display text-sm font-semibold text-white">{a.raza}</p>
            <p className="text-xs text-white/80">{a.pesoKg} kg</p>
          </div>
        </div>
      ))}
    </div>
  );
}
