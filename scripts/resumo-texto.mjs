// Gera um arquivo de TEXTO com os melhores e piores conteúdos, pronto pra colar numa
// conversa normal do Claude.ai. Sem HTML, sem tabela — só texto legível, com as legendas
// inteiras, que é o que a IA precisa pra achar o padrão de conteúdo.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf-8").split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

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

const [posts, tags] = await Promise.all([buscarTudo("feed_posts"), buscarTudo("post_tags", "post_id, origin, editorial_line, content_mode, hypothesis")]);
const tagPorPost = Object.fromEntries(tags.map((t) => [t.post_id, t]));

// Só o período em que a Meta ainda devolve alcance/views íntegros (ela degrada depois de
// 2 anos). Analisar padrão em cima de dado quebrado ensinaria a repetir a coisa errada.
const CORTE = "2024-08-01";
const validos = posts.filter((p) => p.post_date >= CORTE && (p.likes ?? 0) <= (p.reach ?? 0));

const eng = (p) => (p.likes ?? 0) + (p.comments ?? 0) + (p.shares ?? 0) + (p.saves ?? 0);
const METRICAS = [
  (p) => p.views ?? 0,
  (p) => p.reach ?? 0,
  (p) => eng(p),
  (p) => (p.reach > 0 ? (eng(p) / p.reach) * 100 : 0),
  (p) => p.saves ?? 0,
  (p) => p.shares ?? 0,
];

// Índice de equilíbrio: converte cada métrica na posição percentual do post (0 a 100) e
// tira a média. Assim um post que foi bem em tudo ganha de um que só viralizou em views.
function ranquear(lista) {
  const r = {};
  for (const get of METRICAS) {
    [...lista].sort((a, b) => get(a) - get(b)).forEach((p, i) => {
      (r[p.id] ??= []).push(lista.length > 1 ? (i / (lista.length - 1)) * 100 : 100);
    });
  }
  return lista.map((p) => ({ ...p, indice: r[p.id].reduce((a, b) => a + b, 0) / r[p.id].length }))
    .sort((a, b) => b.indice - a.indice);
}

const n = (v) => (v ?? 0).toLocaleString("pt-BR");
const dataBr = (d) => d.split("-").reverse().join("/");
const hora = (iso) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const diaSemana = (d) => ["domingo","segunda","terça","quarta","quinta","sexta","sábado"][new Date(d + "T12:00:00").getDay()];

function bloco(p, pos) {
  const t = tagPorPost[p.id] ?? {};
  const marcas = [];
  if (p.paid_boost) marcas.push("IMPULSIONADO (tráfego pago)");
  if (t.origin && t.origin !== "Interno") marcas.push(`ORIGEM: ${t.origin}`);
  const taxa = p.reach > 0 ? ((eng(p) / p.reach) * 100).toFixed(2) : "0";
  return [
    `${pos}. ${p.post_type} — ${dataBr(p.post_date)} (${diaSemana(p.post_date)}, ${hora(p.published_at)})${marcas.length ? "  [" + marcas.join(" | ") + "]" : ""}`,
    `   Legenda: ${(p.description || "(sem legenda)").replace(/\s+/g, " ").trim()}`,
    `   Views ${n(p.views)} | Alcance ${n(p.reach)} | Curtidas ${n(p.likes)} | Comentários ${n(p.comments)} | Compartilhamentos ${n(p.shares)} | Salvamentos ${n(p.saves)} | Novos seguidores ${n(p.follows)} | Taxa de engajamento ${taxa}%`,
    t.editorial_line || t.content_mode || t.hypothesis
      ? `   Marcação minha: ${[t.editorial_line, t.content_mode].filter(Boolean).join(" / ")}${t.hypothesis ? ` — hipótese: ${t.hypothesis}` : ""}`
      : null,
  ].filter(Boolean).join("\n");
}

function secao(titulo, lista) {
  const rank = ranquear(lista);
  const medViews = [...lista].map((p) => p.views ?? 0).sort((a, b) => a - b);
  const mediana = medViews.length % 2 ? medViews[(medViews.length - 1) / 2]
    : (medViews[medViews.length / 2 - 1] + medViews[medViews.length / 2]) / 2;

  const porFormato = ["Reels", "Carrossel", "Imagem"].map((f) => {
    const d = lista.filter((p) => p.post_type === f);
    if (!d.length) return null;
    return `${f}: ${d.length} posts, média de ${n(Math.round(d.reduce((a, p) => a + (p.views ?? 0), 0) / d.length))} views`;
  }).filter(Boolean);

  return `
${"=".repeat(78)}
${titulo}
${"=".repeat(78)}
Base: ${lista.length} posts. Mediana de views: ${n(Math.round(mediana))}.
Média por formato — ${porFormato.join(" · ")}

--- OS 10 MELHORES (melhor desempenho médio em todas as métricas) ---

${rank.slice(0, 10).map((p, i) => bloco(p, i + 1)).join("\n\n")}

--- OS 10 PIORES ---

${rank.slice(-10).reverse().map((p, i) => bloco(p, i + 1)).join("\n\n")}
`;
}

const porAno = {};
for (const p of validos) (porAno[p.post_date.slice(0, 4)] ??= []).push(p);

const texto = `CONTEÚDO DO INSTAGRAM @sejabazico — MELHORES E PIORES POSTS
Bázico (marca de moda básica, Aracaju/SE). Gerado em ${new Date().toLocaleDateString("pt-BR")}.

COMO ESSE RANKING FOI FEITO
Cada post recebe uma nota de 0 a 100 em SEIS métricas separadas (views, alcance,
engajamento total, taxa de engajamento, salvamentos e compartilhamentos), com base na
posição dele em relação a todos os outros posts do período. A nota final é a média das
seis. Isso evita que um post que só viralizou em views apareça como "melhor" mesmo
tendo gerado zero salvamento ou comentário — o objetivo é achar o conteúdo COMPLETO.
Salvamentos e compartilhamentos entram com peso próprio porque são os sinais mais
ligados a intenção de compra (salvar = "vou comprar depois", compartilhar = recomendação).

IMPORTANTE SOBRE O PERÍODO
Só entram posts a partir de agosto/2024. A Meta guarda as métricas de alcance e
visualizações por apenas 2 anos e, passado esse prazo, devolve números degradados em vez
de erro — posts antigos aparecem com mais curtidas do que alcance, o que é impossível.
Analisar aquele período faria a análise ensinar o padrão errado.
${Object.keys(porAno).sort().reverse().map((ano) => secao(`ANO ${ano}`, porAno[ano])).join("\n")}
${secao("PERÍODO COMPLETO CONFIÁVEL (agosto/2024 até hoje)", validos)}
${"=".repeat(78)}
O QUE EU QUERO SABER
${"=".repeat(78)}
Analise os conteúdos acima e me diga:

1. PADRÃO DOS QUE FUNCIONAM — o que os 10 melhores têm em comum? Olhe o tipo de gancho
   das primeiras palavras, o tema, o formato, o tom, o tamanho da legenda, o dia e o
   horário. Seja específico e cite os posts como exemplo.
2. PADRÃO DOS QUE NÃO FUNCIONAM — o que os piores têm em comum, e qual desses erros
   aparece com mais frequência?
3. FÓRMULA REPRODUZÍVEL — me dê de 3 a 5 "moldes" concretos de conteúdo que eu possa
   repetir na próxima semana, cada um com: o gancho de abertura, o tema, o formato ideal
   e por que deve funcionar com base nos dados acima.
4. O QUE PARAR DE FAZER — o que os dados sugerem que eu deveria abandonar.
5. TESTE DA SEMANA — proponha um teste controlado, dizendo o que seria "confirmado" e o
   que seria "refutado".

Contexto da marca: a Bázico vende moda básica masculina (camisetas, polos, calças,
nécessaires, cintos). Público majoritariamente masculino, 25-44 anos, concentrado em
Aracaju/SE e Nordeste. O objetivo final é conversão em vendas, não só alcance.
`;

writeFileSync("relatorio-para-claude.txt", texto);
console.log("Gerado: relatorio-para-claude.txt");
console.log(`${validos.length} posts analisados, anos: ${Object.keys(porAno).sort().reverse().join(", ")}`);
