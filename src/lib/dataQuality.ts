import { supabaseServer } from "@/lib/supabase/server";

export type QualidadeMes = {
  mes: string;
  posts: number;
  pctImpossivel: number;
  pctSemViews: number;
  confiavel: boolean;
};

export type Qualidade = {
  // Primeiro dia a partir do qual alcance/views são confiáveis. Null = nenhum dado.
  corte: string | null;
  meses: QualidadeMes[];
};

// A Meta guarda insights (alcance, visualizações) por 2 anos. Depois disso ela para de
// devolver valores corretos para posts antigos — mas continua devolvendo ALGUM número,
// não um erro. O sintoma é um post com mais curtidas do que alcance, o que é impossível:
// ninguém curte o que não viu. Curtidas/comentários/compartilhamentos/salvamentos ficam
// gravados no próprio post e continuam certos pra sempre.
//
// Em vez de fixar uma data no código (que ficaria errada amanhã, já que essa fronteira
// anda pra frente todo dia), descobrimos o corte olhando os próprios dados.
const LIMITE_IMPOSSIVEL = 0.1; // até 10% de posts quebrados no mês ainda é aceitável
const LIMITE_SEM_VIEWS = 0.1;

export async function avaliarQualidade(): Promise<Qualidade> {
  const supabase = supabaseServer();

  const porMes = new Map<string, { total: number; impossivel: number; semViews: number }>();
  for (let de = 0; ; de += 1000) {
    const { data } = await supabase
      .from("feed_posts")
      .select("post_date, likes, reach, views")
      .range(de, de + 999);
    if (!data?.length) break;
    for (const p of data) {
      const mes = p.post_date.slice(0, 7);
      const atual = porMes.get(mes) ?? { total: 0, impossivel: 0, semViews: 0 };
      atual.total++;
      if ((p.likes ?? 0) > (p.reach ?? 0)) atual.impossivel++;
      if ((p.views ?? 0) === 0) atual.semViews++;
      porMes.set(mes, atual);
    }
    if (data.length < 1000) break;
  }

  const meses: QualidadeMes[] = Array.from(porMes.entries())
    .map(([mes, v]) => ({
      mes,
      posts: v.total,
      pctImpossivel: Math.round((v.impossivel / v.total) * 100),
      pctSemViews: Math.round((v.semViews / v.total) * 100),
      confiavel: v.impossivel / v.total <= LIMITE_IMPOSSIVEL && v.semViews / v.total <= LIMITE_SEM_VIEWS,
    }))
    .sort((a, b) => a.mes.localeCompare(b.mes));

  // O corte é o começo da sequência confiável mais recente — assim um mês isolado bom
  // no meio de um período ruim não engana o cálculo.
  let corte: string | null = null;
  for (let i = meses.length - 1; i >= 0; i--) {
    if (!meses[i].confiavel) break;
    corte = `${meses[i].mes}-01`;
  }

  return { corte, meses };
}

// Um período é confiável se começa depois do corte. Usado nas telas pra avisar quando
// o que está na tela não deve ser usado pra decisão.
export function periodoConfiavel(start: string, corte: string | null): boolean {
  if (!corte) return false;
  return start >= corte;
}

export function mesLegivel(iso: string): string {
  const nomes = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  const [ano, mes] = iso.split("-");
  return `${nomes[Number(mes) - 1]}/${ano}`;
}
