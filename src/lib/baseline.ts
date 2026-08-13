import { supabaseServer } from "@/lib/supabase/server";
import { avaliarQualidade } from "@/lib/dataQuality";

const FORMATOS = ["Reels", "Carrossel", "Imagem"];

export type JanelaBaseline = "3m" | "12m" | "confiavel";

export type BaselineFormato = {
  tipo: string;
  qtd: number;
  mediaViews: number;
  mediaReach: number;
  mediaLikes: number;
  mediaComments: number;
  mediaShares: number;
  mediaSaves: number;
};

export type PostExcluido = { id: string; post_type: string; post_date: string; motivo: string };

export type Baseline = {
  porFormato: BaselineFormato[];
  excluidos: PostExcluido[];
  totalElegiveis: number;
  janela: JanelaBaseline;
  inicioUsado: string;
  corteConfiavel: string | null;
  descartadosPorQualidade: number;
};

function inicioDaJanela(janela: JanelaBaseline, corte: string | null): string {
  const hoje = new Date();
  if (janela === "3m") {
    const d = new Date(hoje);
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  }
  if (janela === "12m") {
    const d = new Date(hoje);
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  }
  return corte ?? "1970-01-01";
}

// Média de referência orgânica por formato.
//
// Três filtros, nessa ordem:
// 1. QUALIDADE — nunca usa período onde a Meta já degradou alcance/views (ver
//    lib/dataQuality.ts). Sem isso a média fica absurdamente errada: posts de 2021-2023
//    voltam com alcance perto de zero e puxariam a média pra baixo em até 80%.
// 2. TRÁFEGO PAGO — post impulsionado não representa alcance orgânico.
// 3. ORIGEM — parceria/influencer/UGC/repost refletem o público do outro, não o nosso.
//
// A janela padrão nunca é "tudo": é sempre um recorte recente e confiável, porque o
// alcance do Instagram muda muito ano a ano e uma média de 2021 não serve de meta hoje.
export async function computeBaseline(janela: JanelaBaseline = "12m"): Promise<Baseline> {
  const supabase = supabaseServer();
  const { corte } = await avaliarQualidade();

  const inicioJanela = inicioDaJanela(janela, corte);
  // Mesmo com janela curta, nunca deixamos passar período não-confiável.
  const inicioUsado = corte && inicioJanela < corte ? corte : inicioJanela;

  const posts: {
    id: string; post_type: string; post_date: string; views: number; reach: number;
    likes: number; comments: number; shares: number; saves: number; paid_boost: boolean;
  }[] = [];
  for (let de = 0; ; de += 1000) {
    const { data } = await supabase
      .from("feed_posts")
      .select("id, post_type, post_date, views, reach, likes, comments, shares, saves, paid_boost")
      .gte("post_date", inicioUsado)
      .range(de, de + 999);
    if (!data?.length) break;
    posts.push(...data);
    if (data.length < 1000) break;
  }

  const { data: tagsData } = await supabase.from("post_tags").select("post_id, origin");
  const origemPorPost = Object.fromEntries((tagsData ?? []).map((t) => [t.post_id, t.origin]));

  const elegiveis: typeof posts = [];
  const excluidos: PostExcluido[] = [];
  let descartadosPorQualidade = 0;

  for (const p of posts) {
    // Rede de segurança individual: mesmo dentro de um mês considerado bom, um post
    // solto com curtidas > alcance é dado quebrado e não entra na conta.
    if ((p.likes ?? 0) > (p.reach ?? 0)) {
      descartadosPorQualidade++;
      continue;
    }
    if (p.paid_boost) {
      excluidos.push({ id: p.id, post_type: p.post_type, post_date: p.post_date, motivo: "Impulsionado (tráfego pago)" });
      continue;
    }
    const origem = origemPorPost[p.id];
    if (origem && origem !== "Interno") {
      excluidos.push({ id: p.id, post_type: p.post_type, post_date: p.post_date, motivo: `Origem: ${origem}` });
      continue;
    }
    elegiveis.push(p);
  }

  const porFormato = FORMATOS.map((tipo) => {
    const doTipo = elegiveis.filter((p) => p.post_type === tipo);
    const media = (chave: keyof (typeof posts)[number]) =>
      doTipo.length ? doTipo.reduce((acc, p) => acc + (p[chave] as number), 0) / doTipo.length : 0;
    return {
      tipo,
      qtd: doTipo.length,
      mediaViews: media("views"),
      mediaReach: media("reach"),
      mediaLikes: media("likes"),
      mediaComments: media("comments"),
      mediaShares: media("shares"),
      mediaSaves: media("saves"),
    };
  }).filter((f) => f.qtd > 0);

  return {
    porFormato,
    excluidos,
    totalElegiveis: elegiveis.length,
    janela,
    inicioUsado,
    corteConfiavel: corte,
    descartadosPorQualidade,
  };
}
