"use client";

import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { SectionTitle } from "@/components/Brand";
import { C } from "@/lib/designTokens";
import { fmt } from "@/lib/metrics";
import { monthLabelCap, monthBounds } from "@/lib/months";
import { weekLabel } from "@/lib/weeks";

type MesResultado = {
  start: string;
  end: string;
  posts: number;
  stories: number;
  feed: { views: number; reach: number; interacoes: number; novosSeguidores: number };
  diario: Record<string, number>;
  serie: { diaOffset: number; metric_date: string; metric_type: string; value: number }[];
  seguidoresManual: { ganhos: number; perdidos: number } | null;
};

type Periodo = { key: string; start: string; end: string; label: string };

const LINE_COLORS = [C.roxo, C.roxoEscuro, "#B79ACB", C.creme];

const METRIC_OPTIONS = [
  { key: "alcance", label: "Alcance" },
  { key: "views", label: "Visualizações" },
  { key: "visitas", label: "Visitas ao Perfil" },
  { key: "cliques", label: "Cliques no Link" },
  { key: "interacoes", label: "Interações" },
  { key: "seguidores", label: "Novos Seguidores" },
];

function delta(atual: number, anterior: number) {
  if (anterior === 0) return null;
  return ((atual - anterior) / anterior) * 100;
}

function DeltaBadge({ v }: { v: number | null }) {
  if (v === null) return null;
  const positivo = v >= 0;
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        fontWeight: 700,
        color: positivo ? C.roxo : "#B3261E",
        marginLeft: 6,
      }}
    >
      {positivo ? "▲" : "▼"} {Math.abs(v).toFixed(0)}%
    </span>
  );
}

export function CompararClient({
  meses,
  semanas,
}: {
  meses: string[];
  semanas: { start: string; end: string }[];
}) {
  const [granularidade, setGranularidade] = useState<"mes" | "semana">("mes");

  const periodosDisponiveis: Periodo[] = useMemo(() => {
    if (granularidade === "mes") {
      return meses.map((m) => {
        const { start, end } = monthBounds(m);
        return { key: start, start, end, label: monthLabelCap(m) };
      });
    }
    return semanas.map((s) => ({
      key: s.start,
      start: s.start,
      end: s.end,
      label: weekLabel(s.start, s.end),
    }));
  }, [granularidade, meses, semanas]);

  const [selecionados, setSelecionados] = useState<string[]>(() => periodosDisponiveis.slice(0, 2).map((p) => p.key));

  useEffect(() => {
    setSelecionados(periodosDisponiveis.slice(0, 2).map((p) => p.key));
  }, [granularidade]); // eslint-disable-line react-hooks/exhaustive-deps

  const [dados, setDados] = useState<MesResultado[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [metricaChart, setMetricaChart] = useState("alcance");

  useEffect(() => {
    if (selecionados.length === 0) {
      setDados([]);
      return;
    }
    const periodosSelecionados = periodosDisponiveis.filter((p) => selecionados.includes(p.key));
    if (periodosSelecionados.length === 0) return;
    setCarregando(true);
    const query = periodosSelecionados.map((p) => `${p.start}:${p.end}`).join(",");
    fetch(`/api/compare?periods=${query}`)
      .then((r) => r.json())
      .then((d) => setDados(d.resultado ?? []))
      .finally(() => setCarregando(false));
  }, [selecionados, periodosDisponiveis]);

  const toggleKey = (key: string) => {
    setSelecionados((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= 4) return prev;
      return [...prev, key].sort();
    });
  };

  const labelPorStart = useMemo(
    () => Object.fromEntries(periodosDisponiveis.map((p) => [p.start, p.label])),
    [periodosDisponiveis]
  );

  const dadosOrdenados = useMemo(() => [...dados].sort((a, b) => a.start.localeCompare(b.start)), [dados]);

  const chartData = useMemo(() => {
    const porDia = new Map<number, Record<string, number | undefined>>();
    for (const m of dadosOrdenados) {
      for (const p of m.serie) {
        if (p.metric_type !== metricaChart) continue;
        const row = porDia.get(p.diaOffset) ?? { diaOffset: p.diaOffset };
        row[m.start] = p.value;
        porDia.set(p.diaOffset, row);
      }
    }
    return Array.from(porDia.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, row]) => row);
  }, [dadosOrdenados, metricaChart]);

  const linhaStyle = { fontFamily: "'Montserrat', sans-serif", fontSize: 11, color: C.cinza };

  function diasComDados(m: MesResultado): number {
    return new Set(m.serie.map((p) => p.diaOffset)).size;
  }

  const eixoXLabel = granularidade === "mes" ? "dia do mês" : "dia da semana";

  return (
    <div className="baz-fade-up">
      <SectionTitle>Comparar {granularidade === "mes" ? "meses" : "semanas"}</SectionTitle>

      <div
        style={{
          background: C.branco,
          border: `1px solid ${C.linha}`,
          borderRadius: 6,
          padding: "14px 18px",
          marginBottom: 20,
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: 4 }}>
          {(["mes", "semana"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGranularidade(g)}
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: 12,
                fontWeight: granularidade === g ? 700 : 400,
                padding: "6px 14px",
                background: granularidade === g ? C.roxo : "transparent",
                color: granularidade === g ? C.branco : C.preto,
                border: `1px solid ${C.roxo}`,
                borderRadius: 20,
                cursor: "pointer",
              }}
            >
              {g === "mes" ? "Por mês" : "Por semana"}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 20, background: C.linha }} />
        <span style={{ ...linhaStyle, marginRight: -8 }}>
          {granularidade === "mes" ? "Meses" : "Semanas"} (até 4):
        </span>
        {periodosDisponiveis.map((p) => {
          const ativo = selecionados.includes(p.key);
          return (
            <button
              key={p.key}
              onClick={() => toggleKey(p.key)}
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: 12,
                fontWeight: ativo ? 700 : 400,
                padding: "6px 12px",
                background: ativo ? C.preto : "transparent",
                color: ativo ? C.branco : C.preto,
                border: `1px solid ${C.preto}`,
                borderRadius: 20,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {granularidade === "semana" && (
        <p style={{ ...linhaStyle, marginTop: -12, marginBottom: 16 }}>
          Semanas vão de domingo a sábado — quando uma semana cai na virada do mês (ex: 26/07 – 01/08), ela
          aparece inteira, com os dias dos dois meses somados.
        </p>
      )}

      {carregando && <p style={{ ...linhaStyle }}>Carregando...</p>}

      {!carregando && dadosOrdenados.length === 0 && (
        <p style={linhaStyle}>Selecione pelo menos um {granularidade === "mes" ? "mês" : "semana"} pra comparar.</p>
      )}

      {!carregando && dadosOrdenados.length > 0 && (
        <>
          {new Set(dadosOrdenados.map(diasComDados)).size > 1 && (
            <div
              style={{
                background: "#FFF4E5",
                border: "1px solid #F0B429",
                borderRadius: 4,
                padding: "10px 14px",
                marginBottom: 16,
                fontSize: 12,
                color: "#7A4A00",
              }}
            >
              Atenção: os períodos selecionados têm quantidades diferentes de dias com dados (veja a linha
              &quot;Dias com dados&quot; abaixo) — comparar os totais direto pode enganar. Um período parcial vai
              parecer menor mesmo sem ter caído de verdade.
            </div>
          )}
          <div style={{ overflowX: "auto", marginBottom: 24 }}>
            <table>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.preto}` }}>
                  <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 10, textTransform: "uppercase", color: C.cinza }}>
                    Métrica
                  </th>
                  {dadosOrdenados.map((m) => (
                    <th
                      key={m.start}
                      style={{
                        textAlign: "right",
                        padding: "8px 10px",
                        fontSize: 11,
                        color: C.preto,
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {labelPorStart[m.start] ?? m.start}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: `1px solid ${C.linha}`, background: C.roxoTint }}>
                  <td style={{ padding: "9px 10px", fontSize: 12, color: C.roxoEscuro, fontWeight: 700 }}>
                    Dias com dados
                  </td>
                  {dadosOrdenados.map((m) => (
                    <td
                      key={m.start}
                      style={{
                        padding: "9px 10px",
                        textAlign: "right",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 12,
                        fontWeight: 700,
                        color: C.roxoEscuro,
                      }}
                    >
                      {diasComDados(m)}
                    </td>
                  ))}
                </tr>
                {[
                  { label: "Posts de feed", get: (m: MesResultado) => m.posts },
                  { label: "Stories", get: (m: MesResultado) => m.stories },
                  { label: "Views (posts)", get: (m: MesResultado) => m.feed.views },
                  { label: "Alcance (posts)", get: (m: MesResultado) => m.feed.reach },
                  { label: "Interações (posts)", get: (m: MesResultado) => m.feed.interacoes },
                  { label: "Alcance — soma diária", get: (m: MesResultado) => m.diario.alcance ?? 0 },
                  { label: "Views — soma diária", get: (m: MesResultado) => m.diario.views ?? 0 },
                  { label: "Novos seguidores — soma diária", get: (m: MesResultado) => m.diario.seguidores ?? 0 },
                ].map((row) => (
                  <tr key={row.label} style={{ borderBottom: `1px solid ${C.linha}` }}>
                    <td style={{ padding: "9px 10px", fontSize: 12, color: C.preto }}>{row.label}</td>
                    {dadosOrdenados.map((m, i) => {
                      const valor = row.get(m);
                      const anterior = i > 0 ? row.get(dadosOrdenados[i - 1]) : null;
                      return (
                        <td
                          key={m.start}
                          style={{
                            padding: "9px 10px",
                            textAlign: "right",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 12,
                            color: C.preto,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {fmt(valor)}
                          {anterior !== null && <DeltaBadge v={delta(valor, anterior)} />}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {dadosOrdenados.some((m) => m.seguidoresManual) && (
                  <>
                    <tr style={{ borderBottom: `1px solid ${C.linha}` }}>
                      <td style={{ padding: "9px 10px", fontSize: 12, color: C.preto }}>Seguidores ganhos (manual)</td>
                      {dadosOrdenados.map((m) => (
                        <td key={m.start} style={{ padding: "9px 10px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.preto }}>
                          {m.seguidoresManual ? fmt(m.seguidoresManual.ganhos) : "—"}
                        </td>
                      ))}
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${C.linha}` }}>
                      <td style={{ padding: "9px 10px", fontSize: 12, color: C.preto }}>Seguidores perdidos (manual)</td>
                      {dadosOrdenados.map((m) => (
                        <td key={m.start} style={{ padding: "9px 10px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.preto }}>
                          {m.seguidoresManual ? fmt(m.seguidoresManual.perdidos) : "—"}
                        </td>
                      ))}
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
          <p style={{ ...linhaStyle, marginTop: -14, marginBottom: 24 }}>
            &quot;Soma diária&quot; de Alcance não é o mesmo que o alcance único do período mostrado no Meta
            Business Suite — a mesma pessoa pode ser contada em mais de um dia. Use essa linha pra comparar a
            tendência entre períodos, não como o número oficial.
          </p>

          <div style={{ background: C.branco, border: `1px solid ${C.linha}`, borderRadius: 4, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.preto }}>Tendência diária — períodos sobrepostos por dia</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {METRIC_OPTIONS.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setMetricaChart(m.key)}
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: 11,
                      fontWeight: metricaChart === m.key ? 700 : 300,
                      padding: "5px 10px",
                      background: metricaChart === m.key ? C.roxoTint : "transparent",
                      color: metricaChart === m.key ? C.roxo : C.cinza,
                      border: `1px solid ${metricaChart === m.key ? C.roxo : C.linha}`,
                      borderRadius: 20,
                      cursor: "pointer",
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <p style={{ ...linhaStyle, marginTop: -8, marginBottom: 4 }}>Eixo horizontal: {eixoXLabel}</p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.linha} vertical={false} />
                <XAxis
                  dataKey="diaOffset"
                  tick={{ fontSize: 10, fontFamily: "'Montserrat', sans-serif", fill: C.cinza }}
                  axisLine={{ stroke: C.linha }}
                  tickLine={false}
                  tickFormatter={(v: number) => String(v + 1)}
                />
                <YAxis
                  tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fill: C.cinza }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => fmt(v)}
                />
                <Tooltip
                  contentStyle={{ background: C.preto, border: "none", borderRadius: 3, fontFamily: "'Montserrat', sans-serif", fontSize: 12 }}
                  labelStyle={{ color: C.creme }}
                  labelFormatter={(v) => `${eixoXLabel} ${Number(v) + 1}`}
                  formatter={(value) => fmt(Number(value))}
                />
                <Legend
                  height={28}
                  wrapperStyle={{ fontSize: 11, fontFamily: "'Montserrat', sans-serif", paddingTop: 8 }}
                  formatter={(v: string) => labelPorStart[v] ?? v}
                />
                {dadosOrdenados.map((m, i) => (
                  <Line
                    key={m.start}
                    type="monotone"
                    dataKey={m.start}
                    name={m.start}
                    stroke={LINE_COLORS[i % LINE_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
