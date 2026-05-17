import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Traición en la Oficina",
  description: "Juego web de desafíos sociales sobre llamadas de Teams.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: algunos navegadores (p. ej. Chrome en iOS)
    // inyectan atributos en <html> antes de que React hidrate. Esto ignora
    // esa diferencia — solo afecta a este elemento, no oculta bugs reales.
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
