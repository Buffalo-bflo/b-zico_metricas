import { supabaseServer } from "@/lib/supabase/server";
import { SectionTitle, KpiCard } from "@/components/Brand";
import { FormatBarChart } from "@/components/FormatBarChart";
import { DailyTrendChart, type DailyPoint } from "@/components/DailyTrendChart";
import { C, TIPO_COLORS } from "@/lib/designTokens";
import { fmt, fmtDate, median } from "@/lib/metrics";
import { resolvePeriod, type PeriodSearchParams } from "@/lib/period";
import { avaliarQualidade, periodoConfiavel } from "@/lib/dataQuality";
import { AvisoQualidade } from "@/components/AvisoQualidade";

export const dynamic = "force-dynamic";

type FeedRow = {
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
};

export default async function GeralPage({
  searchParams,
}: {
  searchParams: Promise<PeriodSearchParams>;
}) {
  const supabase = supabaseServer();
  const period = await resolvePeriod(await searchParams);

  const [{ data, error }, { data: dailyRaw }, qualidade] = await Promise.all([
    supabase
      .from("feed_posts")
      .select("id, post_type, description, post_date, views, reach, likes, comments, shares, saves, follows")
      .gte("post_date", period.start)
      .lte("post_date", period.end)
      .order("post_date", { ascending: false }),
    supabase
      .from("daily_account_metrics")
      .select("*")
      .gte("metric_date", period.start)
      .lte("metric_date", period.end)
      .order("metric_date", { ascending: true }),
    avaliarQualidade(),
  ]);

  if (error) {
    return (
      <div className="baz-fade-up">
        <SectionTitle>Visão Geral</SectionTitle>
        <p style={{ color: "#B3261E", fontSize: 13 }}>Erro ao buscar dados: {error.message}</p>
      </div>
    );
  }

  const posts = (data ?? []) as FeedRow[];

  if (posts.length === 0) {
    return (
      <div className="baz-fade-up">
        <SectionTitle>Visão Geral</SectionTitle>
        <p style={{ color: C.cinza, fontSize: 13 }}>
          Nenhum post encontrado ainda. Suba o CSV de Conteúdo (Feed) na tela de upload pra ver
          os números aqui.
        </p>
      </div>
    );
  }

  const doMes = posts;

  const totais = doMes.reduce(
    (acc, p) => ({
      views: acc.views + p.views,
      reach: acc.reach + p.reach,
      interacoes: acc.interacoes + p.likes + p.comments + p.shares + p.saves,
      novosSeguidores: acc.novosSeguidores + p.follows,
    }),
    { views: 0, reach: 0, interacoes: 0, novosSeguidores: 0 }
  );

  const tipos = ["Reels", "Carrossel", "Imagem"];
  const porTipo = tipos
    .map((tipo) => {
      const doTipo = doMes.filter((p) => p.post_type === tipo);
      return {
        tipo,
        qtd: doTipo.length,
        medianaViews: median(doTipo.map((p) => p.views)),
      };
    })
    .filter((t) => t.qtd > 0);

  const ordenadoPorViews = [...doMes].sort((a, b) => b.views - a.views);
  const melhor = ordenadoPorViews[0];
  const pior = ordenadoPorViews[ordenadoPorViews.length - 1];

  const dailyMap = new Map<string, DailyPoint>();
  for (const row of dailyRaw ?? []) {
    const pt =
      dailyMap.get(row.metric_date) ??
      ({ metric_date: row.metric_date, alcance: 0, views: 0, visitas: 0, cliques: 0, interacoes: 0, seguidores: 0 } as DailyPoint);
    (pt as unknown as Record<string, number>)[row.metric_type] = Number(row.value);
    dailyMap.set(row.metric_date, pt);
  }
  const daily = Array.from(dailyMap.values()).sort((a, b) => a.metric_date.localeCompare(b.metric_date));

  return (
    <div className="baz-fade-up">
      <SectionTitle>Visão Geral</SectionTitle>
      <p style={{ color: C.cinza, fontSize: 12, marginTop: -8, marginBottom: 20 }}>
        {period.label} · {doMes.length} posts de feed
      </p>

      {!periodoConfiavel(period.start, qualidade.corte) && (
        <AvisoQualidade corte={qualidade.corte} periodoLabel={period.label} />
      )}

      {daily.length > 0 && <DailyTrendChart data={daily} />}

      <div className="baz-stagger" style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
        <KpiCard label="Posts" value={doMes.length} />
        <KpiCard label="Views" value={fmt(totais.views)} />
        <KpiCard label="Alcance" value={fmt(totais.reach)} />
        <KpiCard label="Interações" value={fmt(totais.interacoes)} />
        <KpiCard label="Novos Seguidores (via posts)" value={fmt(totais.novosSeguidores)} accent={C.roxoEscuro} />
      </div>

      <div className="baz-row-2col-even" style={{ marginBottom: 24 }}>
        <div style={{ background: C.branco, border: `1px solid ${C.linha}`, borderRadius: 6, padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.preto, marginBottom: 10 }}>
            Mediana de views por formato
          </div>
          <FormatBarChart data={porTipo} />
          <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
            {porTipo.map((t) => (
              <div key={t.tipo} style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 11, color: C.cinza }}>
                <span style={{ color: TIPO_COLORS[t.tipo], fontWeight: 700 }}>●</span> {t.tipo} ({t.qtd})
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          {melhor && (
            <div style={{ background: C.roxoTint, border: `1px solid ${C.roxo}22`, borderRadius: 6, padding: "14px 18px" }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: C.cinza, marginBottom: 4 }}>
                Melhor post (views)
              </div>
              <div style={{ fontSize: 13, color: C.preto, marginBottom: 2 }}>
                {melhor.description?.split("\n")[0].slice(0, 70)}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: C.roxo }}>
                {fmt(melhor.views)} views
              </div>
              <div style={{ fontSize: 11, color: C.cinza }}>
                {melhor.post_type} · {fmtDate(melhor.post_date)}
              </div>
            </div>
          )}
          {pior && pior.id !== melhor?.id && (
            <div style={{ background: C.branco, border: `1px solid ${C.linha}`, borderRadius: 6, padding: "14px 18px" }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: C.cinza, marginBottom: 4 }}>
                Pior post (views)
              </div>
              <div style={{ fontSize: 13, color: C.preto, marginBottom: 2 }}>
                {pior.description?.split("\n")[0].slice(0, 70)}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: C.cinza }}>
                {fmt(pior.views)} views
              </div>
              <div style={{ fontSize: 11, color: C.cinza }}>
                {pior.post_type} · {fmtDate(pior.post_date)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
