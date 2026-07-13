import type { NextConfig } from "next";

// Mismo proyecto que src/lib/supabase.ts — las fotos de anuncios (Supabase
// Storage) se sirven desde este host y next/image rechaza cualquier
// dominio remoto que no esté en la lista de abajo.
const SUPABASE_HOSTNAME = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://kgqdygraodpbowtuqvgp.supabase.co"
).hostname;

// Fuentes externas reales de la app: tiles de OpenStreetMap (mapa) y
// Supabase (API + fotos). Todo lo demás (fuentes, JS, CSS) se sirve desde
// el propio dominio via next/font y el build de Next.
// En desarrollo, Turbopack/Fast Refresh necesita 'unsafe-eval' para el HMR
// — se relaja solo en dev para no bloquear `next dev` por accidente.
// Cloudflare Turnstile (captcha de registro/login, ver src/components/
// TurnstileWidget.tsx): necesita cargar su script y abrir un iframe propio.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://*.tile.openstreetmap.org https://loremflickr.com https://${SUPABASE_HOSTNAME}`,
  "font-src 'self' data:",
  `connect-src 'self' https://${SUPABASE_HOSTNAME} https://challenges.cloudflare.com${process.env.NODE_ENV !== "production" ? " ws://localhost:* ws://172.16.0.2:*" : ""}`,
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: ["172.16.0.2"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "loremflickr.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: SUPABASE_HOSTNAME,
        pathname: "/storage/v1/object/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
};

export default nextConfig;
