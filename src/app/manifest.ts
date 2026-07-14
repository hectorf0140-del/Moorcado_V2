import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Moorcado — Mercado de ganado en Honduras",
    short_name: "Moorcado",
    description:
      "El mercado digital del ganado en Honduras. Compra, vende y gestiona tu hato de forma sencilla y confiable.",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F5F0",
    theme_color: "#2E7D32",
    lang: "es",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
