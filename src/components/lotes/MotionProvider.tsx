"use client";

import { LazyMotion, domMax } from "motion/react";
import type { ReactNode } from "react";

/**
 * `domAnimation` (el bundle chico recomendado por defecto) NO incluye
 * `drag` ni `layout` — están solo en `domMax` (ver
 * node_modules/framer-motion/dist/es/render/dom/features-max.mjs). Como
 * el morfeo por layoutId y el bottom sheet con drag="y" dependen de
 * ambas, hace falta `domMax` para que la animación exista de verdad.
 * Sigue siendo lazy: solo se carga cuando se monta esta grilla, no en el
 * bundle inicial del sitio.
 *
 * `strict` obliga a que todo hijo use `m.*` en vez de `motion.*`.
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      {children}
    </LazyMotion>
  );
}
