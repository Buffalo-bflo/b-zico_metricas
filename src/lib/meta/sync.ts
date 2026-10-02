import { graphGet, getMetaCredentials } from "@/lib/meta/client";
import { supabaseServer } from "@/lib/supabase/server";

export type SyncResult = {
  dailyMetricRows: number;
  feedPosts: number;
  storyPosts: number;
  publicoSalvo: boolean;
  errors: string[];
};

const TIME_SERIES_METRICS = ["reach", "follower_count"];
// "follows_and_unfollows" está aqui de propósito, mesmo sem retornar dado ainda pra
// conta da Bázico (testamos várias vezes na sondagem). O código já ignora métricas
// sem valor (linha abaixo), então não custa nada tentar todo dia — no dia em que a
// Meta começar a devolver esse dado, ele passa a ser salvo sozinho, sem precisar
// mexer em mais nada.
const TOTAL_VALUE_METRICS = ["profile_views", "total_interactions", "views", "follows_and_unfollows"];

// Nome da métrica na API da Meta -> nome que já usamos no banco (mesmo dos CSVs).
const METRIC_NAME_MAP: Record<string, string> = {
  reach: "alcance",
  follower_count: "seguidores",
  profile_views: "visitas",
  total_interactions: "interacoes",
  views: "views",
  follows_and_unfollows: "seguidores_liquido",
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
  // Só vem preenchido em Reels. false = ainda não está no perfil/grade, que é como a Meta
  // representa um Reel de teste (Trial Reel) que não foi compartilhado com os seguidores.
  is_shared_to_feed?: boolean;
};

// Trial Reels só existem a partir de agosto/2026 pra essa conta. Reels antigos (2021–2024
// e maio/2026) também têm is_shared_to_feed=false, mas por outro motivo (o reel foi
// publicado sem a opção "compartilhar no feed") — não são testes e não devem ser marcados.
const REELS_TESTE_DESDE = "2026-08-01";

function mapPostType(item: MediaItem): string | null {
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
): Promise<{ feedPosts: Record<string, unknown>[]; errors: string[] }> {
  const feedPosts: Record<string, unknown>[] = [];
  const errors: string[] = [];

  let after: string | undefined;
  let done = false;

  // Protege a função inteira: se a Meta recusar a chamada (token revogado, permissão
  // retirada, app bloqueado etc.), o erro vira um item em `errors` em vez de derrubar
  // toda a sincronização — as métricas diárias, Stories e Público continuam rodando
  // normalmente mesmo que só o Feed esteja com problema.
  try {
    while (!done) {
      const params: Record<string, string> = {
        fields: "id,caption,timestamp,permalink,media_type,media_product_type,is_shared_to_feed",
        limit: "25",
      };
      if (after) params.after = after;

      const page = await graphGet<{ data: MediaItem[]; paging?: { cursors?: { after?: string } } }>(
        `${igUserId}/media`,
        params,
        token
      );

      for (const item of page.data ?? []) {
        if (item.media_product_type === "STORY") continue; // Stories vêm de /stories, não de /media
        const postDate = item.timestamp.slice(0, 10);
        if (postDate < sinceIso) {
          done = true;
          break;
        }

        const tipo = mapPostType(item);
        if (tipo === null) continue;

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
            shared_to_feed: tipo === "Reels" ? (item.is_shared_to_feed ?? null) : null,
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
  } catch (e) {
    errors.push(`Lista de posts do feed: ${e instanceof Error ? e.message : String(e)}`);
  }

  return { feedPosts, errors };
}

// A sincronização do Feed só olha os últimos dias. Mas o Gustavo pode liberar um reel de
// teste pros seguidores semanas depois (ou o Instagram pode liberar ao fim das 72h). Por
// isso, todo dia, cada teste ainda em aberto é consultado individualmente: se a Meta disser
// que ele já está no perfil, ele vira "teste que foi pro feed".
async function reverificarTestesAbertos(token: string): Promise<string[]> {
  const errors: string[] = [];
  const supabase = supabaseServer();
  const { data: abertos, error } = await supabase
    .from("feed_posts")
    .select("id")
    .eq("foi_reels_teste", true)
    .eq("is_reels_teste", true)
    .eq("post_type", "Reels")
    .limit(60);
  if (error) return [`Testes em aberto: ${error.message}`];

  const hoje = new Date().toISOString().slice(0, 10);
  for (const { id } of abertos ?? []) {
    try {
      const r = await graphGet<{ is_shared_to_feed?: boolean }>(id, { fields: "is_shared_to_feed" }, token);
      if (r.is_shared_to_feed === true) {
        const { error: upErr } = await supabase
          .from("feed_posts")
          .update({ shared_to_feed: true, is_reels_teste: false, promovido_em: hoje })
          .eq("id", id);
        if (upErr) errors.push(`Teste ${id}: ${upErr.message}`);
      }
    } catch (e) {
      errors.push(`Teste ${id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return errors;
}

type StoryItem = { id: string; timestamp: string; media_type: string; caption?: string };

// A Meta só mantém insights de Stories por 24h — o endpoint /stories só lista as que
// ainda estão ativas agora. Por isso essa sincronização precisa rodar todo dia (é o
// que o Vercel Cron faz); se um dia o job falhar, os Stories daquele dia se perdem
// de vez, sem jeito de recuperar depois — não é um bug, é como a própria Meta funciona.
async function syncStories(
  igUserId: string,
  token: string
): Promise<{ storyPosts: Record<string, unknown>[]; linkClicksPorDia: Map<string, number>; errors: string[] }> {
  const storyPosts: Record<string, unknown>[] = [];
  const linkClicksPorDia = new Map<string, number>();
  const errors: string[] = [];

  try {
    // "caption" não é documentado pra Stories (só pra Feed), mas tentamos mesmo assim —
    // se a Meta rejeitar o campo, caímos pro pedido sem ele em vez de perder o dia inteiro.
    let page: { data: StoryItem[] };
    try {
      page = await graphGet<{ data: StoryItem[] }>(
        `${igUserId}/stories`,
        { fields: "id,timestamp,media_type,caption" },
        token
      );
    } catch {
      page = await graphGet<{ data: StoryItem[] }>(
        `${igUserId}/stories`,
        { fields: "id,timestamp,media_type" },
        token
      );
    }

    for (const item of page.data ?? []) {
      const postDate = item.timestamp.slice(0, 10);
      try {
        const insights = await graphGet<{ data: { name: string; values: { value: number }[] }[] }>(
          `${item.id}/insights`,
          { metric: "reach,views,replies,navigation,link_clicks,follows" },
          token
        );
        const byName = Object.fromEntries(
          (insights.data ?? []).map((m) => [m.name, m.values?.[0]?.value ?? 0])
        );

        storyPosts.push({
          id: item.id,
          account_username: "sejabazico",
          description: item.caption ?? "",
          media_type: item.media_type ?? "",
          published_at: item.timestamp,
          post_date: postDate,
          views: byName.views ?? 0,
          reach: byName.reach ?? 0,
          link_clicks: byName.link_clicks ?? 0,
          replies: byName.replies ?? 0,
          follows: byName.follows ?? 0,
          source_file: "sync-api",
        });

        linkClicksPorDia.set(postDate, (linkClicksPorDia.get(postDate) ?? 0) + (byName.link_clicks ?? 0));
      } catch (e) {
        errors.push(`Story ${item.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch (e) {
    errors.push(`Lista de stories: ${e instanceof Error ? e.message : String(e)}`);
  }

  return { storyPosts, linkClicksPorDia, errors };
}

type DemographicBreakdown = { dimension_keys: string[]; results: { dimension_values: string[]; value: number }[] };

async function fetchDemographicBreakdown(
  igUserId: string,
  token: string,
  breakdown: string
): Promise<DemographicBreakdown[]> {
  const data = await graphGet<{ data: { total_value?: { breakdowns?: DemographicBreakdown[] } }[] }>(
    `${igUserId}/insights`,
    {
      metric: "follower_demographics",
      period: "lifetime",
      metric_type: "total_value",
      timeframe: "this_month",
      breakdown,
    },
    token
  );
  return data.data?.[0]?.total_value?.breakdowns ?? [];
}

// Público é sempre um retrato do momento (a Meta não guarda histórico diário disso),
// então cada sincronização gera um snapshot novo, igual ao upload manual do CSV.
async function syncPublico(
  igUserId: string,
  token: string
): Promise<{ snapshot: Record<string, unknown> | null; errors: string[] }> {
  const errors: string[] = [];
  try {
    const [ageGender, cities, countries] = await Promise.all([
      fetchDemographicBreakdown(igUserId, token, "age,gender"),
      fetchDemographicBreakdown(igUserId, token, "city"),
      fetchDemographicBreakdown(igUserId, token, "country"),
    ]);

    const ageGenderRows: Record<string, { homens: number; mulheres: number }> = {};
    for (const r of ageGender[0]?.results ?? []) {
      const [faixa, genero] = r.dimension_values;
      ageGenderRows[faixa] ??= { homens: 0, mulheres: 0 };
      if (genero === "M") ageGenderRows[faixa].homens += r.value;
      else if (genero === "F") ageGenderRows[faixa].mulheres += r.value;
    }
    // O gráfico espera percentual do total de seguidores (igual ao CSV da Meta), não a
    // contagem bruta de pessoas — sem isso o eixo "%" do gráfico mostrava números absurdos.
    const totalAgeGender =
      Object.values(ageGenderRows).reduce((a, v) => a + v.homens + v.mulheres, 0) || 1;
    const age_gender = Object.entries(ageGenderRows).map(([faixa, v]) => ({
      faixa,
      homens: Math.round((v.homens / totalAgeGender) * 1000) / 10,
      mulheres: Math.round((v.mulheres / totalAgeGender) * 1000) / 10,
    }));

    const totalCidades = (cities[0]?.results ?? []).reduce((a, r) => a + r.value, 0) || 1;
    const top_cities = (cities[0]?.results ?? [])
      .map((r) => ({ local: r.dimension_values[0], pct: Math.round((r.value / totalCidades) * 1000) / 10 }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 10);

    const totalPaises = (countries[0]?.results ?? []).reduce((a, r) => a + r.value, 0) || 1;
    const top_countries = (countries[0]?.results ?? [])
      .map((r) => ({ local: r.dimension_values[0], pct: Math.round((r.value / totalPaises) * 1000) / 10 }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 10);

    return {
      snapshot: {
        snapshot_date: new Date().toISOString().slice(0, 10),
        age_gender,
        top_cities,
        top_countries,
        top_pages: [],
      },
      errors,
    };
  } catch (e) {
    errors.push(`Público: ${e instanceof Error ? e.message : String(e)}`);
    return { snapshot: null, errors };
  }
}

// Sincroniza Feed, métricas diárias, Stories ativos agora e um snapshot de Público.
// Seguidores perdidos continua manual — o campo existe na API (follows_and_unfollows)
// mas não tem retornado dado nenhum pra essa conta ainda.
export async function runMetaSync(diasAtras = 10): Promise<SyncResult> {
  const creds = await getMetaCredentials();
  if (!creds) {
    return { dailyMetricRows: 0, feedPosts: 0, storyPosts: 0, publicoSalvo: false, errors: ["Integração com a Meta não configurada."] };
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

  const { storyPosts, linkClicksPorDia, errors: storyErrors } = await syncStories(creds.igUserId, creds.pageAccessToken);
  errors.push(...storyErrors);

  // "Cliques no link" vem da soma dos Stories ativos agora, por dia — só cobre os dias
  // que ainda tinham Story disponível na hora da sincronização.
  for (const [dia, cliques] of linkClicksPorDia) {
    dailyRows.push({ metric_date: dia, metric_type: "cliques", value: cliques });
  }

  if (dailyRows.length > 0) {
    const { error } = await supabase
      .from("daily_account_metrics")
      .upsert(dailyRows, { onConflict: "metric_date,metric_type" });
    if (error) errors.push(`Erro ao salvar métricas diárias: ${error.message}`);
  }

  const { feedPosts, errors: feedErrors } = await syncFeedMedia(creds.igUserId, creds.pageAccessToken, desde);
  errors.push(...feedErrors);

  if (feedPosts.length > 0) {
    // A Meta degrada alcance/views de posts com mais de 2 anos, e continua devolvendo
    // um número menor em vez de um erro. Como nosso banco guarda o valor original, nunca
    // deixamos uma sincronização rebaixar um número que já temos — senão o próprio robô
    // diário iria, silenciosamente, destruir o histórico com o passar do tempo.
    const ids = feedPosts.map((p) => p.id as string);
    const { data: existentes } = await supabase
      .from("feed_posts")
      .select("id, reach, views, is_reels_teste, foi_reels_teste, promovido_em")
      .in("id", ids);
    const anterior = new Map((existentes ?? []).map((p) => [p.id, p]));
    const hojeIso = new Date().toISOString().slice(0, 10);
    for (const p of feedPosts) {
      const antes = anterior.get(p.id as string);
      if (antes) {
        p.reach = Math.max(Number(p.reach ?? 0), Number(antes.reach ?? 0));
        p.views = Math.max(Number(p.views ?? 0), Number(antes.views ?? 0));
      }

      // Todo objeto do upsert precisa ter as mesmas chaves, então estes três campos são
      // sempre enviados — partindo do valor que já está no banco pra nunca desfazer uma
      // marcação manual da aba Feed nem esquecer que um reel nasceu como teste.
      let isTeste = antes?.is_reels_teste ?? false;
      let foiTeste = antes?.foi_reels_teste ?? false;
      let promovidoEm: string | null = antes?.promovido_em ?? null;

      if (p.post_type === "Reels" && (p.post_date as string) >= REELS_TESTE_DESDE) {
        if (p.shared_to_feed === false && !foiTeste) {
          // Descoberto agora como teste em andamento (só acontece uma vez por reel: depois
          // disso a caixinha manual da aba Feed volta a mandar).
          isTeste = true;
          foiTeste = true;
        } else if (p.shared_to_feed === true && foiTeste && isTeste) {
          // Era teste e agora está no perfil: o teste funcionou. Passa a contar como
          // conteúdo normal e fica destacado como "teste que foi pro feed".
          isTeste = false;
          promovidoEm = hojeIso;
        }
      }

      p.is_reels_teste = isTeste;
      p.foi_reels_teste = foiTeste;
      p.promovido_em = promovidoEm;
    }

    const { error } = await supabase.from("feed_posts").upsert(feedPosts, { onConflict: "id" });
    if (error) errors.push(`Erro ao salvar posts de feed: ${error.message}`);
  }

  errors.push(...(await reverificarTestesAbertos(creds.pageAccessToken)));

  if (storyPosts.length > 0) {
    const { error } = await supabase.from("story_posts").upsert(storyPosts, { onConflict: "id" });
    if (error) errors.push(`Erro ao salvar stories: ${error.message}`);
  }

  const { snapshot, errors: publicoErrors } = await syncPublico(creds.igUserId, creds.pageAccessToken);
  errors.push(...publicoErrors);

  let publicoSalvo = false;
  if (snapshot) {
    const { error } = await supabase.from("audience_snapshots").upsert(snapshot, { onConflict: "snapshot_date" });
    if (error) errors.push(`Erro ao salvar público: ${error.message}`);
    else publicoSalvo = true;
  }

  return {
    dailyMetricRows: dailyRows.length,
    feedPosts: feedPosts.length,
    storyPosts: storyPosts.length,
    publicoSalvo,
    errors,
  };
}
