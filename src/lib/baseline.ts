import { supabaseServer } from "@/lib/supabase/server";

const FORMATOS = ["Reels", "Carrossel", "Imagem"];
const METRICAS = ["views", "reach", "likes", "comments", "shares", "saves"] as const;

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
};

// Média de referência orgânica por formato — exclui posts marcados como impulsionados
// (tráfego pago) e posts de origem que não seja "Interno" (parceria/influencer,
// UGC/cliente, repost), porque nenhum dos dois representa o alcance orgânico normal do
// time. Calculada em cima de todo o histórico disponível, sempre ao vivo — não é um
// número fixo, atualiza sozinha conforme mais posts entram ou saem do cálculo.
export async function computeBaseline(): Promise<Baseline> {
  const supabase = supabaseServer();
  const { data: posts } = await supabase
    .from("feed_posts")
    .select("id, post_type, post_date, views, reach, likes, comments, shares, saves, paid_boost");
  const { data: tagsData } = await supabase.from("post_tags").select("post_id, origin");
  const origemPorPost = Object.fromEntries((tagsData ?? []).map((t) => [t.post_id, t.origin]));

  const elegiveis: NonNullable<typeof posts> = [];
  const excluidos: PostExcluido[] = [];

  for (const p of posts ?? []) {
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
    const media = (chave: (typeof METRICAS)[number]) =>
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

  return { porFormato, excluidos, totalElegiveis: elegiveis.length };
}
