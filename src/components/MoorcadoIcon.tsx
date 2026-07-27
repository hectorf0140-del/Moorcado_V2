/**
 * Ícono de marca: cabeza de vaca partida en los dos verdes de Moorcado.
 * Recreado en SVG a partir del logo/guía de marca que pasó el usuario
 * (no hay un archivo de imagen fuente en el repo) — es una interpretación
 * simplificada, no un trazo pixel-perfecto.
 */
export default function MoorcadoIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        d="M18 17 C20 11 22 9 24 9"
        stroke="#3a8257"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M30 17 C28 11 26 9 24 9"
        stroke="#15492b"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M8.5 20.5 C8.5 14.5 14 12 18.5 15.5 C20.5 17 20.5 21 17.5 22.5 C12.5 24.5 8.5 24 8.5 20.5 Z"
        stroke="#3a8257"
        strokeWidth="2.2"
        fill="none"
      />
      <path
        d="M39.5 20.5 C39.5 14.5 34 12 29.5 15.5 C27.5 17 27.5 21 30.5 22.5 C35.5 24.5 39.5 24 39.5 20.5 Z"
        stroke="#15492b"
        strokeWidth="2.2"
        fill="none"
      />
      <path d="M24 12 C16 12 11.5 18 11.5 24.5 C11.5 31 16 37 24 43 L24 12 Z" fill="#3a8257" />
      <path d="M24 12 C32 12 36.5 18 36.5 24.5 C36.5 31 32 37 24 43 L24 12 Z" fill="#15492b" />
      <path
        d="M24 20 C20 20 18 23.2 18 26.4 C18 30 21 33 24 36.5 C27 33 30 30 30 26.4 C30 23.2 28 20 24 20 Z"
        fill="#ffffff"
      />
      <circle cx="21.4" cy="28" r="1.7" fill="#1f2a24" />
      <circle cx="26.6" cy="28" r="1.7" fill="#1f2a24" />
    </svg>
  );
}
