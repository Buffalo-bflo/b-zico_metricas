// Confere uma amostra aleatória de posts já salvos contra o que a API da Meta devolve
// agora — serve pra pegar erro de gravação (campo trocado, valor zerado, tipo errado).
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf-8").split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data: creds } = await supabase.from("meta_integration").select("*").eq("id", true).maybeSingle();
const TOKEN = creds.page_access_token;

async function get(path, params) {
  const url = new URL(`https://graph.facebook.com/v26.0/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", TOKEN);
  return (await fetch(url)).json();
}

const ano = process.argv[2] ?? "2025";
const { data: posts } = await supabase
  .from("feed_posts").select("*")
  .gte("post_date", `${ano}-01-01`).lte("post_date", `${ano}-12-31`);

const amostra = posts.sort(() => Math.random() - 0.5).slice(0, 6);
console.log(`Conferindo ${amostra.length} posts de ${ano} (de ${posts.length} salvos)\n`);

let okTudo = true;
for (const p of amostra) {
  const metricas = p.post_type === "Reels" ? "reach,views,likes,comments,shares,saved" : "reach,views,likes,comments,shares,saved,follows";
  const r = await get(`${p.id}/insights`, { metric: metricas });
  if (r.error) { console.log(`  ${p.post_date} ${p.post_type}: API recusou (${r.error.message.slice(0,60)})`); continue; }
  const api = Object.fromEntries((r.data ?? []).map((m) => [m.name, m.values?.[0]?.value ?? 0]));
  const cmp = [["views", p.views, api.views], ["reach", p.reach, api.reach], ["likes", p.likes, api.likes], ["comments", p.comments, api.comments], ["shares", p.shares, api.shares], ["saves", p.saves, api.saved]];
  const difs = cmp.filter(([, banco, apiV]) => banco !== apiV);
  if (difs.length === 0) console.log(`  OK  ${p.post_date} ${p.post_type.padEnd(9)} views=${p.views}`);
  else { okTudo = false; console.log(`  DIF ${p.post_date} ${p.post_type}: ${difs.map(([k, b, a]) => `${k} banco=${b} api=${a}`).join(", ")}`); }
  await new Promise((r) => setTimeout(r, 250));
}
console.log(okTudo ? "\nTudo batendo." : "\nHouve diferencas (pode ser crescimento organico natural desde a importacao).");
