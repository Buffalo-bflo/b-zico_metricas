import type { CSSProperties } from "react";

export const C = {
  preto: "#232323",
  branco: "#FFFFFF",
  roxo: "#754EA9",
  roxoEscuro: "#24174A",
  creme: "#F2D2B4",
  roxoTint: "#F1ECF8",
  cinza: "#6B6B6B",
  linha: "#E7E3EE",
  erro: "#B3261E",
  aviso: "#F0B429",
  avisoFundo: "#FFF4E5",
  avisoTexto: "#7A4A00",
} as const;

export const TIPO_COLORS: Record<string, string> = {
  Reels: "#754EA9",
  Carrossel: "#24174A",
  Imagem: "#B79ACB",
  Story: "#F2D2B4",
};

export const FONT_SANS = "'Montserrat', sans-serif";
export const FONT_MONO = "'JetBrains Mono', monospace";

// Escala de tipografia formalizada na "passada bolder" (20/08/2026) — antes cada
// tamanho era um literal repetido à mão em cada arquivo (26/20/18/14 todos fazendo o
// papel de "número grande" sem uma régua única). Display e Stat sobem pra dar mais
// peso aos números principais; Body/Label/Micro ficam como estavam de propósito —
// o contraste vem de esticar o topo da escala, não de inflar tudo por igual.
export const TYPE = {
  display: { fontFamily: FONT_MONO, fontWeight: 700, fontSize: 32, lineHeight: 1 },
  stat: { fontFamily: FONT_MONO, fontWeight: 700, fontSize: 22 },
  statSmall: { fontFamily: FONT_MONO, fontWeight: 700, fontSize: 16 },
  headline: { fontFamily: FONT_SANS, fontWeight: 700, fontSize: 17, letterSpacing: "-0.01em" },
  subhead: { fontFamily: FONT_SANS, fontWeight: 700, fontSize: 13 },
  body: { fontFamily: FONT_SANS, fontWeight: 400, fontSize: 12 },
  label: { fontFamily: FONT_SANS, fontWeight: 700, fontSize: 11, letterSpacing: "0.05em" },
  micro: { fontFamily: FONT_SANS, fontWeight: 700, fontSize: 10, letterSpacing: "0.05em", textTransform: "uppercase" },
} satisfies Record<string, CSSProperties>;

// Escala de espaçamento — o "tight" (8-16px) cobre item-a-item dentro de um bloco;
// "section"/"majorSection" são novos, pra separar blocos empilhados numa mesma tela
// (antes tudo ficava preso nos mesmos 20-24px, sem folga nenhuma entre um bloco e outro).
export const SPACING = {
  inline: 6,
  tight: 12,
  content: 16,
  block: 20,
  section: 32,
  majorSection: 40,
} as const;

// Revisado com o Gustavo em 20/08/2026 a partir dos posts reais de melhor desempenho —
// a lista antiga vinha do protótipo e tinha "Trends/Humor" e "Prova social/Cliente"
// duplicando conceitos que já existiam em MODO_CONTEUDO_OPTS. Linha Editorial = sobre o
// quê (o tema); Modo de Conteúdo = como é contado (o formato/tom).
export const LINHA_EDITORIAL_OPTS = [
  "Big Campanha", // só as datas grandes: Carnaval, Dia das Mulheres, Dia das Mães, Dia
  // dos Pais, Aniversário da Bázico, São João, Copa do Mundo, Dia das Crianças (2026+),
  // Black Friday, Natal — qualquer campanha fora dessa lista usa outra linha abaixo.
  "Lançamento de produto",
  "Datas e eventos", // datas culturais menores + participação/patrocínio em evento
  // (ex: camisa assinada no We Can Run, patrocínio do BT200)
  "BaziPass",
  "Mecânica de engajamento",
  "Institucional/Marca",
  "Prova social",
  "Conteúdo de valor",
  "Operacional",
];

export const MODO_CONTEUDO_OPTS = [
  "Humor/Trend",
  "Storytelling",
  "Interativo/Enquete",
  "Educativo/Produto",
  "Institucional",
  "Urgência real",
  "Prova social",
  "Conquista/Marco",
];

export const OBJETIVO_OPTS = [
  "Comentário",
  "Salvamento",
  "Compartilhamento",
  "Perfil/Seguir",
  "Clique",
  "Curtida",
];

// Para QUEM o post é direcionado dentro do funil — diferente de OBJETIVO_OPTS acima,
// que é sobre a AÇÃO buscada. Cada um tem critério de sucesso próprio, definido também no
// GROWTH_CONTEXT (brandContext.ts) — a IA usa a mesma definição que aparece aqui na tela.
export const OBJETIVO_ESTRATEGICO_OPTS_AJUDA: Record<string, string> = {
  "Aquisição": "Atrair quem ainda não compra da Bázico (nunca-cliente ou inativo há 12+ meses). Não julgar por conversão direta — o trabalho dele é alcançar gente nova.",
  "Reativação": "Reconectar com cliente que JÁ comprou e sumiu. Tom de reencontro genuíno, nunca cobrança. Julgar pelo engajamento de quem já é seguidor antigo.",
  "Fidelização": "Aprofundar a relação com quem JÁ compra ativamente — diferente de Reativação, que é sobre quem sumiu. Julgar pelo engajamento de cliente recorrente, não alcance de gente nova.",
  "Institucional": "Não busca mover ninguém no funil de compra — reforça o que a marca significa (valores, cultura, propósito, história). Não julgar por conversão nem alcance.",
};
export const OBJETIVO_ESTRATEGICO_OPTS = Object.keys(OBJETIVO_ESTRATEGICO_OPTS_AJUDA);

// Revisado com o Gustavo em 20/08/2026. "Repost de terceiro" foi fundido em "UGC/Cliente"
// (mesma coisa na prática: cliente produziu, a Bázico repostou).
export const ORIGEM_OPTS_AJUDA: Record<string, string> = {
  "Agência": "Produzido por Gustavo ou Ari — conteúdo que o time controla e pode repetir.",
  "Parceria/Influencer": "Produzido em parceria, sob gestão da Karlinha (Head de Parceiros).",
  "UGC/Cliente": "O cliente produziu sozinho; a Bázico pegou e repostou.",
};
export const ORIGEM_OPTS = Object.keys(ORIGEM_OPTS_AJUDA);
export const STATUS_HIP_OPTS = ["Observar", "Confirmada", "Refutada"];

export const selectStyle: CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 4,
  padding: "7px 8px",
  fontSize: 12,
  border: `1px solid ${C.linha}`,
  borderRadius: 3,
  color: C.preto,
  background: C.branco,
};

export const btnPrimary: CSSProperties = {
  fontFamily: FONT_SANS,
  fontWeight: 700,
  fontSize: 12,
  padding: "8px 16px",
  background: C.preto,
  color: C.branco,
  border: "none",
  borderRadius: 3,
  cursor: "pointer",
};

export const btnSecondary: CSSProperties = {
  fontFamily: FONT_SANS,
  fontWeight: 300,
  fontSize: 12,
  padding: "8px 16px",
  background: "transparent",
  color: C.preto,
  border: `1px solid ${C.preto}`,
  borderRadius: 3,
  cursor: "pointer",
};

export const METRIC_OPTIONS = [
  { key: "alcance", label: "Alcance" },
  { key: "views", label: "Visualizações" },
  { key: "visitas", label: "Visitas ao Perfil" },
  { key: "cliques", label: "Cliques no Link" },
  { key: "interacoes", label: "Interações" },
  { key: "novos_seguidores", label: "Novos Seguidores" },
];
