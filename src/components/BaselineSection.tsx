"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SectionTitle } from "@/components/Brand";
import { C, TIPO_COLORS } from "@/lib/designTokens";
import { fmt, fmtDate } from "@/lib/metrics";
import type { Baseline, JanelaBaseline } from "@/lib/baseline";
import { mesLegivel } from "@/lib/dataQuality";

const JANELAS: { key: JanelaBaseline; label: string; ajuda: string }[] = [
  { key: "3m", label: "3 meses", ajuda: "Só os últimos 3 meses — reflete o momento atual do perfil." },
  { key: "12m", label: "12 meses", ajuda: "Último ano — equilibra sazonalidade e realidade atual." },
  { key: "confiavel", label: "Todo período confiável", ajuda: "Tudo desde onde os dados da Meta ainda são íntegros." },
];

export function BaselineSection({ baseline }: { baseline: Baseline }) {
  const [mostrarExcluidos, setMostrarExcluidos] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const trocarJanela = (j: JanelaBaseline) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("baseline", j);
    router.push(`${pathname}?${sp.toString()}`);
  };

  const janelaAtual = JANELAS.find((j) => j.key === baseline.janela) ?? JANELAS[1];

  return (
    <div style={{ background: C.branco, border: `1px solid ${C.linha}`, borderRadius: 4, padding: 20 }}>
      <SectionTitle>Média de referência por formato</SectionTitle>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {JANELAS.map((j) => (
          <button
            key={j.key}
            onClick={() => trocarJanela(j.key)}
            title={j.ajuda}
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 11,
              fontWeight: baseline.janela === j.key ? 700 : 400,
              padding: "5px 12px",
              background: baseline.janela === j.key ? C.preto : "transparent",
              color: baseline.janela === j.key ? C.branco : C.preto,
              border: `1px solid ${C.preto}`,
              borderRadius: 20,
              cursor: "pointer",
            }}
          >
            {j.label}
          </button>
        ))}
      </div>

      <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 11, color: C.cinza, marginBottom: 16, lineHeight: 1.6 }}>
        {janelaAtual.ajuda} Calculada em cima de <b>{baseline.totalElegiveis} posts</b> desde{" "}
        <b>{fmtDate(baseline.inicioUsado)}/{baseline.inicioUsado.slice(0, 4)}</b>. Não conta posts impulsionados
        (tráfego pago) nem de parceria/influencer/UGC/repost.
      </div>

      {baseline.corteConfiavel && (
        <div
          style={{
            background: `${C.roxo}12`,
            borderLeft: `3px solid ${C.roxo}`,
            padding: "10px 12px",
            borderRadius: 4,
            fontSize: 11,
            color: C.preto,
            marginBottom: 16,
            lineHeight: 1.6,
          }}
        >
          <b>Por que a média não usa todo o histórico:</b> a Meta guarda alcance e visualizações por apenas 2 anos.
          Antes de <b>{mesLegivel(baseline.corteConfiavel.slice(0, 7))}</b> ela devolve números degradados (posts
          aparecem com mais curtidas do que alcance, o que é impossível). Usar aquele período jogaria a média pra
          baixo em até 80% e daria uma meta irreal.
          {baseline.descartadosPorQualidade > 0 &&
            ` Além do corte por período, ${baseline.descartadosPorQualidade} post(s) individuais foram descartados por terem números impossíveis.`}
        </div>
      )}

      {baseline.porFormato.length === 0 && (
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: C.cinza }}>
          Nenhum post elegível nessa janela.
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
