"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X } from "lucide-react";
import { m, useReducedMotion } from "motion/react";
import type { Anuncio } from "@/lib/types";
import { formatEdad, formatLempiras } from "@/lib/format";
import AnimalImage from "@/components/AnimalImage";
import { fotoLayoutId, tituloLayoutId, precioLayoutId } from "./LoteCard";

/**
 * Ficha de detalle en overlay, solo desktop (LotesGrid usa AnimalCard sin
 * Motion en mobile, esto nunca se monta ahí). Panel centrado con overlay
 * clickeable. La foto/título/precio comparten layoutId con LoteCard y
 * Motion los morfea automáticamente sin necesitar que la card de origen
 * se desmonte.
 *
 * No hay historial de precios ni sistema de puja real en la app todavía
 * — en vez de inventar datos falsos, el CTA lleva a la ficha completa
 * real (/animal/[id]) donde sí existen mensajería y el flujo de venta.
 */
export default function LoteDetalle({
  anuncio,
  onCerrar,
}: {
  anuncio: Anuncio;
  onCerrar: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onCerrar]);

  const duracionFade = { duration: 0.1 };

  // Portal a document.body: <main> tiene una animación CSS con
  // animation-fill-mode: both (AppChrome.tsx, .animate-fade-in) que deja
  // un transform permanente incluso después de terminar — eso rompe
  // position:fixed en cualquier descendiente (se posiciona relativo al
  // <main>, no al viewport). El portal esquiva ese ancestro por completo.
  return createPortal(
    <>
      <m.div
        className="fixed inset-0 z-40 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={prefersReducedMotion ? duracionFade : undefined}
        onClick={onCerrar}
      />

      <m.div
        role="dialog"
        aria-modal="true"
        aria-label={anuncio.titulo}
        className="fixed left-1/2 top-1/2 z-50 max-h-[80vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white"
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
        transition={prefersReducedMotion ? duracionFade : undefined}
      >
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-moorcado-gray-dark shadow"
        >
          <X className="h-4 w-4" />
        </button>

        <m.div layoutId={prefersReducedMotion ? undefined : fotoLayoutId(anuncio.id)} className="relative aspect-[4/3] w-full">
          <AnimalImage
            src={anuncio.imagenes?.[0]}
            colorPrimario={anuncio.colorPrimario}
            colorSecundario={anuncio.colorSecundario}
            className="h-full w-full"
          />
        </m.div>

        <div className="flex flex-col gap-2 p-5">
          <m.h2
            layoutId={prefersReducedMotion ? undefined : tituloLayoutId(anuncio.id)}
            className="font-display text-xl font-semibold text-moorcado-gray-dark"
          >
            {anuncio.titulo}
          </m.h2>

          <p className="text-sm text-moorcado-gray-dark/60">{anuncio.raza}</p>

          <m.p
            layoutId={prefersReducedMotion ? undefined : precioLayoutId(anuncio.id)}
            className="font-display text-2xl font-bold text-moorcado-green"
          >
            {formatLempiras(anuncio.precio)}
          </m.p>

          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.18, duration: 0.25 }}
            className="mt-2 flex flex-col gap-4"
          >
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-moorcado-gray-light p-3">
                <p className="text-moorcado-gray-dark/60">Peso</p>
                <p className="font-semibold text-moorcado-gray-dark">{anuncio.pesoKg} kg</p>
              </div>
              <div className="rounded-xl bg-moorcado-gray-light p-3">
                <p className="text-moorcado-gray-dark/60">Edad</p>
                <p className="font-semibold text-moorcado-gray-dark">{formatEdad(anuncio.edadMeses)}</p>
              </div>
            </div>

            <p className="text-xs text-moorcado-gray-dark/50">
              El historial de precios de este lote aún no está disponible.
            </p>

            <Link
              href={`/animal/${anuncio.id}`}
              className="rounded-full bg-moorcado-green py-3 text-center text-sm font-semibold text-white transition hover:bg-moorcado-green/90 active:scale-95"
            >
              Contactar vendedor
            </Link>
          </m.div>
        </div>
      </m.div>
    </>,
    document.body
  );
}
