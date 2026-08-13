// Importação única do histórico completo da conta, direto da API da Meta.
//
// Roda LOCALMENTE (node scripts/backfill.mjs), não na Vercel — são milhares de chamadas
// à API e a Vercel corta qualquer função que passe de 60 segundos. Aqui pode levar horas
// sem problema.
//
// É retomável: guarda o progresso em scripts/.backfill-state.json. Se a internet cair ou
// você fechar o terminal, é só rodar de novo que ele continua de onde parou, sem
// reprocessar o que já foi salvo.
//
// Uso:
//   node scripts/backfill.mjs           -> importa tudo (posts desde 2020 + métricas diárias)
//   node scripts/backfill.mjs --posts   -> só os posts
//   node scripts/backfill.mjs --daily   -> só as métricas diárias
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "fs";

const STATE_FILE = "scripts/.backfill-state.json";
const PAUSA_MS = 220; // ~4,5 chamadas/segundo — folgado dentro do limite da Meta

const env = Object.fromEntries(
  readFileSync(".env.local", "utf-8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data: creds } = await supabase.from("meta_integration").select("*").eq("id", true).maybeSingle();
if (!creds) {
  console.error("Integração com a Meta não configurada no banco.");
  process.exit(1);
}
const TOKEN = creds.page_access_token;
const IG = creds.ig_user_id;

const state = existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, "utf-8")) : { postsFeitos: [], diasFeitos: [] };
const salvarEstado = () => writeFileSync(STATE_FILE, JSON.stringify(state));
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(path, params, tentativa = 1) {
  const url = new URL(`https://graph.facebook.com/v26.0/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", TOKEN);
  const res = await fetch(url);
  const json = await res.json();
  // Código 4 e 17 = limite de chamadas atingido. Espera e tenta de novo em vez de abortar.
  if (json.error && [4, 17, 32, 613].includes(json.error.code) && tentativa <= 6) {
    const espera = 60_000 * tentativa;
    console.log(`  ! limite da Meta atingido, esperando ${espera / 1000}s (tentativa ${tentativa})`);
    await dormir(espera);
    return get(path, params, tentativa + 1);
  }
  return json;
}

function mapPostType(item) {
  if (item.media_product_type === "REELS") return "Reels";
  if (item.media_type === "CAROUSEL_ALBUM") return "Carrossel";
  if (item.media_type === "IMAGE") return "Imagem";
  if (item.media_type === "VIDEO") return "Reels";
  return null;
}

async function backfillPosts(ano) {
  console.log(`\n=== POSTS DO FEED${ano ? ` — ANO ${ano}` : " (histórico completo)"} ===`);
  let after;
  let lote = [];
  let total = 0;
  let pulados = 0;
  let paramosDeVez = false;

  while (!paramosDeVez) {
    const params = { fields: "id,caption,timestamp,permalink,media_type,media_product_type", limit: "100" };
    if (after) params.after = after;
    const page = await get(`${IG}/media`, params);
    if (page.error) {
      console.error("  erro ao listar mídia:", page.error.message);
      break;
    }
    if (!page.data?.length) break;

    for (const item of page.data) {
      // /media vem do mais novo pro mais antigo, então quando passamos do ano-alvo
      // dá pra parar de vez em vez de varrer o resto do histórico à toa.
      const anoDoPost = Number(item.timestamp.slice(0, 4));
      if (ano && anoDoPost > ano) continue;
      if (ano && anoDoPost < ano) {
        paramosDeVez = true;
        break;
      }

      if (item.media_product_type === "STORY") continue;
      const tipo = mapPostType(item);
      if (tipo === null) continue;
      if (state.postsFeitos.includes(item.id)) {
        pulados++;
        continue;
      }

      const metricas =
        tipo === "Reels" ? "reach,views,likes,comments,shares,saved" : "reach,views,likes,comments,shares,saved,follows";
      const insights = await get(`${item.id}/insights`, { metric: metricas });
      await dormir(PAUSA_MS);

      // Posts muito antigos podem não ter mais insights — guardamos o post mesmo assim,
      // com zeros, pra não perder o registro de que ele existiu.
      const byName = Object.fromEntries((insights.data ?? []).map((m) => [m.name, m.values?.[0]?.value ?? 0]));

      lote.push({
        id: item.id,
        account_username: "sejabazico",
        post_type: tipo,
        raw_post_type: item.media_product_type,
        description: item.caption ?? "",
        permalink: item.permalink ?? "",
        published_at: item.timestamp,
        post_date: item.timestamp.slice(0, 10),
        duration_seconds: null,
        views: byName.views ?? 0,
        reach: byName.reach ?? 0,
        likes: byName.likes ?? 0,
        shares: byName.shares ?? 0,
        follows: byName.follows ?? 0,
        comments: byName.comments ?? 0,
        saves: byName.saved ?? 0,
        source_file: "backfill-api",
      });
      state.postsFeitos.push(item.id);
      total++;

      if (lote.length >= 50) {
        const { error } = await supabase.from("feed_posts").upsert(lote, { onConflict: "id" });
        if (error) console.error("  erro ao salvar lote:", error.message);
        else console.log(`  salvos ${total} posts (último: ${lote[lote.length - 1].post_date})`);
        lote = [];
        salvarEstado();
      }
    }

    if (paramosDeVez) break;
    after = page.paging?.cursors?.after;
    if (!page.paging?.next) break;
  }

  if (lote.length) {
    const { error } = await supabase.from("feed_posts").upsert(lote, { onConflict: "id" });
    if (error) console.error("  erro ao salvar lote final:", error.message);
    salvarEstado();
  }
  console.log(`  TOTAL: ${total} posts novos importados, ${pulados} já existiam.`);
}

const TIME_SERIES = ["reach", "follower_count"];
const TOTAL_VALUE = ["profile_views", "total_interactions", "views"];
const NOMES = {
  reach: "alcance",
  follower_count: "seguidores",
  profile_views: "visitas",
  total_interactions: "interacoes",
  views: "views",
};

function addDays(iso, n) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

async function backfillDaily() {
  console.log("\n=== MÉTRICAS DIÁRIAS DA CONTA (limite da Meta: 2 anos) ===");
  const hoje = new Date().toISOString().slice(0, 10);
  // 2 anos menos alguns dias de margem — a Meta recusa qualquer data mais antiga.
  let inicio = addDays(hoje, -720);
  let linhas = [];

  // Métricas em série temporal: dá pra pedir em blocos de 30 dias, muito mais rápido.
  let cursor = inicio;
  while (cursor < hoje) {
    const fim = addDays(cursor, 30) > hoje ? hoje : addDays(cursor, 30);
    const r = await get(`${IG}/insights`, {
      metric: TIME_SERIES.join(","),
      period: "day",
      since: cursor,
      until: addDays(fim, 1),
    });
    await dormir(PAUSA_MS);
    if (r.error) {
      console.log(`  ${cursor}: ${r.error.message.slice(0, 80)}`);
    } else {
      for (const m of r.data ?? []) {
        const nome = NOMES[m.name];
        if (!nome) continue;
        for (const v of m.values ?? []) {
          linhas.push({ metric_date: v.end_time.slice(0, 10), metric_type: nome, value: v.value });
        }
      }
      console.log(`  série ${cursor} → ${fim}: ${linhas.length} linhas acumuladas`);
    }
    cursor = addDays(fim, 1);
  }

  if (linhas.length) {
    for (let i = 0; i < linhas.length; i += 500) {
      const { error } = await supabase
        .from("daily_account_metrics")
        .upsert(linhas.slice(i, i + 500), { onConflict: "metric_date,metric_type" });
      if (error) console.error("  erro ao salvar série:", error.message);
    }
    console.log(`  ${linhas.length} linhas de série temporal salvas.`);
  }

  // As outras métricas só existem uma-por-dia — precisa de uma chamada por dia.
  console.log("  agora as métricas dia-a-dia (uma chamada por dia, é a parte demorada)...");
  let lote = [];
  let dias = 0;
  for (let dia = inicio; dia < hoje; dia = addDays(dia, 1)) {
    if (state.diasFeitos.includes(dia)) continue;
    const r = await get(`${IG}/insights`, {
      metric: TOTAL_VALUE.join(","),
      metric_type: "total_value",
      period: "day",
      since: dia,
      until: addDays(dia, 1),
    });
    await dormir(PAUSA_MS);
    if (!r.error) {
      for (const m of r.data ?? []) {
        const nome = NOMES[m.name];
        if (!nome || m.total_value === undefined) continue;
        lote.push({ metric_date: dia, metric_type: nome, value: m.total_value.value });
      }
    }
    state.diasFeitos.push(dia);
    dias++;

    if (lote.length >= 300) {
      const { error } = await supabase
        .from("daily_account_metrics")
        .upsert(lote, { onConflict: "metric_date,metric_type" });
      if (error) console.error("  erro ao salvar dia-a-dia:", error.message);
      else console.log(`  ${dias} dias processados (último: ${dia})`);
      lote = [];
      salvarEstado();
    }
  }
  if (lote.length) {
    await supabase.from("daily_account_metrics").upsert(lote, { onConflict: "metric_date,metric_type" });
    salvarEstado();
  }
  console.log(`  TOTAL: ${dias} dias processados.`);
}

const args = process.argv.slice(2);
const soPosts = args.includes("--posts");
const soDaily = args.includes("--daily");
const argAno = args.find((a) => a.startsWith("--ano="));
const ano = argAno ? Number(argAno.split("=")[1]) : null;

if (!soDaily) await backfillPosts(ano);
if (!soPosts) await backfillDaily();

console.log("\nPronto.");
