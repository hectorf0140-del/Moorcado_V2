import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileNav from "@/components/MobileNav";
import HydrationProvider from "@/components/HydrationProvider";
import MooeWidget from "@/components/MooeWidget";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Moorcado — Compra y venta de ganado en Honduras",
  description:
    "El mercado digital del ganado en Honduras. Compra, vende y gestiona tu hato de forma sencilla y confiable.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2E7D32",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-moorcado-gray-light text-moorcado-gray-dark">
        <HydrationProvider />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <MobileNav />
        <MooeWidget />
      </body>
    </html>
  );
}
