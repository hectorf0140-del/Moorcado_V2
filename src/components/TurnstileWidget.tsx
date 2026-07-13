"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opciones: { sitekey: string; callback: (token: string) => void }
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/** true solo si se configuró la llave pública de Turnstile. */
export function turnstileHabilitado(): boolean {
  return Boolean(SITE_KEY);
}

/**
 * Widget de Cloudflare Turnstile. No renderiza nada si no hay llave
 * configurada (`turnstileHabilitado()` en false) — así el formulario que lo
 * usa sigue funcionando igual que hoy hasta que se configuren las llaves.
 *
 * `onVerify` debe ser una función estable entre renders (ej. el setter de
 * un useState) — si cambia en cada render, el widget se vuelve a montar.
 */
export default function TurnstileWidget({ onVerify }: { onVerify: (token: string) => void }) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [scriptListo, setScriptListo] = useState(false);

  useEffect(() => {
    if (!scriptListo || !contenedorRef.current || !window.turnstile || !SITE_KEY) return;
    const widgetId = window.turnstile.render(contenedorRef.current, {
      sitekey: SITE_KEY,
      callback: onVerify,
    });
    return () => {
      window.turnstile?.remove(widgetId);
    };
  }, [scriptListo, onVerify]);

  if (!SITE_KEY) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={() => setScriptListo(true)}
      />
      <div ref={contenedorRef} />
    </>
  );
}
