import { BRAND_CONTEXT } from "@/lib/brandContext";

type PostComTag = {
  post_type: string;
  description: string;
  views: number;
  editorial_line: string | null;
  content_mode: string | null;
  hypothesis: string | null;
  hypothesis_status: string | null;
  origin: string | null;
  actual_result?: string | null;
};

export function buildWeeklyPrompt({
  periodoLabel,
  totalPosts,
  marcados,
  seguidoresPeriodo,
  seguidoresGanhos,
  seguidoresPerdidos,
  melhorHorario,
  contexto,
}: {
  periodoLabel: string;
  totalPosts: number;
  marcados: PostComTag[];
  seguidoresPeriodo: string;
  seguidoresGanhos: number;
  seguidoresPerdidos: number;
  melhorHorario: string;
  contexto: string;
}): string {
  const internos = marcados.filter((p) => p.origin !== "Parceria/Influencer");
  const parcerias = marcados.filter((p) => p.origin === "Parceria/Influencer");

  const resumoInternos = internos
    .map(
      (p) =>
        `- [${p.post_type}] "${p.description?.split("\n")[0].slice(0, 60)}" · Views: ${p.views} · Linha: ${
          p.editorial_line || "?"
        } · Modo: ${p.content_mode || "?"} · Hipótese: ${p.hypothesis || "sem hipótese"} (${
          p.hypothesis_status || "Observar"
        })${p.actual_result ? ` · Resultado real (diferente do esperado): ${p.actual_result}` : ""}`
    )
    .join("\n");

  const resumoParcerias = parcerias.length
    ? parcerias
        .map((p) => `- [Parceria] "${p.description?.split("\n")[0].slice(0, 50)}" · Views: ${p.views}`)
        .join("\n")
    : "Nenhum conteúdo de parceria marcado.";

  const naoMarcados = totalPosts - marcados.length;
  const saldo = seguidoresGanhos - seguidoresPerdidos;
  const taxaPerda = seguidoresGanhos > 0 ? (seguidoresPerdidos / seguidoresGanhos) * 100 : 0;

  return `${BRAND_CONTEXT}

DADOS DE ${periodoLabel.toUpperCase()} — conteúdo INTERNO marcado e analisado pelo analista (${internos.length} de ${totalPosts} posts do período; ${naoMarcados} ainda sem marcação):
${resumoInternos || "Nenhum post interno marcado ainda."}

CONTEÚDO DE PARCERIA/INFLUENCER no mesmo período (gera resultado pra Bázico, mas não é entrega do analista — mantido aqui só como contexto, não descartado):
${resumoParcerias}

SEGUIDORES GANHOS E PERDIDOS NO PERÍODO (via app Instagram, período: ${seguidoresPeriodo || "não informado"}):
Ganhos: ${seguidoresGanhos} · Perdidos: ${seguidoresPerdidos} · Saldo: ${saldo} · Taxa de perda: ${taxaPerda.toFixed(0)}% (perdidos como % dos ganhos)

MELHOR HORÁRIO PARA POSTAR (via Insights do app):
${melhorHorario || "Não informado."}

CONTEXTO E DATAS IMPORTANTES PARA A PRÓXIMA SEMANA (informado pelo analista):
${contexto || "Nenhum contexto adicional informado."}

TAREFA: com base principalmente no conteúdo INTERNO marcado acima (é o que o analista controla e pode repetir — conteúdo de parceria reflete o alcance do influencer, não a estratégia de conteúdo da marca), escreva uma recomendação objetiva para a próxima semana, no seguinte formato:

1. LEITURA DA SEMANA — o que os dados marcados sugerem que funcionou ou não, e por quê (2-3 frases, direto, sem enrolação).
2. FOCOS SUGERIDOS — 3 a 5 temas/linhas editoriais pra priorizar essa semana, considerando o contexto/datas informado e o melhor horário pra postar.
3. UM TESTE ESPECÍFICO — proponha um teste controlado pra essa semana (ex: comparar dois ganchos, dois formatos), com o que seria "confirmado" vs "refutado".
4. ALERTA — se alguma linha editorial estiver sendo repetida demais (saturação), ou se a taxa de perda de seguidores estiver alta, avise.

Seja direto, sem preâmbulo. Se os dados marcados forem poucos (menos de 5 posts), diga isso claramente e recomende marcar mais posts antes de confiar na leitura.`;
}
