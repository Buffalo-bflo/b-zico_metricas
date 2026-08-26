import { supabaseServer } from "@/lib/supabase/server";
import { SectionTitle } from "@/components/Brand";
import { CalendarioClient } from "@/components/CalendarioClient";
import { C } from "@/lib/designTokens";
import type { Nota } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
  const supabase = supabaseServer();

  // Sem filtro de período aqui de propósito: o calendário é pra mostrar todas as
  // datas cadastradas, não só as do período selecionado nas outras telas.
  const { data: notas, error } = await supabase
    .from("context_notes")
    .select("*")
    .order("event_date_start", { ascending: true });

  if (error) {
    return (
      <div className="baz-fade-up">
        <SectionTitle>Calendário</SectionTitle>
        <p style={{ color: C.erro, fontSize: 13 }}>Erro ao buscar datas: {error.message}</p>
      </div>
    );
  }

  return <CalendarioClient notasIniciais={(notas ?? []) as Nota[]} />;
}
