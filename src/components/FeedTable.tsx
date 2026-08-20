"use client";

import { useMemo, useState } from "react";
import { SectionTitle } from "@/components/Brand";
import { C, TIPO_COLORS } from "@/lib/designTokens";
import { fmt, fmtDate } from "@/lib/metrics";

export type FeedTableRow = {
  id: string;
  post_type: string;
  description: string;
  post_date: string;
  views: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  follows: number;
  paid_boost: boolean;
};

const ORDENAR_OPTS: { key: keyof FeedTableRow; label: string }[] = [
  { key: "views", label: "Ordenar: Views" },
  { key: "reach", label: "Ordenar: Alcance" },
  { key: "likes", label: "Ordenar: Curtidas" },
  { key: "comments", label: "Ordenar: Comentários" },
  { key: "saves", label: "Ordenar: Salvamentos" },
];

export function FeedTable({ posts: postsIniciais, totalGeral }: { posts: FeedTableRow[]; totalGeral: number }) {
  const [posts, setPosts] = useState(postsIniciais);
  const [tipoFiltro, setTipoFiltro] = useState("Todos");
  const [ordenarPor, setOrdenarPor] = useState<keyof FeedTableRow>("views");

  const alternarImpulsionado = async (postId: string, valorAtual: boolean) => {
    const novoValor = !valorAtual;
    setPosts((ps) => ps.map((p) => (p.id === postId ? { ...p, paid_boost: novoValor } : p)));
    await fetch("/api/feed-flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, paidBoost: novoValor }),
    });
  };

  const filtrado = useMemo(() => {
    const arr = tipoFiltro === "Todos" ? posts : posts.filter((p) => p.post_type === tipoFiltro);
    return [...arr].sort((a, b) => (b[ordenarPor] as number) - (a[ordenarPor] as number));
  }, [posts, tipoFiltro, ordenarPor]);

  return (
    <div
      className="baz-fade-in"
      style={{ background: C.branco, border: `1px solid ${C.linha}`, borderRadius: 4, padding: 20 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <SectionTitle>
          Posts do Feed — {filtrado.length} de {totalGeral}
        </SectionTitle>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {["Todos", "Reels", "Carrossel", "Imagem"].map((t) => (
            <button
              key={t}
              onClick={() => setTipoFiltro(t)}
              className="baz-touch-target"
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: 11,
                fontWeight: tipoFiltro === t ? 700 : 300,
                padding: "5px 12px",
                background: tipoFiltro === t ? C.preto : "transparent",
                color: tipoFiltro === t ? C.branco : C.preto,
                border: `1px solid ${C.preto}`,
                borderRadius: 20,
                cursor: "pointer",
              }}
            >
              {t}
            </button>
          ))}
          <select
            value={ordenarPor}
            onChange={(e) => setOrdenarPor(e.target.value as keyof FeedTableRow)}
            className="baz-touch-target"
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 11,
              padding: "6px 10px",
              border: `1px solid ${C.linha}`,
              borderRadius: 20,
              marginLeft: 6,
              color: C.preto,
              background: C.branco,
            }}
          >
            {ORDENAR_OPTS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.preto}` }}>
              {["Data", "Tipo", "Descrição", "Views", "Alcance", "Curtidas", "Coment.", "Compart.", "Salvos", "+Seg.", "Impuls.?"].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: h === "Descrição" ? "left" : "right",
                      padding: "8px 10px",
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: C.cinza,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filtrado.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: `1px solid ${C.linha}` }}>
                <td
                  style={{
                    padding: "9px 10px",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: C.cinza,
                    whiteSpace: "nowrap",
                  }}
                >
                  {fmtDate(p.post_date)}
                </td>
                <td style={{ padding: "9px 10px" }}>
                  <span
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                      color: TIPO_COLORS[p.post_type],
                      border: `1px solid ${TIPO_COLORS[p.post_type]}`,
                      borderRadius: 20,
                      padding: "2px 8px",
                    }}
                  >
                    {p.post_type}
                  </span>
                </td>
                <td
                  style={{
                    padding: "9px 10px",
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: 12,
                    color: C.preto,
                    maxWidth: 320,
                  }}
                >
                  {p.description?.split("\n")[0].slice(0, 90)}
                  {i === 0 && ordenarPor === "views" && (
                    <span style={{ marginLeft: 6, color: C.roxo, fontWeight: 700 }}>★</span>
                  )}
                </td>
                <td
                  style={{
                    padding: "9px 10px",
                    textAlign: "right",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.preto,
                  }}
                >
                  {fmt(p.views)}
                </td>
                <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.cinza }}>
                  {fmt(p.reach)}
                </td>
                <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.cinza }}>
                  {fmt(p.likes)}
                </td>
                <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.cinza }}>
                  {fmt(p.comments)}
                </td>
                <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.cinza }}>
                  {fmt(p.shares)}
                </td>
                <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.cinza }}>
                  {fmt(p.saves)}
                </td>
                <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.roxo }}>
                  {p.follows > 0 ? `+${p.follows}` : "—"}
                </td>
                <td style={{ padding: "9px 10px", textAlign: "right" }}>
                  <input
                    type="checkbox"
                    checked={p.paid_boost}
                    onChange={() => alternarImpulsionado(p.id, p.paid_boost)}
                    title="Marcar se esse post teve tráfego pago/impulsionamento — exclui ele da média de referência orgânica"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
