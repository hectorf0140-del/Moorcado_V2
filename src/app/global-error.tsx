"use client";

import { useEffect } from "react";

// Se usa solo si el propio layout raíz falla — por eso no depende de
// Tailwind ni de ningún otro componente de la app, todo inline.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error no controlado en el layout raíz:", error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <p style={{ fontSize: "3rem", margin: 0 }}>🐄</p>
        <h1 style={{ marginTop: "1rem", fontSize: "1.5rem", fontWeight: 700 }}>
          Algo salió mal
        </h1>
        <p style={{ marginTop: "0.5rem", maxWidth: "24rem", color: "#666" }}>
          Tuvimos un problema cargando Moorcado. Intenta de nuevo en un momento.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "2rem",
            borderRadius: "9999px",
            background: "#2E7D32",
            color: "white",
            border: "none",
            padding: "0.75rem 1.5rem",
            fontSize: "0.875rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Intentar de nuevo
        </button>
      </body>
    </html>
  );
}
