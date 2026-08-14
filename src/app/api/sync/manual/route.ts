import { NextResponse } from "next/server";
import { runMetaSync } from "@/lib/meta/sync";

// Botão "Sincronizar agora" — chamado pelo navegador, já protegido pelo portão de
// senha normal do app (essa rota não está na lista de exceções do middleware).
export async function POST() {
  try {
    const resultado = await runMetaSync();
    return NextResponse.json(resultado);
  } catch (e) {
    // Mesmo que algo escape do tratamento interno do runMetaSync, o botão sempre mostra
    // a mensagem de erro de verdade em vez do genérico "Não foi possível conectar".
    return NextResponse.json(
      { dailyMetricRows: 0, feedPosts: 0, storyPosts: 0, publicoSalvo: false, errors: [e instanceof Error ? e.message : String(e)] },
      { status: 200 }
    );
  }
}
