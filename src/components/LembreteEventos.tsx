"use client";

import { useEffect, useState } from "react";
import { C } from "@/lib/designTokens";
import { fmtDate } from "@/lib/metrics";
import type { LembreteEvento } from "@/lib/reminders";

function chaveHoje(): string {
  const hoje = new Date().toISOString().slice(0, 10);
  return `baz-lembrete-dismissed-${hoje}`;
}

// Dispensa é por dia (a chave leva a data de hoje), não por evento pra sempre — assim
// um lembrete dispensado no marco de "faltam 5 dias" volta a aparecer sozinho quando
// chegar o marco seguinte ("falta 1 dia", depois o próprio dia do evento).
export function LembreteEventos({ lembretes }: { lembretes: LembreteEvento[] }) {
  const [pronto, setPronto] = useState(false);
  const [dispensados, setDispensados] = useState<string[]>([]);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(chaveHoje());
      setDispensados(salvo ? JSON.parse(salvo) : []);
    } catch {
      setDispensados([]);
    }
    setPronto(true);
  }, []);

  const dispensar = (id: string) => {
    const novo = [...dispensados, id];
    setDispensados(novo);
    try {
      localStorage.setItem(chaveHoje(), JSON.stringify(novo));
    } catch {
      // Sem localStorage disponível (aba anônima etc.) — só não persiste entre recarregamentos.
    }
  };

  // Só decide o que mostrar depois de checar o localStorage, pra não piscar um lembrete
  // já dispensado antes de sumir de novo.
  if (!pronto) return null;
  const visiveis = lembretes.filter((l) => !dispensados.includes(l.id));
  if (visiveis.length === 0) return null;

  return (
    <div
      style={{
        background: C.avisoFundo,
        border: `1px solid ${C.aviso}`,
        borderRadius: 4,
        padding: "12px 14px",
        marginBottom: 18,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {visiveis.map((l) => (
        <div
          key={l.id}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}
        >
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: C.avisoTexto, lineHeight: 1.5 }}>
            {l.tipo === "hoje" ? (
              <>
                <b>{l.ateData ? "Acontecendo agora:" : "Hoje:"}</b> {l.note}
                {l.ateData ? ` (até ${fmtDate(l.ateData)})` : ""}
              </>
            ) : (
              <>
                <b>Falta{l.diasRestantes === 1 ? "" : "m"} {l.diasRestantes} dia{l.diasRestantes === 1 ? "" : "s"}:</b>{" "}
                {l.note}
              </>
            )}
          </span>
          <button
            onClick={() => dispensar(l.id)}
            className="baz-btn-ghost-muted"
            aria-label="Dispensar lembrete"
            style={{
              background: "transparent",
              border: "none",
              color: C.avisoTexto,
              cursor: "pointer",
              fontSize: 14,
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
