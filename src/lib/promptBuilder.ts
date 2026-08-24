import { BRAND_CONTEXT, GROWTH_CONTEXT } from "@/lib/brandContext";

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
  strategic_objective?: string | null;
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
  // "Agência" (Gustavo/Ari) é o único conteúdo que o analista de fato controla e pode
  // repetir na estratégia. Parceria/Influencer e UGC/Cliente refletem o alcance de outra
  // pessoa, não a estratégia de conteúdo da marca — por isso ficam fora do bloco principal.
  const internos = marcados.filter((p) => p.origin === "Agência" || !p.origin);
  const parcerias = marcados.filter((p) => p.origin && p.origin !== "Agência");

  // Separação simples entre "dado bruto" e "interpretação" dentro do campo Resultado real:
  // pega só a primeira frase (até o primeiro . ! ou ?) como dado bruto, o resto (se houver)
  // vira interpretação. Não é parsing inteligente — a separação de verdade acontece quando
  // o Gustavo escrever o campo já nessa ordem (número/fato primeiro, leitura depois).
  const splitResultado = (actualResult: string | null | undefined) => {
    const texto = (actualResult || "").trim();
    if (!texto) return { primeiraFrase: "", resto: "" };
    const match = texto.match(/^(.*?[.!?])(?:\s+|\n)([\s\S]*)$/);
    if (match) return { primeiraFrase: match[1].trim(), resto: match[2].trim() };
    return { primeiraFrase: texto, resto: "" };
  };

  const resumoInternos = internos
    .map((p) => {
      const titulo = p.description?.split("\n")[0].slice(0, 60) || "(sem legenda)";
      const { primeiraFrase, resto } = splitResultado(p.actual_result);
      const dadoBruto = `Views: ${p.views}.${primeiraFrase ? ` ${primeiraFrase}` : ""}`;
      const interpretacao = resto || "Sem interpretação adicional registrada.";
      return `POST: ${titulo}
FORMATO: ${p.post_type}
OBJETIVO ESTRATÉGICO: ${p.strategic_objective || "não informado"}
LINHA EDITORIAL: ${p.editorial_line || "não informado"}
MODO DE CONTEÚDO: ${p.content_mode || "não informado"}
HIPÓTESE: ${p.hypothesis || "sem hipótese registrada"}
STATUS: ${p.hypothesis_status || "Observar"}
RESULTADO — DADO BRUTO: ${dadoBruto}
RESULTADO — INTERPRETAÇÃO: ${interpretacao}`;
    })
    .join("\n\n");

  const resumoParcerias = parcerias.length
    ? parcerias
        .map((p) => `- [${p.origin}] "${p.description?.split("\n")[0].slice(0, 50)}" · Views: ${p.views}`)
        .join("\n")
    : "Nenhum conteúdo de parceria/UGC marcado.";

  const naoMarcados = totalPosts - marcados.length;
  const saldo = seguidoresGanhos - seguidoresPerdidos;
  const taxaPerda = seguidoresGanhos > 0 ? (seguidoresPerdidos / seguidoresGanhos) * 100 : 0;

  return `${BRAND_CONTEXT}

${GROWTH_CONTEXT}

DADOS DE ${periodoLabel.toUpperCase()} — conteúdo de AGÊNCIA (produzido internamente por Gustavo/Ari) marcado e analisado pelo analista (${internos.length} de ${totalPosts} posts do período; ${naoMarcados} ainda sem marcação):

REGRA DE LEITURA: cada post abaixo tem os campos HIPÓTESE, STATUS, RESULTADO — DADO BRUTO e RESULTADO — INTERPRETAÇÃO separados. Ao ler STATUS = "Padrão fixo": não trate como experimento que funcionou ou não funcionou — trate como conteúdo recorrente de manutenção de categoria (ex: apresentação de produto novo), e avalie se essa categoria está tendo retorno consistente ao longo do tempo, não como teste pontual da semana.

${resumoInternos || "Nenhum post de agência marcado ainda."}

CONTEÚDO DE PARCERIA/INFLUENCER/UGC no mesmo período (gera resultado pra Bázico, mas não é entrega do analista — mantido aqui só como contexto, não descartado):
${resumoParcerias}

SEGUIDORES GANHOS E PERDIDOS NO PERÍODO (via app Instagram, período: ${seguidoresPeriodo || "não informado"}):
Ganhos: ${seguidoresGanhos} · Perdidos: ${seguidoresPerdidos} · Saldo: ${saldo} · Taxa de perda: ${taxaPerda.toFixed(0)}% (perdidos como % dos ganhos)

MELHOR HORÁRIO PARA POSTAR (via Insights do app):
${melhorHorario || "Não informado."}

CONTEXTO E DATAS IMPORTANTES PARA A PRÓXIMA SEMANA (informado pelo analista):
${contexto || "Nenhum contexto adicional informado."}

TAREFA: com base principalmente no conteúdo de AGÊNCIA marcado acima (é o que o analista controla e pode repetir — conteúdo de parceria/UGC reflete o alcance de outra pessoa, não a estratégia de conteúdo da marca), escreva uma recomendação objetiva para a próxima semana, no seguinte formato:

1. LEITURA DA SEMANA — o que os dados marcados sugerem que funcionou ou não, e por quê (2-3 frases, direto, sem enrolação).
2. FOCOS SUGERIDOS — 3 a 5 temas/linhas editoriais pra priorizar essa semana, considerando o contexto/datas informado e o melhor horário pra postar.
3. UM TESTE ESPECÍFICO — proponha um teste controlado pra essa semana (ex: comparar dois ganchos, dois formatos), com o que seria "confirmado" vs "refutado".
4. ALERTA — se alguma linha editorial estiver sendo repetida demais (saturação), ou se a taxa de perda de seguidores estiver alta, avise.

Seja direto, sem preâmbulo. Se os dados marcados forem poucos (menos de 5 posts), diga isso claramente e recomende marcar mais posts antes de confiar na leitura.`;
}
