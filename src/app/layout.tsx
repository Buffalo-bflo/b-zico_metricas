import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bázico · Métricas Orgânicas",
  description: "Dashboard de métricas orgânicas do Instagram da Bázico",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- regra pensada pro Pages Router (pages/_document.js); no App Router, o link de fonte no layout raiz É o lugar certo. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}{/* impeccable-live-start */}
<script src="http://localhost:8400/live.js?token=6498f2bb-5d67-45fc-9d2d-dd2b65342552"></script>
{/* impeccable-live-end */}
</body>
    </html>
  );
}
