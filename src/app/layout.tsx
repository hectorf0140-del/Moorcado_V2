import type { Metadata, Viewport } from "next";
import { Balsamiq_Sans, Baloo_2 } from "next/font/google";
import "./globals.css";
import HydrationProvider from "@/components/HydrationProvider";
import AppChrome from "@/components/AppChrome";

const balsamiq = Balsamiq_Sans({
  variable: "--font-balsamiq",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Moorcado — Compra y venta de ganado en Honduras",
  description:
    "El mercado digital del ganado en Honduras. Compra, vende y gestiona tu hato de forma sencilla y confiable.",
  appleWebApp: {
    capable: true,
    title: "Moorcado",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#15492B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${balsamiq.variable} ${baloo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-moorcado-gray-light text-moorcado-gray-dark">
        <HydrationProvider />
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
