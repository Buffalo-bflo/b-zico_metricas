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

export const LINHA_EDITORIAL_OPTS = [
  "Território de campanha",
  "Conteúdo de valor",
  "BaziPass",
  "Trends/Humor",
  "Motivacional",
  "Mais vendidos",
  "Mandamentos e Cultura",
  "Indique e Ganhe",
  "Lançamento de produto",
  "Humanização/Bastidores",
  "Ancoragem cultural",
  "Prova social/Cliente",
  "Operacional (sorteio/live)",
];

export const MODO_CONTEUDO_OPTS = [
  "Insight/Autoridade",
  "Comunidade/UGC",
  "Humor",
  "Prova social",
  "Institucional",
  "Dilema/Pergunta",
  "Storytelling",
  "Educativo/Produto",
  "Urgência real",
  "Milestone/Marco",
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
// que é sobre a AÇÃO buscada. Cada um tem critério de sucesso próprio (ver GROWTH_CONTEXT).
export const OBJETIVO_ESTRATEGICO_OPTS = ["Aquisição", "Reativação", "Fidelização", "Institucional"];

export const ORIGEM_OPTS = ["Interno", "Parceria/Influencer", "UGC/Cliente", "Repost de terceiro"];
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
