import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

const hoje = () => new Date().toISOString().slice(0, 10);

export async function GET() {
  const supabase = supabaseServer();
  const { data, error } = await supabase.from("testes").select("*").order("data_inicio", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ testes: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = supabaseServer();

  const obrigatorios = ["nomeTeste", "hipotese", "variavelTestada", "criterioSucesso", "dataInicio"];
  const faltando = obrigatorios.filter((c) => !String(body[c] ?? "").trim());
  if (faltando.length) {
    return NextResponse.json({ error: `Campos obrigatórios: ${faltando.join(", ")}.` }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("testes")
    .insert({
      nome_teste: body.nomeTeste.trim(),
      hipotese: body.hipotese.trim(),
      variavel_testada: body.variavelTestada.trim(),
      posts_grupo_a: body.postsGrupoA ?? [],
      posts_grupo_b: body.postsGrupoB ?? [],
      criterio_sucesso: body.criterioSucesso.trim(),
      data_inicio: body.dataInicio,
      data_fim: body.dataFim || null,
      status: body.status ?? "Planejado",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, teste: data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const supabase = supabaseServer();
  if (!body.id) return NextResponse.json({ error: "id é obrigatório." }, { status: 400 });

  const { data: atual, error: erroBusca } = await supabase
    .from("testes")
    .select("*")
    .eq("id", body.id)
    .maybeSingle();
  if (erroBusca) return NextResponse.json({ error: erroBusca.message }, { status: 500 });
  if (!atual) return NextResponse.json({ error: "Teste não encontrado." }, { status: 404 });

  const patch: Record<string, unknown> = { atualizado_em: new Date().toISOString() };

  // O critério de sucesso trava assim que o teste começa. É a regra que dá valor ao
  // teste: sem ela, dá pra olhar como está indo e reescrever o critério pra que o
  // resultado sempre "confirme" a hipótese — o que transforma teste em justificativa.
  const jaComecou = atual.data_inicio <= hoje();
  if (body.criterioSucesso !== undefined && body.criterioSucesso !== atual.criterio_sucesso) {
    if (jaComecou) {
      return NextResponse.json(
        { error: "O critério de sucesso não pode mais ser alterado: o teste já começou em " + atual.data_inicio + "." },
        { status: 409 }
      );
    }
    patch.criterio_sucesso = String(body.criterioSucesso).trim();
  }

  // Mesma lógica pra data de início: adiar o começo destravaria o critério por tabela.
  if (body.dataInicio !== undefined && body.dataInicio !== atual.data_inicio) {
    if (jaComecou) {
      return NextResponse.json({ error: "A data de início não pode ser alterada depois que o teste começou." }, { status: 409 });
    }
    patch.data_inicio = body.dataInicio;
  }

  if (body.nomeTeste !== undefined) patch.nome_teste = String(body.nomeTeste).trim();
  if (body.hipotese !== undefined) patch.hipotese = String(body.hipotese).trim();
  if (body.variavelTestada !== undefined) patch.variavel_testada = String(body.variavelTestada).trim();
  if (body.postsGrupoA !== undefined) patch.posts_grupo_a = body.postsGrupoA;
  if (body.postsGrupoB !== undefined) patch.posts_grupo_b = body.postsGrupoB;
  if (body.dataFim !== undefined) patch.data_fim = body.dataFim || null;
  if (body.leituraFinal !== undefined) patch.leitura_final = body.leituraFinal || null;
  if (body.status !== undefined) patch.status = body.status;

  if (body.resultado !== undefined) {
    const statusFinal = (patch.status ?? atual.status) as string;
    if (body.resultado && statusFinal !== "Concluído") {
      return NextResponse.json(
        { error: "O resultado só pode ser preenchido quando o teste estiver Concluído." },
        { status: 409 }
      );
    }
    patch.resultado = body.resultado || null;
  }

  // Mudar pra Concluído sem resultado deixaria um teste "fechado" sem conclusão.
  if (patch.status === "Concluído") {
    const resultadoFinal = (patch.resultado ?? atual.resultado) as string | null;
    if (!resultadoFinal) {
      return NextResponse.json(
        { error: "Para concluir o teste, informe o resultado (Confirmado, Refutado ou Inconclusivo)." },
        { status: 409 }
      );
    }
  }

  const { data, error } = await supabase.from("testes").update(patch).eq("id", body.id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, teste: data });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id é obrigatório." }, { status: 400 });
  const supabase = supabaseServer();
  const { error } = await supabase.from("testes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
