import { supabaseServer } from "@/lib/supabase/server";
import { SectionTitle } from "@/components/Brand";
import { TestesClient, type Teste, type PostOpcao } from "@/components/TestesClient";
import { C } from "@/lib/designTokens";

export const dynamic = "force-dynamic";

export default async function TestesPage() {
  const supabase = supabaseServer();

  // Os posts oferecidos para montar os grupos são os mais recentes — um teste é sempre
  // sobre o que estamos publicando agora, não sobre o histórico de anos atrás.
  const [{ data: testes, error }, { data: posts }] = await Promise.all([
    supabase.from("testes").select("*").order("data_inicio", { ascending: false }),
    supabase
      .from("feed_posts")
      .select("id, post_type, post_date, description")
      .order("post_date", { ascending: false })
      .limit(120),
  ]);

  if (error) {
    return (
      <div className="baz-fade-up">
        <SectionTitle>Calendário de testes</SectionTitle>
        <p style={{ color: C.erro, fontSize: 13 }}>Erro ao buscar testes: {error.message}</p>
      </div>
    );
  }

  return <TestesClient testesIniciais={(testes ?? []) as Teste[]} posts={(posts ?? []) as PostOpcao[]} />;
}
