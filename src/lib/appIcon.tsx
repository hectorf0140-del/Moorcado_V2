import { ImageResponse } from "next/og";

/**
 * Icono de app compartido por las rutas de `icon`/`apple-icon` y los PNG del
 * manifest PWA. Fondo verde a bordes (sin esquinas redondeadas) para que
 * también sirva como ícono "maskable" — el propio SO le aplica su máscara.
 */
export function renderAppIcon(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2E7D32",
        }}
      >
        <span
          style={{
            fontSize: size * 0.56,
            fontWeight: 800,
            color: "#ffffff",
            fontFamily: "sans-serif",
          }}
        >
          M
        </span>
      </div>
    ),
    { width: size, height: size }
  );
}
