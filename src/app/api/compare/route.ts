import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const periodsParam = req.nextUrl.searchParams.get("periods");
  if (!periodsParam) {
    return NextResponse.json({ error: "Parâmetro periods é obrigatório." }, { status: 400 });
  }
  const periods = periodsParam
    .split(",")
    .filter(Boolean)
    .map((p) => {
      const [start, end] = p.split(":");
      return { start, end };
    });

  const supabase = supabaseServer();
  const resultado = [];

  for (const { start, end } of periods) {
    const { data: posts } = await supabase
      .from("feed_posts")
      .select("views, reach, likes, comments, shares, saves, follows")
      .gte("post_date", start)
      .lte("post_date", end);

    const { data: stories } = await supabase
      .from("story_posts")
      .select("id")
      .gte("post_date", start)
      .lte("post_date", end);

    const feedTotais = (posts ?? []).reduce(
      (acc, p) => ({
        views: acc.views + p.views,
        reach: acc.reach + p.reach,
        interacoes: acc.interacoes + p.likes + p.comments + p.shares + p.saves,
        novosSeguidores: acc.novosSeguidores + p.follows,
      }),
      { views: 0, reach: 0, interacoes: 0, novosSeguidores: 0 }
    );

    const { data: daily } = await supabase
      .from("daily_account_metrics")
      .select("*")
      .gte("metric_date", start)
      .lte("metric_date", end)
      .order("metric_date", { ascending: true });

    const dailySums: Record<string, number> = {};
    for (const row of daily ?? []) {
      dailySums[row.metric_type] = (dailySums[row.metric_type] ?? 0) + Number(row.value);
    }

    const startMs = new Date(start + "T00:00:00Z").getTime();
    const series = (daily ?? []).map((row) => {
      const rowMs = new Date(row.metric_date + "T00:00:00Z").getTime();
      const diaOffset = Math.round((rowMs - startMs) / 86400000);
      return {
        diaOffset,
        metric_date: row.metric_date,
        metric_type: row.metric_type,
        value: Number(row.value),
      };
    });

    const { data: seguidoresManual } = await supabase
      .from("monthly_follower_summary")
      .select("*")
      .eq("period_start", start)
      .eq("period_end", end)
      .maybeSingle();

    resultado.push({
      start,
      end,
      posts: posts?.length ?? 0,
      stories: stories?.length ?? 0,
      feed: feedTotais,
      diario: dailySums,
      serie: series,
      seguidoresManual: seguidoresManual
        ? { ganhos: seguidoresManual.gained, perdidos: seguidoresManual.lost }
        : null,
    });
  }

  return NextResponse.json({ resultado });
}
