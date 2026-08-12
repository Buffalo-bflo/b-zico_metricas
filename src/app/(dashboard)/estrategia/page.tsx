import { supabaseServer } from "@/lib/supabase/server";
import { SectionTitle } from "@/components/Brand";
import { EstrategiaClient } from "@/components/EstrategiaClient";
import { RecomendacaoSection } from "@/components/RecomendacaoSection";
import { C } from "@/lib/designTokens";
import { monthBounds, getAvailableMonths } from "@/lib/months";
import { buildWeeklyPrompt } from "@/lib/promptBuilder";

export const dynamic = "force-dynamic";

export default async function EstrategiaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const supabase = supabaseServer();
  const { data: posts, error } = await supabase
    .from("feed_posts")
    .select("id, post_type, description, post_date, views")
    .order("post_date", { ascending: true });

  if (error) {
    return (
      <div className="baz-fade-up">
        <SectionTitle>Estratégia</SectionTitle>
        <p style={{ color: "#B3261E", fontSize: 13 }}>Erro ao buscar dados: {error.message}</p>
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

  const meses = await getAvailableMonths();
  const mesSelecionado = mes && meses.includes(mes) ? mes : meses[0];
  const doMes = posts.filter((p) => p.post_date.startsWith(mesSelecionado));
  const { start, end } = monthBounds(mesSelecionado);

  const { data: tagsData } = await supabase.from("post_tags").select("*");
  const tags = Object.fromEntries((tagsData ?? []).map((t) => [t.post_id, t]));

  const { data: seguidores } = await supabase
    .from("monthly_follower_summary")
    .select("*")
    .eq("period_start", start)
    .eq("period_end", end)
    .maybeSingle();

  const { data: horario } = await supabase
    .from("best_posting_time")
    .select("*")
    .eq("period_start", start)
    .eq("period_end", end)
    .eq("day_of_week", "")
    .maybeSingle();

  const { data: contexto } = await supabase.from("weekly_context").select("*").eq("id", true).maybeSingle();

  const { data: ultimaRecomendacao } = await supabase
    .from("ai_recommendations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const marcados = doMes
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
    }));

  const prompt = buildWeeklyPrompt({
    mes: mesSelecionado,
    totalPosts: doMes.length,
    marcados,
    seguidoresPeriodo: seguidores?.period_label ?? "",
    seguidoresGanhos: seguidores?.gained ?? 0,
    seguidoresPerdidos: seguidores?.lost ?? 0,
    melhorHorario: horario?.peak_window ?? "",
    contexto: contexto?.context_text ?? "",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <EstrategiaClient
        posts={doMes}
        tags={tags}
        mesAtivo={mesSelecionado}
        seguidoresInicial={seguidores}
        horarioInicial={horario}
        contextoInicial={contexto?.context_text ?? ""}
      />
      <RecomendacaoSection
        prompt={prompt}
        contextoAtual={contexto?.context_text ?? ""}
        recomendacaoInicial={ultimaRecomendacao ?? null}
      />
    </div>
  );
}
