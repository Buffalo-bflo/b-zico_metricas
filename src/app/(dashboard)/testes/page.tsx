import { supabaseServer } from "@/lib/supabase/server";
import { SectionTitle } from "@/components/Brand";
import { TestesClient, type Teste, type PostOpcao, type ReelTeste } from "@/components/TestesClient";
import { C } from "@/lib/designTokens";

export const dynamic = "force-dynamic";

export default async function TestesPage() {
  const supabase = supabaseServer();

  // Os posts oferecidos para montar os grupos são os mais recentes — um teste é sempre
  // sobre o que estamos publicando agora, não sobre o histórico de anos atrás.
  const [{ data: testes, error }, { data: posts }, { data: reelsTesteData }] = await Promise.all([
    supabase.from("testes").select("*").order("data_inicio", { ascending: false }),
    supabase
      .from("feed_posts")
      .select("id, post_type, post_date, description, is_reels_teste")
      .order("post_date", { ascending: false })
      .limit(120),
    // Todos os reels que nasceram como teste, sem limite de data — a lista de 120 posts
    // acima é recente demais pra garantir que os testes mais antigos apareçam aqui.
    supabase
      .from("feed_posts")
      .select("id, post_type, post_date, description, views, reach, is_reels_teste, shared_to_feed, promovido_em")
      .eq("foi_reels_teste", true)
      .order("post_date", { ascending: false }),
  ]);

  if (error) {
    return (
      <div className="baz-fade-up">
        <SectionTitle>Calendário de testes</SectionTitle>
        <p style={{ color: C.erro, fontSize: 13 }}>Erro ao buscar testes: {error.message}</p>
      </div>
    );
  }

  const todasAsListas = (testes ?? []).flatMap((t) => [...t.posts_grupo_a, ...t.posts_grupo_b]);
  const jaAgrupados = new Set(todasAsListas);

  // Reels marcados como teste na aba Feed que ainda não foram colocados em nenhum
  // Grupo A/B de um teste — ficam aqui esperando o Gustavo decidir o que fazer com eles.
  const reelsTeste = (reelsTesteData ?? []) as ReelTeste[];
  const pendentes = reelsTeste.filter((p) => p.is_reels_teste && !jaAgrupados.has(p.id));

  return (
    <TestesClient
      testesIniciais={(testes ?? []) as Teste[]}
      posts={(posts ?? []) as PostOpcao[]}
      pendentesReelsTeste={pendentes}
      reelsTeste={reelsTeste}
    />
  );
}
