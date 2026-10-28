import type { Metadata } from "next";
import { Fraunces, Work_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const work = Work_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-work",
});

export const metadata: Metadata = {
  title: {
    default: "Panel de tiendas",
    template: "%s · Panel",
  },
  description: "Administración de catálogo, stock, imágenes y pedidos de las tiendas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${work.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
