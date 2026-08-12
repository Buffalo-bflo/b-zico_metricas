import { supabaseServer } from "@/lib/supabase/server";
import { SectionTitle } from "@/components/Brand";
import { FeedTable, type FeedTableRow } from "@/components/FeedTable";
import { C } from "@/lib/designTokens";
import { resolvePeriod, type PeriodSearchParams } from "@/lib/period";

export const dynamic = "force-dynamic";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<PeriodSearchParams>;
}) {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("feed_posts")
    .select("id, post_type, description, post_date, views, reach, likes, comments, shares, saves, follows")
    .order("post_date", { ascending: false });

  if (error) {
    return (
      <div className="baz-fade-up">
        <SectionTitle>Feed</SectionTitle>
        <p style={{ color: "#B3261E", fontSize: 13 }}>Erro ao buscar dados: {error.message}</p>
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

  const period = await resolvePeriod(await searchParams);
  const doMes = posts.filter((p) => p.post_date >= period.start && p.post_date <= period.end);

  return (
    <div className="baz-fade-up">
      <FeedTable posts={doMes} totalGeral={doMes.length} />
    </div>
  );
}
