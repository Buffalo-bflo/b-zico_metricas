import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bázico · Métricas Orgânicas",
  description: "Dashboard de métricas orgânicas do Instagram da Bázico",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
