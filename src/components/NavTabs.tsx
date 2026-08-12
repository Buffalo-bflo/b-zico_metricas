"use client";

import { Suspense } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TabButton } from "@/components/Brand";
import { C } from "@/lib/designTokens";
import PeriodSelector from "@/components/PeriodSelector";

const TABS = [
  { href: "/geral", label: "Visão Geral" },
  { href: "/feed", label: "Feed" },
  { href: "/stories", label: "Stories" },
  { href: "/publico", label: "Público" },
  { href: "/estrategia", label: "Estratégia" },
  { href: "/comparar", label: "Comparar" },
];

export default function NavTabs({ months }: { months: string[] }) {
  const pathname = usePathname();
  const router = useRouter();

  const sair = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="baz-nav-wrap" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div className="baz-tabs-strip">
        {TABS.map((t) => (
          <TabButton key={t.href} active={pathname?.startsWith(t.href) ?? false} href={t.href}>
            {t.label}
          </TabButton>
        ))}
      </div>
      <div className="baz-nav-controls">
        {!pathname?.startsWith("/comparar") && (
          <Suspense fallback={null}>
            <PeriodSelector months={months} />
          </Suspense>
        )}
        <a
          href="/upload"
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            fontSize: 12,
            padding: "8px 14px",
            background: C.preto,
            color: C.branco,
            border: "none",
            borderRadius: 3,
            whiteSpace: "nowrap",
          }}
        >
          + Subir CSVs
        </a>
        <button
          onClick={sair}
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 400,
            fontSize: 12,
            padding: "8px 10px",
            background: "transparent",
            color: C.cinza,
            border: "none",
            cursor: "pointer",
          }}
        >
          Sair
        </button>
      </div>
    </div>
  );
}
