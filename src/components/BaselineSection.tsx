"use client";

import { useState } from "react";
import { SectionTitle } from "@/components/Brand";
import { C, TIPO_COLORS } from "@/lib/designTokens";
import { fmt, fmtDate } from "@/lib/metrics";
import type { Baseline } from "@/lib/baseline";

export function BaselineSection({ baseline }: { baseline: Baseline }) {
  const [mostrarExcluidos, setMostrarExcluidos] = useState(false);

  return (
    <div style={{ background: C.branco, border: `1px solid ${C.linha}`, borderRadius: 4, padding: 20 }}>
      <SectionTitle>Média de referência por formato</SectionTitle>
      <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 11, color: C.cinza, marginBottom: 16 }}>
        Média orgânica real, calculada em cima de {baseline.totalElegiveis} posts do histórico — não conta posts
        marcados como impulsionados (tráfego pago) nem posts de parceria/influencer/UGC/repost. Atualiza sozinha
        conforme você marca mais posts como impulsionados ou sobem posts novos.
      </div>

      {baseline.porFormato.length === 0 && (
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: C.cinza }}>
          Nenhum post elegível ainda pra calcular a média.
        </div>
      )}

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 12 }}>
        {baseline.porFormato.map((f) => (
          <div
            key={f.tipo}
            style={{
              flex: "1 1 220px",
              border: `1px solid ${C.linha}`,
              borderRadius: 4,
              padding: 14,
              borderTop: `3px solid ${TIPO_COLORS[f.tipo] ?? C.roxo}`,
            }}
          >
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 12, fontWeight: 700, color: C.preto, marginBottom: 8 }}>
              {f.tipo} <span style={{ color: C.cinza, fontWeight: 400 }}>({f.qtd} posts)</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[
                ["Views", f.mediaViews],
                ["Alcance", f.mediaReach],
                ["Curtidas", f.mediaLikes],
                ["Coment.", f.mediaComments],
                ["Compart.", f.mediaShares],
                ["Salvos", f.mediaSaves],
              ].map(([label, valor]) => (
                <div key={label as string}>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, textTransform: "uppercase", color: C.cinza }}>
                    {label}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: C.preto }}>
                    {fmt(Math.round(valor as number))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {baseline.excluidos.length > 0 && (
        <div>
          <button
            onClick={() => setMostrarExcluidos((v) => !v)}
            style={{ background: "transparent", border: "none", color: C.roxo, cursor: "pointer", fontSize: 11, padding: 0 }}
          >
            {mostrarExcluidos ? "Esconder" : "Ver"} os {baseline.excluidos.length} posts excluídos do cálculo
          </button>
          {mostrarExcluidos && (
            <div style={{ marginTop: 10, maxHeight: 200, overflowY: "auto", border: `1px solid ${C.linha}`, borderRadius: 3 }}>
              {baseline.excluidos.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                    borderBottom: `1px solid ${C.linha}`,
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: 11,
                    color: C.preto,
                  }}
                >
                  <span>
                    {fmtDate(p.post_date)} · {p.post_type}
                  </span>
                  <span style={{ color: C.cinza }}>{p.motivo}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
