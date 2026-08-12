import { graphGet, getMetaCredentials } from "@/lib/meta/client";
import { supabaseServer } from "@/lib/supabase/server";

export type SyncResult = {
  dailyMetricRows: number;
  feedPosts: number;
  storyPostsSkipped: number;
  errors: string[];
};

const TIME_SERIES_METRICS = ["reach", "follower_count"];
// "cliques" (Cliques no link) ficou de fora de propósito: testamos "website_clicks" e o
// valor não bateu com o CSV real (698 vs 4.063 num dia de pico) — provavelmente o CSV
// conta cliques em link de Stories, que ainda não sincronizamos automaticamente. Até
// achar a métrica certa, esse campo continua vindo só pelo upload de CSV.
const TOTAL_VALUE_METRICS = ["profile_views", "total_interactions", "views"];

// Nome da métrica na API da Meta -> nome que já usamos no banco (mesmo dos CSVs).
const METRIC_NAME_MAP: Record<string, string> = {
  reach: "alcance",
  follower_count: "seguidores",
  profile_views: "visitas",
  total_interactions: "interacoes",
  views: "views",
};

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function enumerateDates(sinceIso: string, untilIso: string): string[] {
  const dates: string[] = [];
  let cursor = sinceIso;
  while (cursor <= untilIso) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
}

// "since"/"until" da API da Meta são exclusivos do dia final — testamos isso na
// sondagem (since=01/08&until=10/08 devolveu só até 09/08). Por isso sempre somamos
// +1 dia no "until" que mandamos pra API quando queremos incluir aquele dia inteiro.
async function syncDailyMetrics(
  igUserId: string,
  token: string,
  sinceIso: string,
  untilIso: string
): Promise<{ rows: { metric_date: string; metric_type: string; value: number }[]; errors: string[] }> {
  const rows: { metric_date: string; metric_type: string; value: number }[] = [];
  const errors: string[] = [];

  try {
    const data = await graphGet<{ data: { name: string; values: { value: number; end_time: string }[] }[] }>(
      `${igUserId}/insights`,
      { metric: TIME_SERIES_METRICS.join(","), period: "day", since: sinceIso, until: addDays(untilIso, 1) },
      token
    );
    for (const metric of data.data ?? []) {
      const metricType = METRIC_NAME_MAP[metric.name];
      if (!metricType) continue;
      for (const v of metric.values) {
        rows.push({ metric_date: v.end_time.slice(0, 10), metric_type: metricType, value: v.value });
      }
    }
  } catch (e) {
    errors.push(`Métricas em série (alcance/seguidores): ${e instanceof Error ? e.message : String(e)}`);
  }

  for (const dia of enumerateDates(sinceIso, untilIso)) {
    try {
      const data = await graphGet<{ data: { name: string; total_value?: { value: number } }[] }>(
        `${igUserId}/insights`,
        {
          metric: TOTAL_VALUE_METRICS.join(","),
          metric_type: "total_value",
          period: "day",
          since: dia,
          until: addDays(dia, 1),
        },
        token
      );
      for (const metric of data.data ?? []) {
        const metricType = METRIC_NAME_MAP[metric.name];
        if (!metricType || metric.total_value === undefined) continue;
        rows.push({ metric_date: dia, metric_type: metricType, value: metric.total_value.value });
      }
    } catch (e) {
      errors.push(`Métricas do dia ${dia}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { rows, errors };
}

type MediaItem = {
  id: string;
  caption?: string;
  timestamp: string;
  permalink?: string;
  media_type: string;
  media_product_type: string;
};

function mapPostType(item: MediaItem): string | null {
  if (item.media_product_type === "STORY") return null; // Stories ficam pra próxima fase
  if (item.media_product_type === "REELS") return "Reels";
  if (item.media_type === "CAROUSEL_ALBUM") return "Carrossel";
  if (item.media_type === "IMAGE") return "Imagem";
  if (item.media_type === "VIDEO") return "Reels";
  return null;
}

async function syncFeedMedia(
  igUserId: string,
  token: string,
  sinceIso: string
): Promise<{
  feedPosts: Record<string, unknown>[];
  storyPostsSkipped: number;
  errors: string[];
}> {
  const feedPosts: Record<string, unknown>[] = [];
  const errors: string[] = [];
  let storyPostsSkipped = 0;

  let after: string | undefined;
  let done = false;

  while (!done) {
    const params: Record<string, string> = {
      fields: "id,caption,timestamp,permalink,media_type,media_product_type",
      limit: "25",
    };
    if (after) params.after = after;

    const page = await graphGet<{ data: MediaItem[]; paging?: { cursors?: { after?: string } } }>(
      `${igUserId}/media`,
      params,
      token
    );

    for (const item of page.data ?? []) {
      const postDate = item.timestamp.slice(0, 10);
      if (postDate < sinceIso) {
        done = true;
        break;
      }

      const tipo = mapPostType(item);
      if (tipo === null) {
        if (item.media_product_type === "STORY") storyPostsSkipped++;
        continue;
      }

      try {
        const metricsList =
          tipo === "Reels"
            ? "reach,views,likes,comments,shares,saved"
            : "reach,views,likes,comments,shares,saved,follows";
        const insights = await graphGet<{ data: { name: string; values: { value: number }[] }[] }>(
          `${item.id}/insights`,
          { metric: metricsList },
          token
        );
        const byName = Object.fromEntries(
          (insights.data ?? []).map((m) => [m.name, m.values?.[0]?.value ?? 0])
        );

        feedPosts.push({
          id: item.id,
          account_username: "sejabazico",
          post_type: tipo,
          raw_post_type: item.media_product_type,
          description: item.caption ?? "",
          permalink: item.permalink ?? "",
          published_at: item.timestamp,
          post_date: postDate,
          duration_seconds: null,
          views: byName.views ?? 0,
          reach: byName.reach ?? 0,
          likes: byName.likes ?? 0,
          shares: byName.shares ?? 0,
          follows: byName.follows ?? 0,
          comments: byName.comments ?? 0,
          saves: byName.saved ?? 0,
          source_file: "sync-api",
        });
      } catch (e) {
        errors.push(`Post ${item.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    after = page.paging?.cursors?.after;
    if (!after) done = true;
  }

  return { feedPosts, storyPostsSkipped, errors };
}

// Sincroniza os últimos `diasAtras` dias (métricas diárias + posts do feed). Não mexe
// em Stories nem em Seguidores perdidos/Público — essas continuam manuais por enquanto.
export async function runMetaSync(diasAtras = 10): Promise<SyncResult> {
  const creds = await getMetaCredentials();
  if (!creds) {
    return { dailyMetricRows: 0, feedPosts: 0, storyPostsSkipped: 0, errors: ["Integração com a Meta não configurada."] };
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const desde = addDays(hoje, -diasAtras);

  const errors: string[] = [];
  const supabase = supabaseServer();

  const { rows: dailyRows, errors: dailyErrors } = await syncDailyMetrics(
    creds.igUserId,
    creds.pageAccessToken,
    desde,
    hoje
  );
  errors.push(...dailyErrors);

  if (dailyRows.length > 0) {
    const { error } = await supabase
      .from("daily_account_metrics")
      .upsert(dailyRows, { onConflict: "metric_date,metric_type" });
    if (error) errors.push(`Erro ao salvar métricas diárias: ${error.message}`);
  }

  const { feedPosts, storyPostsSkipped, errors: feedErrors } = await syncFeedMedia(
    creds.igUserId,
    creds.pageAccessToken,
    desde
  );
  errors.push(...feedErrors);

  if (feedPosts.length > 0) {
    const { error } = await supabase.from("feed_posts").upsert(feedPosts, { onConflict: "id" });
    if (error) errors.push(`Erro ao salvar posts de feed: ${error.message}`);
  }

  return {
    dailyMetricRows: dailyRows.length,
    feedPosts: feedPosts.length,
    storyPostsSkipped,
    errors,
  };
}
