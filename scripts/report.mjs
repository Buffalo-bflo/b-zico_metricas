// Gera o relatório de melhores/piores conteúdos como um arquivo HTML autocontido.
// Não faz parte do app — é uma entrega avulsa, roda local e cospe um arquivo.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf-8").split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// O Supabase devolve no máximo 1.000 linhas por consulta — com quase 2 mil posts,
// pedir "tudo" silenciosamente cortaria os anos mais antigos. Por isso paginamos.
async function buscarTudo(tabela, colunas = "*") {
  const todos = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await supabase.from(tabela).select(colunas).range(de, de + 999);
    if (error) throw new Error(`${tabela}: ${error.message}`);
    todos.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return todos;
}

const [posts, stories, tags] = await Promise.all([
  buscarTudo("feed_posts"),
  buscarTudo("story_posts"),
  buscarTudo("post_tags", "post_id, origin"),
]);
const origemPorPost = Object.fromEntries((tags ?? []).map((t) => [t.post_id, t.origin]));

const eng = (p) => (p.likes ?? 0) + (p.comments ?? 0) + (p.shares ?? 0) + (p.saves ?? 0);
const taxa = (p) => (p.reach > 0 ? (eng(p) / p.reach) * 100 : 0);

const METRICAS = [
  { key: "views", label: "Visualizações", get: (p) => p.views ?? 0, fmt: (v) => v.toLocaleString("pt-BR"), precisaAlcance: false, precisaViews: true },
  { key: "reach", label: "Alcance", get: (p) => p.reach ?? 0, fmt: (v) => v.toLocaleString("pt-BR"), precisaAlcance: true },
  { key: "eng", label: "Engajamento total", get: eng, fmt: (v) => v.toLocaleString("pt-BR") },
  { key: "taxa", label: "Taxa de engajamento", get: taxa, fmt: (v) => `${v.toFixed(2)}%`, precisaAlcance: true },
  { key: "salvos", label: "Salvamentos", get: (p) => p.saves ?? 0, fmt: (v) => v.toLocaleString("pt-BR") },
  { key: "compart", label: "Compartilhamentos", get: (p) => p.shares ?? 0, fmt: (v) => v.toLocaleString("pt-BR") },
];

// A Meta degrada alcance/visualizações de posts antigos: em 2021-2023 a maioria dos
// posts volta com mais curtidas do que alcance, o que é impossível. Curtidas, comentários,
// compartilhamentos e salvamentos ficam gravados no próprio post e continuam corretos.
// Por isso cada ano só usa as métricas que dá pra confiar nele.
function confiabilidade(lista) {
  const quebrados = lista.filter((p) => (p.likes ?? 0) > (p.reach ?? 0)).length;
  const comViews = lista.filter((p) => (p.views ?? 0) > 0).length;
  return {
    alcanceOk: quebrados / Math.max(lista.length, 1) < 0.1,
    viewsOk: comViews / Math.max(lista.length, 1) > 0.9,
    pctQuebrado: Math.round((quebrados / Math.max(lista.length, 1)) * 100),
  };
}

// Índice de equilíbrio: em vez de somar métricas de escalas diferentes (views na casa
// dos milhares, taxa em %), converte cada métrica na POSIÇÃO PERCENTUAL do post dentro
// do próprio ano (0 a 100) e tira a média das quatro. Um post com 100 é o melhor do ano
// em todas; um com 50 é mediano em todas. É o que responde "qual foi o mais completo".
function comIndice(lista, metricasUsadas) {
  const ranks = {};
  for (const m of metricasUsadas) {
    const ordenado = [...lista].sort((a, b) => m.get(a) - m.get(b));
    ordenado.forEach((p, i) => {
      ranks[p.id] ??= {};
      ranks[p.id][m.key] = lista.length > 1 ? (i / (lista.length - 1)) * 100 : 100;
    });
  }
  return lista.map((p) => ({
    ...p,
    _ranks: ranks[p.id],
    _indice: metricasUsadas.reduce((a, m) => a + ranks[p.id][m.key], 0) / metricasUsadas.length,
  }));
}

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const dataBr = (d) => d.split("-").reverse().join("/");

function selos(p) {
  const out = [];
  if (p.paid_boost) out.push('<span class="selo pago">impulsionado</span>');
  const o = origemPorPost[p.id];
  if (o && o !== "Interno") out.push(`<span class="selo parceria">${esc(o)}</span>`);
  return out.join(" ");
}

function tabelaPosts(lista, metrica) {
  if (!lista.length) return '<p class="vazio">Sem dados.</p>';
  return `<table><thead><tr>
    <th>#</th><th>Data</th><th>Formato</th><th>Descrição</th>
    <th class="num destaque">${metrica ? esc(metrica.label) : "Índice"}</th>
    <th class="num">Views</th><th class="num">Alcance</th><th class="num">Curt.</th>
    <th class="num">Com.</th><th class="num">Comp.</th><th class="num">Salv.</th>
  </tr></thead><tbody>
  ${lista.map((p, i) => `<tr>
    <td class="pos">${i + 1}</td>
    <td class="mono">${dataBr(p.post_date)}</td>
    <td><span class="fmt">${esc(p.post_type)}</span></td>
    <td class="desc">${esc((p.description ?? "").split("\n")[0].slice(0, 80)) || "<i>sem legenda</i>"} ${selos(p)}</td>
    <td class="num destaque mono">${metrica ? metrica.fmt(metrica.get(p)) : p._indice.toFixed(1)}</td>
    <td class="num mono">${(p.views ?? 0).toLocaleString("pt-BR")}</td>
    <td class="num mono">${(p.reach ?? 0).toLocaleString("pt-BR")}</td>
    <td class="num mono">${(p.likes ?? 0).toLocaleString("pt-BR")}</td>
    <td class="num mono">${(p.comments ?? 0).toLocaleString("pt-BR")}</td>
    <td class="num mono">${(p.shares ?? 0).toLocaleString("pt-BR")}</td>
    <td class="num mono">${(p.saves ?? 0).toLocaleString("pt-BR")}</td>
  </tr>`).join("")}
  </tbody></table>`;
}

function tabelaStories(lista, metrica) {
  if (!lista.length) return '<p class="vazio">Sem dados.</p>';
  return `<table><thead><tr>
    <th>#</th><th>Data</th><th>Tipo</th>
    <th class="num destaque">${metrica ? esc(metrica.label) : "Índice"}</th>
    <th class="num">Views</th><th class="num">Alcance</th><th class="num">Cliques</th><th class="num">Respostas</th><th class="num">+Seg.</th>
  </tr></thead><tbody>
  ${lista.map((s, i) => `<tr>
    <td class="pos">${i + 1}</td>
    <td class="mono">${dataBr(s.post_date)}</td>
    <td><span class="fmt">${s.media_type === "VIDEO" ? "Vídeo" : s.media_type === "IMAGE" ? "Foto" : "—"}</span></td>
    <td class="num destaque mono">${metrica ? metrica.fmt(metrica.get(s)) : s._indice.toFixed(1)}</td>
    <td class="num mono">${(s.views ?? 0).toLocaleString("pt-BR")}</td>
    <td class="num mono">${(s.reach ?? 0).toLocaleString("pt-BR")}</td>
    <td class="num mono">${(s.link_clicks ?? 0).toLocaleString("pt-BR")}</td>
    <td class="num mono">${(s.replies ?? 0).toLocaleString("pt-BR")}</td>
    <td class="num mono">${(s.follows ?? 0).toLocaleString("pt-BR")}</td>
  </tr>`).join("")}
  </tbody></table>`;
}

const STORY_METRICAS = [
  { key: "views", label: "Visualizações", get: (s) => s.views ?? 0, fmt: (v) => v.toLocaleString("pt-BR") },
  { key: "reach", label: "Alcance", get: (s) => s.reach ?? 0, fmt: (v) => v.toLocaleString("pt-BR") },
  { key: "eng", label: "Interações (cliques+respostas)", get: (s) => (s.link_clicks ?? 0) + (s.replies ?? 0), fmt: (v) => v.toLocaleString("pt-BR") },
  { key: "taxa", label: "Taxa de retenção", get: (s) => (s.reach > 0 ? ((s.views ?? 0) / s.reach) * 100 : 0), fmt: (v) => `${v.toFixed(1)}%` },
];

function comIndiceStories(lista) {
  const ranks = {};
  for (const m of STORY_METRICAS) {
    const ord = [...lista].sort((a, b) => m.get(a) - m.get(b));
    ord.forEach((s, i) => {
      ranks[s.id] ??= {};
      ranks[s.id][m.key] = lista.length > 1 ? (i / (lista.length - 1)) * 100 : 100;
    });
  }
  return lista.map((s) => ({ ...s, _indice: STORY_METRICAS.reduce((a, m) => a + ranks[s.id][m.key], 0) / STORY_METRICAS.length }));
}

let html = "";
const anosPosts = [...new Set(posts.map((p) => p.post_date.slice(0, 4)))].sort().reverse();

for (const ano of anosPosts) {
  const brutos = posts.filter((p) => p.post_date.startsWith(ano));
  const conf = confiabilidade(brutos);
  const metricasUsadas = METRICAS.filter(
    (m) => (!m.precisaAlcance || conf.alcanceOk) && (!m.precisaViews || conf.viewsOk)
  );
  const doAno = comIndice(brutos, metricasUsadas);
  const comPiores = Number(ano) >= 2025;

  html += `<section><h2>Feed — ${ano} <span class="qtd">${doAno.length} posts</span></h2>`;

  if (!conf.alcanceOk || !conf.viewsOk) {
    const faltando = [];
    if (!conf.alcanceOk) faltando.push("alcance e taxa de engajamento");
    if (!conf.viewsOk) faltando.push("visualizações");
    html += `<div class="alerta"><b>Dado incompleto neste ano.</b> A Meta não devolve mais ${faltando.join(" nem ")} confiáveis para posts deste período
      (${conf.pctQuebrado}% dos posts voltam com mais curtidas do que alcance, o que é impossível).
      Os rankings abaixo usam só as métricas que continuam corretas: curtidas, comentários, compartilhamentos e salvamentos.</div>`;
  }

  html += `<h3 class="eq">Mais equilibrados <span class="sub">(melhor posição média em ${metricasUsadas.length} métricas)</span></h3>`;
  html += tabelaPosts([...doAno].sort((a, b) => b._indice - a._indice).slice(0, 10), null);

  for (const m of metricasUsadas) {
    html += `<h3>Top 10 — ${esc(m.label)}</h3>`;
    html += tabelaPosts([...doAno].sort((a, b) => m.get(b) - m.get(a)).slice(0, 10), m);
  }

  if (comPiores) {
    const mPior = metricasUsadas[0];
    html += `<h3 class="pior">10 piores — ${esc(mPior.label)}</h3>`;
    html += tabelaPosts([...doAno].sort((a, b) => mPior.get(a) - mPior.get(b)).slice(0, 10), mPior);
    html += `<h3 class="pior">10 piores — Mais desequilibrados <span class="sub">(pior posição média)</span></h3>`;
    html += tabelaPosts([...doAno].sort((a, b) => a._indice - b._indice).slice(0, 10), null);
  }
  html += `</section>`;
}

const anosStories = [...new Set((stories ?? []).map((s) => s.post_date.slice(0, 4)))].sort().reverse();
for (const ano of anosStories) {
  const doAno = comIndiceStories(stories.filter((s) => s.post_date.startsWith(ano)));
  html += `<section><h2>Stories — ${ano} <span class="qtd">${doAno.length} stories</span></h2>`;
  html += `<h3 class="eq">Mais equilibrados</h3>` + tabelaStories([...doAno].sort((a, b) => b._indice - a._indice).slice(0, 10), null);
  for (const m of STORY_METRICAS) {
    html += `<h3>Top 10 — ${esc(m.label)}</h3>` + tabelaStories([...doAno].sort((a, b) => m.get(b) - m.get(a)).slice(0, 10), m);
  }
  html += `<h3 class="pior">10 piores — Visualizações</h3>` + tabelaStories([...doAno].sort((a, b) => a.views - b.views).slice(0, 10), STORY_METRICAS[0]);
  html += `</section>`;
}

const doc = `<title>Bázico — Melhores e piores conteúdos por ano</title>
<style>
:root{--preto:#232323;--roxo:#754EA9;--roxoEsc:#24174A;--creme:#F2D2B4;--tint:#F1ECF8;--cinza:#8A8A8A;--linha:#E7E3EE;--bg:#FAFAFA;--card:#fff}
:root:not([data-theme=light]) {}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--preto:#EDEAF2;--bg:#17151C;--card:#1F1C26;--linha:#332E3D;--cinza:#9A93A6;--tint:#241F2E}}
:root[data-theme=dark]{--preto:#EDEAF2;--bg:#17151C;--card:#1F1C26;--linha:#332E3D;--cinza:#9A93A6;--tint:#241F2E}
body{font-family:'Montserrat',system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--preto);margin:0;padding:28px 20px;line-height:1.5}
.wrap{max-width:1180px;margin:0 auto}
h1{font-size:24px;margin:0 0 4px;font-weight:800}
.lead{color:var(--cinza);font-size:13px;margin:0 0 8px}
.aviso{background:var(--tint);border-left:3px solid var(--roxo);padding:12px 14px;border-radius:4px;font-size:13px;margin:18px 0 28px}
section{background:var(--card);border:1px solid var(--linha);border-radius:8px;padding:20px;margin-bottom:22px}
h2{font-size:18px;margin:0 0 14px;border-bottom:2px solid var(--preto);padding-bottom:8px}
h2 .qtd{font-size:12px;color:var(--cinza);font-weight:400}
h3{font-size:13px;margin:22px 0 8px;color:var(--roxo);text-transform:uppercase;letter-spacing:.04em}
h3.eq{color:var(--roxoEsc)}
h3.pior{color:#B3261E}
h3 .sub{text-transform:none;letter-spacing:0;color:var(--cinza);font-weight:400;font-size:11px}
.tw,table{width:100%}
section > table{display:block;overflow-x:auto;white-space:nowrap}
table{border-collapse:collapse;font-size:12px}
th{text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.05em;color:var(--cinza);padding:6px 8px;border-bottom:1px solid var(--linha);font-weight:700}
td{padding:7px 8px;border-bottom:1px solid var(--linha)}
th.num,td.num{text-align:right}
.mono{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px}
.destaque{font-weight:800;color:var(--roxo)}
.pos{color:var(--cinza);font-family:ui-monospace,monospace;font-size:11px}
.desc{white-space:normal;min-width:260px;max-width:380px}
.fmt{font-size:10px;border:1px solid var(--roxo);color:var(--roxo);border-radius:20px;padding:1px 7px}
.selo{font-size:9px;border-radius:20px;padding:1px 6px;margin-left:4px;white-space:nowrap}
.selo.pago{background:#B3261E;color:#fff}
.selo.parceria{background:var(--creme);color:var(--roxoEsc)}
.vazio{color:var(--cinza);font-size:12px}
.alerta{background:#B3261E14;border-left:3px solid #B3261E;padding:10px 12px;border-radius:4px;font-size:12px;margin:0 0 6px;line-height:1.55}
.resumo{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:0 0 22px}
.resumo div{background:var(--card);border:1px solid var(--linha);border-radius:6px;padding:12px}
.resumo b{display:block;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:19px;color:var(--roxo)}
.resumo span{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--cinza)}
</style>
<div class="wrap">
<h1>Bázico ≠ Melhores e piores conteúdos</h1>
<p class="lead">@sejabazico · Instagram orgânico · gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
<div class="aviso">
<b>Como ler:</b> cada ano traz o Top 10 por <b>cada métrica separada</b> (views, alcance, engajamento, taxa) e um ranking de <b>mais equilibrados</b> — este último converte cada métrica na posição percentual do post dentro do ano (0 a 100) e tira a média das quatro, então um post com índice 90 esteve entre os melhores em todas elas, não só numa.<br><br>
Posts com selo <span class="selo pago">impulsionado</span> tiveram tráfego pago e <span class="selo parceria">parceria</span> vieram de influencer/UGC/repost — ficam no ranking, mas marcados.<br><br>
<b>Stories:</b> só existem de julho/2026 em diante. A Meta apaga os dados de Stories 24h após a publicação, e a coleta diária começou em julho/2026 — não há como recuperar os anos anteriores.
</div>
${html}
</div>`;

writeFileSync("relatorio-conteudos.html", doc);
console.log("Gerado: relatorio-conteudos.html");
console.log(`Feed: ${posts.length} posts em ${anosPosts.length} anos (${anosPosts.join(", ")})`);
console.log(`Stories: ${stories?.length ?? 0} em ${anosStories.join(", ") || "nenhum ano"}`);
