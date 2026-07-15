import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saba Noticias Actuales",
  description: "Dashboard personal de noticias argentinas e internacionales.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
