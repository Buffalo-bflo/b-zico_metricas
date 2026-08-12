import Papa from "papaparse";
import { parseCount, parseDataHora, TIPO_POST_MAP } from "./shared";

export interface ParsedFeedPost {
  id: string;
  account_username: string;
  post_type: string;
  raw_post_type: string;
  description: string;
  permalink: string;
  published_at: string;
  post_date: string;
  duration_seconds: number | null;
  views: number;
  reach: number;
  likes: number;
  shares: number;
  follows: number;
  comments: number;
  saves: number;
  source_file: string;
}

export interface ParsedStoryPost {
  id: string;
  account_username: string;
  description: string;
  published_at: string;
  post_date: string;
  views: number;
  reach: number;
  link_clicks: number;
  replies: number;
  follows: number;
  source_file: string;
}

export interface FeedStoriesParseResult {
  feedPosts: ParsedFeedPost[];
  storyPosts: ParsedStoryPost[];
  errors: string[];
}

// A exportação de Feed e a de Stories do Meta Business Suite não têm exatamente as
// mesmas colunas (Stories não tem Curtidas/Comentários/Salvamentos, mas pode ter
// Cliques no link/Respostas). Por isso lemos tudo pelo nome do cabeçalho e cada
// coluna ausente vira 0, em vez de assumir um único formato fixo de colunas.
export function parseFeedStoriesCsv(csvText: string, sourceFile: string): FeedStoriesParseResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const feedPosts: ParsedFeedPost[] = [];
  const storyPosts: ParsedStoryPost[] = [];
  const errors: string[] = [];

  for (const row of parsed.data) {
    const id = row["Identificação do post"]?.trim();
    if (!id) continue;

    const rawTipo = row["Tipo de post"]?.trim() ?? "";
    const tipo = TIPO_POST_MAP[rawTipo] ?? rawTipo;

    try {
      const { publishedAt, postDate } = parseDataHora(row["Data"], row["Horário de publicação"]);

      if (tipo === "Story") {
        storyPosts.push({
          id,
          account_username: row["Nome de usuário da conta"] ?? "",
          description: row["Descrição"] ?? "",
          published_at: publishedAt.toISOString(),
          post_date: postDate,
          views: parseCount(row["Visualizações"]),
          reach: parseCount(row["Alcance"]),
          link_clicks: parseCount(row["Cliques no link"]),
          replies: parseCount(row["Respostas"]),
          follows: parseCount(row["Seguimentos"]),
          source_file: sourceFile,
        });
      } else {
        feedPosts.push({
          id,
          account_username: row["Nome de usuário da conta"] ?? "",
          post_type: tipo,
          raw_post_type: rawTipo,
          description: row["Descrição"] ?? "",
          permalink: row["Link permanente"] ?? "",
          published_at: publishedAt.toISOString(),
          post_date: postDate,
          duration_seconds: row["Duração (s)"] ? parseCount(row["Duração (s)"]) : null,
          views: parseCount(row["Visualizações"]),
          reach: parseCount(row["Alcance"]),
          likes: parseCount(row["Curtidas"]),
          shares: parseCount(row["Compartilhamentos"]),
          follows: parseCount(row["Seguimentos"]),
          comments: parseCount(row["Comentários"]),
          saves: parseCount(row["Salvamentos"]),
          source_file: sourceFile,
        });
      }
    } catch (e) {
      errors.push(`Post ${id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { feedPosts, storyPosts, errors };
}
