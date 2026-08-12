import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { parseFeedStoriesCsv } from "@/lib/parsers/feedStoriesParser";
import { parseDailyMetricCsv } from "@/lib/parsers/dailyMetricParser";
import { parsePublicoCsv } from "@/lib/parsers/publicoParser";
import { decodeCsvBuffer } from "@/lib/parsers/shared";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  const tipo = form.get("tipo");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }

  const supabase = supabaseServer();

  if (tipo === "feed_stories") {
    const csvText = await file.text();
    const { feedPosts, storyPosts, errors } = parseFeedStoriesCsv(csvText, file.name);
    const dbErrors: string[] = [...errors];

    if (feedPosts.length > 0) {
      const { error } = await supabase.from("feed_posts").upsert(feedPosts, { onConflict: "id" });
      if (error) dbErrors.push(`Erro ao salvar posts de feed: ${error.message}`);
    }
    if (storyPosts.length > 0) {
      const { error } = await supabase.from("story_posts").upsert(storyPosts, { onConflict: "id" });
      if (error) dbErrors.push(`Erro ao salvar stories: ${error.message}`);
    }

    return NextResponse.json({ feedCount: feedPosts.length, storyCount: storyPosts.length, errors: dbErrors });
  }

  if (tipo === "daily_metric") {
    const csvText = decodeCsvBuffer(await file.arrayBuffer());
    const { rows, errors } = parseDailyMetricCsv(csvText);
    const dbErrors: string[] = [...errors];

    if (rows.length > 0) {
      const { error } = await supabase
        .from("daily_account_metrics")
        .upsert(rows, { onConflict: "metric_date,metric_type" });
      if (error) dbErrors.push(`Erro ao salvar métricas diárias: ${error.message}`);
    }

    return NextResponse.json({ metricRows: rows.length, errors: dbErrors });
  }

  if (tipo === "publico") {
    const csvText = decodeCsvBuffer(await file.arrayBuffer());
    const { snapshot, errors } = parsePublicoCsv(csvText);
    const dbErrors: string[] = [...errors];

    const snapshotDate = (form.get("snapshotDate") as string) || new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("audience_snapshots").upsert(
      {
        snapshot_date: snapshotDate,
        age_gender: snapshot.age_gender,
        top_cities: snapshot.top_cities,
        top_countries: snapshot.top_countries,
        top_pages: snapshot.top_pages,
      },
      { onConflict: "snapshot_date" }
    );
    if (error) dbErrors.push(`Erro ao salvar público: ${error.message}`);

    return NextResponse.json({
      ageGenderCount: snapshot.age_gender.length,
      citiesCount: snapshot.top_cities.length,
      countriesCount: snapshot.top_countries.length,
      errors: dbErrors,
    });
  }

  return NextResponse.json({ error: `Tipo de arquivo "${tipo}" ainda não suportado.` }, { status: 400 });
}
