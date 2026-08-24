import { supabaseServer } from "@/lib/supabase/server";
import { SectionTitle } from "@/components/Brand";
import { FeedTable, type FeedTableRow } from "@/components/FeedTable";
import { C } from "@/lib/designTokens";
import { resolvePeriod, type PeriodSearchParams } from "@/lib/period";
import { avaliarQualidade, periodoConfiavel } from "@/lib/dataQuality";
import { AvisoQualidade } from "@/components/AvisoQualidade";

export const dynamic = "force-dynamic";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<PeriodSearchParams>;
}) {
  const supabase = supabaseServer();
  const period = await resolvePeriod(await searchParams);
  const [{ data, error }, qualidade] = await Promise.all([
    supabase
      .from("feed_posts")
      .select("id, post_type, description, post_date, views, reach, likes, comments, shares, saves, follows, paid_boost, is_reels_teste")
      .gte("post_date", period.start)
      .lte("post_date", period.end)
      .order("post_date", { ascending: false }),
    avaliarQualidade(),
  ]);

  if (error) {
    return (
      <div className="baz-fade-up">
        <SectionTitle>Feed</SectionTitle>
        <p style={{ color: C.erro, fontSize: 13 }}>Erro ao buscar dados: {error.message}</p>
      </div>
    );
  }

  const posts = (data ?? []) as FeedTableRow[];

  if (posts.length === 0) {
    return (
      <div className="baz-fade-up">
        <SectionTitle>Feed</SectionTitle>
        <p style={{ color: C.cinza, fontSize: 13 }}>
          Nenhum post encontrado ainda. Suba o CSV de Conteúdo (Feed) na tela de upload.
        </p>
      </div>
    );
  }

  return (
    <div className="baz-fade-up">
      {!periodoConfiavel(period.start, qualidade.corte) && (
        <AvisoQualidade corte={qualidade.corte} periodoLabel={period.label} />
      )}
      <FeedTable posts={posts} totalGeral={posts.length} />
    </div>
  );
}
