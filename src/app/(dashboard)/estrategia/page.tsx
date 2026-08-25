import { supabaseServer } from "@/lib/supabase/server";
import { SectionTitle } from "@/components/Brand";
import { EstrategiaClient } from "@/components/EstrategiaClient";
import { RecomendacaoSection } from "@/components/RecomendacaoSection";
import { ProjecaoSection } from "@/components/ProjecaoSection";
import { C } from "@/lib/designTokens";
import { resolvePeriod, type PeriodSearchParams } from "@/lib/period";
import { fmtDate } from "@/lib/metrics";
import { buildWeeklyPrompt } from "@/lib/promptBuilder";
import { computeWeeklyProjection } from "@/lib/projection";
import { computeBaseline, type JanelaBaseline } from "@/lib/baseline";
import { BaselineSection } from "@/components/BaselineSection";
import { avaliarQualidade, periodoConfiavel } from "@/lib/dataQuality";
import { AvisoQualidade } from "@/components/AvisoQualidade";

export const dynamic = "force-dynamic";

export default async function EstrategiaPage({
  searchParams,
}: {
  searchParams: Promise<PeriodSearchParams>;
}) {
  const sp = await searchParams;
  const supabase = supabaseServer();
  const period = await resolvePeriod(sp);
  const janela = ((sp as Record<string, string>).baseline ?? "12m") as JanelaBaseline;

  // Todas essas consultas são independentes entre si — rodam juntas em vez de uma
  // esperando a outra. Numa página com muitas consultas isso é a diferença entre
  // "clica e espera" e "abre na hora".
  const [
    { data: posts, error },
    { data: tagsData },
    { data: seguidores },
    { data: horario },
    { data: notasData },
    { data: ultimaRecomendacao },
    projecaoData,
    baseline,
    qualidade,
  ] = await Promise.all([
    supabase
      .from("feed_posts")
      .select("id, post_type, description, post_date, views, is_reels_teste")
      .gte("post_date", period.start)
      .lte("post_date", period.end)
      .order("post_date", { ascending: true }),
    supabase.from("post_tags").select("*"),
    supabase
      .from("monthly_follower_summary")
      .select("*")
      .eq("period_start", period.start)
      .eq("period_end", period.end)
      .maybeSingle(),
    supabase
      .from("best_posting_time")
      .select("*")
      .eq("period_start", period.start)
      .eq("period_end", period.end)
      .eq("day_of_week", "")
      .maybeSingle(),
    supabase.from("context_notes").select("*").order("event_date_start", { ascending: true }),
    supabase.from("ai_recommendations").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    computeWeeklyProjection(),
    computeBaseline(janela),
    avaliarQualidade(),
  ]);

  if (error) {
    return (
      <div className="baz-fade-up">
        <SectionTitle>Estratégia</SectionTitle>
        <p style={{ color: C.erro, fontSize: 13 }}>Erro ao buscar dados: {error.message}</p>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="baz-fade-up">
        <SectionTitle>Estratégia</SectionTitle>
        <p style={{ color: C.cinza, fontSize: 13 }}>
          Nenhum post encontrado ainda. Suba o CSV de Conteúdo (Feed) na tela de upload.
        </p>
      </div>
    );
  }

  // Reels-teste (variações publicadas só pra experimentar) não entram na fila de
  // marcação editorial nem nos totais daqui — ficam pendentes na aba Testes até
  // serem agrupados em Grupo A/B.
  const doPeriodo = posts.filter((p) => !p.is_reels_teste);
  const tags = Object.fromEntries((tagsData ?? []).map((t) => [t.post_id, t]));
  const notas = notasData ?? [];

  const marcados = doPeriodo
    .filter((p) => tags[p.id])
    .map((p) => ({
      post_type: p.post_type,
      description: p.description,
      views: p.views,
      editorial_line: tags[p.id].editorial_line,
      content_mode: tags[p.id].content_mode,
      hypothesis: tags[p.id].hypothesis,
      hypothesis_status: tags[p.id].hypothesis_status,
      origin: tags[p.id].origin,
      actual_result: tags[p.id].actual_result,
      strategic_objective: tags[p.id].strategic_objective,
    }));

  // "Padrão fixo" e status vazio (conteúdo de rotina, status agora é opcional) não são
  // hipótese sendo testada, então ficam fora dessa contagem — senão o total não bateria
  // com a soma de confirmadas/refutadas/observando.
  const todasTags = tagsData ?? [];
  const tagsComoHipotese = todasTags.filter((t) => t.hypothesis_status && t.hypothesis_status !== "Padrão fixo");
  const testesResumo = {
    total: tagsComoHipotese.length,
    confirmadas: tagsComoHipotese.filter((t) => t.hypothesis_status === "Confirmada").length,
    refutadas: tagsComoHipotese.filter((t) => t.hypothesis_status === "Refutada").length,
    observando: tagsComoHipotese.filter((t) => t.hypothesis_status === "Observar").length,
  };

  const contextoTexto = notas.length
    ? notas
        .map((n) =>
          n.event_date_start === n.event_date_end
            ? `- ${fmtDate(n.event_date_start)}: ${n.note}`
            : `- ${fmtDate(n.event_date_start)} a ${fmtDate(n.event_date_end)}: ${n.note}`
        )
        .join("\n")
    : "";

  const prompt = buildWeeklyPrompt({
    periodoLabel: period.label,
    totalPosts: doPeriodo.length,
    marcados,
    seguidoresPeriodo: seguidores?.period_label ?? "",
    seguidoresGanhos: seguidores?.gained ?? 0,
    seguidoresPerdidos: seguidores?.lost ?? 0,
    melhorHorario: horario?.peak_window ?? "",
    contexto: contextoTexto,
  });

  const confiavel = periodoConfiavel(period.start, qualidade.corte);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {!confiavel && <AvisoQualidade corte={qualidade.corte} periodoLabel={period.label} />}
      <EstrategiaClient
        posts={doPeriodo}
        tags={tags}
        period={{ start: period.start, end: period.end, label: period.label }}
        seguidoresInicial={seguidores}
        horarioInicial={horario}
        notasIniciais={notas}
      />
      <BaselineSection baseline={baseline} />
      <ProjecaoSection projecaoData={projecaoData} testesResumo={testesResumo} />
      <RecomendacaoSection
        prompt={prompt}
        contextoAtual={contextoTexto}
        recomendacaoInicial={ultimaRecomendacao ?? null}
      />
    </div>
  );
}
