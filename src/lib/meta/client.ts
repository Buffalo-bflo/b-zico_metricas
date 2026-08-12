import { supabaseServer } from "@/lib/supabase/server";

const GRAPH_VERSION = "v26.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export type MetaCredentials = {
  pageId: string;
  igUserId: string;
  pageAccessToken: string;
};

export async function getMetaCredentials(): Promise<MetaCredentials | null> {
  const supabase = supabaseServer();
  const { data } = await supabase.from("meta_integration").select("*").eq("id", true).maybeSingle();
  if (!data) return null;
  return { pageId: data.page_id, igUserId: data.ig_user_id, pageAccessToken: data.page_access_token };
}

// Chamada genérica de leitura à Graph API. Nunca usada pra escrever/publicar nada —
// só GET, só métricas e conteúdo já existente.
export async function graphGet<T = Record<string, unknown>>(
  path: string,
  params: Record<string, string>,
  token: string
): Promise<T> {
  const url = new URL(`${GRAPH_BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", token);

  const res = await fetch(url.toString());
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `Graph API error (${res.status}) em ${path}`);
  }
  return json as T;
}
