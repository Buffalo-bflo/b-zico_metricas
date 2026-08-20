"use client";

import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { SectionTitle } from "@/components/Brand";
import { C } from "@/lib/designTokens";
import { fmt } from "@/lib/metrics";
import { monthLabelCap, monthBounds, monthOnlyLabel } from "@/lib/months";
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
        color: positivo ? C.roxo : C.erro,
        marginLeft: 6,
      }}
    >
      {positivo ? "▲" : "▼"} {Math.abs(v).toFixed(0)}%
    </span>
  );
}

const seletorStyle = {
  fontFamily: "'Montserrat', sans-serif",
  fontSize: 12,
  padding: "6px 10px",
  border: `1px solid ${C.linha}`,
  borderRadius: 20,
  color: C.preto,
  background: C.branco,
  cursor: "pointer",
} as const;

// Um período por vez, escolhido em Ano → Mês (→ Semana, se for o caso) — em vez de uma
// grade única com todas as semanas do ano marcáveis, que virava uma parede de botões
// assim que o histórico passou a ter vários anos.
function SlotPicker({
  meses,
  semanas,
  granularidade,
  jaAdicionados,
  onAdd,
}: {
  meses: string[];
  semanas: { start: string; end: string }[];
  granularidade: "mes" | "semana";
  jaAdicionados: string[];
  onAdd: (p: Periodo) => void;
}) {
  const anos = useMemo(() => Array.from(new Set(meses.map((m) => m.slice(0, 4)))).sort().reverse(), [meses]);
  const [ano, setAno] = useState(anos[0] ?? "");
  const mesesDoAno = useMemo(() => meses.filter((m) => m.startsWith(ano)), [meses, ano]);
  const [mes, setMes] = useState(mesesDoAno[0] ?? "");
  const semanasDoMes = useMemo(
    () => semanas.filter((s) => s.start.slice(0, 7) === mes || s.end.slice(0, 7) === mes),
    [semanas, mes]
  );
  const [semanaStart, setSemanaStart] = useState(semanasDoMes[0]?.start ?? "");

  const onAnoChange = (novoAno: string) => {
    setAno(novoAno);
    const primeiroMes = meses.find((m) => m.startsWith(novoAno)) ?? "";
    setMes(primeiroMes);
    const sems = semanas.filter((s) => s.start.slice(0, 7) === primeiroMes || s.end.slice(0, 7) === primeiroMes);
    setSemanaStart(sems[0]?.start ?? "");
  };

  const onMesChange = (novoMes: string) => {
    setMes(novoMes);
    const sems = semanas.filter((s) => s.start.slice(0, 7) === novoMes || s.end.slice(0, 7) === novoMes);
    setSemanaStart(sems[0]?.start ?? "");
  };

  const periodo: Periodo | null = useMemo(() => {
    if (!mes) return null;
    if (granularidade === "mes") {
      const { start, end } = monthBounds(mes);
      return { key: start, start, end, label: monthLabelCap(mes) };
    }
    const semana = semanasDoMes.find((s) => s.start === semanaStart);
    if (!semana) return null;
    return { key: semana.start, start: semana.start, end: semana.end, label: weekLabel(semana.start, semana.end) };
  }, [mes, semanaStart, granularidade, semanasDoMes]);

  const duplicado = !!periodo && jaAdicionados.includes(periodo.key);

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <select value={ano} onChange={(e) => onAnoChange(e.target.value)} className="baz-touch-target" style={seletorStyle}>
        {anos.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
      <select value={mes} onChange={(e) => onMesChange(e.target.value)} className="baz-touch-target" style={seletorStyle}>
        {mesesDoAno.map((m) => (
          <option key={m} value={m}>
            {monthOnlyLabel(m)}
          </option>
        ))}
      </select>
      {granularidade === "semana" && (
        <select
          value={semanaStart}
          onChange={(e) => setSemanaStart(e.target.value)}
          className="baz-touch-target"
          style={seletorStyle}
        >
          {semanasDoMes.map((s) => (
            <option key={s.start} value={s.start}>
              {weekLabel(s.start, s.end)}
            </option>
          ))}
        </select>
      )}
      <button
        onClick={() => periodo && onAdd(periodo)}
        disabled={!periodo || duplicado}
        className="baz-touch-target baz-btn-primary"
        title={duplicado ? "Esse período já está na comparação" : undefined}
        style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: 12,
          fontWeight: 700,
          padding: "6px 14px",
          background: !periodo || duplicado ? C.linha : C.preto,
          color: !periodo || duplicado ? C.cinza : C.branco,
          border: "none",
          borderRadius: 20,
          cursor: !periodo || duplicado ? "not-allowed" : "pointer",
        }}
      >
        {duplicado ? "Já adicionado" : "+ Adicionar período"}
      </button>
    </div>
  );
}

export function CompararClient({
  meses,
  semanas,
  corteConfiavel,
}: {
  meses: string[];
  semanas: { start: string; end: string }[];
  corteConfiavel: string | null;
}) {
  const [granularidade, setGranularidade] = useState<"mes" | "semana">("mes");
  const [resolvidos, setResolvidos] = useState<Periodo[]>([]);

  // Trocar de mês pra semana (ou vice-versa) esvazia a seleção — misturar as duas não faz
  // sentido pro gráfico (o eixo é "dia do mês" numa e "dia da semana" na outra).
  const [granularidadeAnterior, setGranularidadeAnterior] = useState(granularidade);
  if (granularidade !== granularidadeAnterior) {
    setGranularidadeAnterior(granularidade);
    setResolvidos([]);
  }

  const [dados, setDados] = useState<MesResultado[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [metricaChart, setMetricaChart] = useState("alcance");

  useEffect(() => {
    if (resolvidos.length === 0) return;
    // Ligar o "carregando" antes da busca é o mesmo padrão do exemplo oficial do React
    // pra buscar dado num efeito (react.dev/learn/you-might-not-need-an-effect#fetching-data)
    // — não é o caso de "estado derivado de prop" que essa regra existe pra evitar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCarregando(true);
    const query = resolvidos.map((p) => `${p.start}:${p.end}`).join(",");
    fetch(`/api/compare?periods=${query}`)
      .then((r) => r.json())
      .then((d) => setDados(d.resultado ?? []))
      .finally(() => setCarregando(false));
  }, [resolvidos]);

  const adicionarPeriodo = (p: Periodo) => {
    setResolvidos((prev) => (prev.some((x) => x.key === p.key) ? prev : [...prev, p]));
  };
  const removerPeriodo = (key: string) => {
    setResolvidos((prev) => prev.filter((p) => p.key !== key));
  };

  const labelPorStart = useMemo(
    () => Object.fromEntries(resolvidos.map((p) => [p.start, p.label])),
    [resolvidos]
  );

  // Períodos selecionados que caem antes do limite de 2 anos da Meta — comparar o
  // alcance deles com um período recente produziria uma conclusão falsa.
  const periodosNaoConfiaveis = useMemo(
    () => resolvidos.filter((p) => !corteConfiavel || p.start < corteConfiavel),
    [resolvidos, corteConfiavel]
  );

  // Quando a seleção fica vazia, o efeito acima não busca nada — mas os dados do
  // pedido anterior continuam em `dados` até uma nova busca. Ignorar aqui evita
  // mostrar resultado de uma seleção que o usuário já desmarcou.
  const dadosOrdenados = useMemo(
    () => (resolvidos.length === 0 ? [] : [...dados].sort((a, b) => a.start.localeCompare(b.start))),
    [dados, resolvidos]
  );

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
      <div className="baz-stagger">
        <SectionTitle>Comparar {granularidade === "mes" ? "meses" : "semanas"}</SectionTitle>

        <div
          style={{
            background: C.branco,
            border: `1px solid ${C.linha}`,
            borderRadius: 6,
            padding: "14px 18px",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", gap: 4 }}>
            {(["mes", "semana"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGranularidade(g)}
                className="baz-touch-target"
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

          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.linha}`, display: "flex", flexDirection: "column", gap: 10 }}>
            {resolvidos.map((p, i) => (
            <div
              key={p.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                background: C.roxoTint,
                borderRadius: 6,
                width: "fit-content",
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  color: C.roxo,
                }}
              >
                Período {i + 1}
              </span>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 700, color: C.preto }}>
                {p.label}
              </span>
              <button
                onClick={() => removerPeriodo(p.key)}
                className="baz-touch-target"
                title="Remover período"
                style={{ background: "transparent", border: "none", color: C.cinza, cursor: "pointer", fontSize: 14, lineHeight: 1 }}
              >
                ×
              </button>
            </div>
          ))}

          {resolvidos.length < 4 ? (
            <SlotPicker
              meses={meses}
              semanas={semanas}
              granularidade={granularidade}
              jaAdicionados={resolvidos.map((p) => p.key)}
              onAdd={adicionarPeriodo}
            />
          ) : (
            <p style={{ ...linhaStyle, margin: 0 }}>Máximo de 4 períodos — remova um pra trocar.</p>
          )}
        </div>
      </div>
      </div>

      {granularidade === "semana" && (
        <p style={{ ...linhaStyle, marginTop: -12, marginBottom: 16 }}>
          Semanas vão de domingo a sábado — quando uma semana cai na virada do mês (ex: 26/07 – 01/08), ela
          aparece inteira, com os dias dos dois meses somados.
        </p>
      )}

      {periodosNaoConfiaveis.length > 0 && (
        <div
          style={{
            background: `${C.erro}12`,
            border: `1px solid ${C.erro}`,
            borderRadius: 4,
            padding: "12px 14px",
            fontSize: 12,
            color: C.preto,
            lineHeight: 1.6,
            marginBottom: 16,
          }}
        >
          <b>Comparação inválida para alcance e visualizações.</b> {periodosNaoConfiaveis.length === 1 ? "O período" : "Os períodos"}{" "}
          <b>{periodosNaoConfiaveis.map((p) => p.label).join(", ")}</b>{" "}
          {periodosNaoConfiaveis.length === 1 ? "está" : "estão"} fora da janela de 2 anos em que a Meta guarda
          essas métricas — os números vêm degradados, e a diferença percentual mostrada abaixo vai parecer um
          crescimento enorme que não existiu de verdade. Curtidas, comentários, compartilhamentos e salvamentos
          continuam comparáveis normalmente.
        </div>
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
                background: C.avisoFundo,
                border: `1px solid ${C.aviso}`,
                borderRadius: 4,
                padding: "10px 14px",
                marginBottom: 16,
                fontSize: 12,
                color: C.avisoTexto,
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
                      className="baz-num"
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
                          className="baz-num"
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
                        <td key={m.start} className="baz-num" style={{ padding: "9px 10px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.preto }}>
                          {m.seguidoresManual ? fmt(m.seguidoresManual.ganhos) : "—"}
                        </td>
                      ))}
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${C.linha}` }}>
                      <td style={{ padding: "9px 10px", fontSize: 12, color: C.preto }}>Seguidores perdidos (manual)</td>
                      {dadosOrdenados.map((m) => (
                        <td key={m.start} className="baz-num" style={{ padding: "9px 10px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.preto }}>
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
                    className="baz-touch-target"
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
