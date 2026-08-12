import { NextResponse } from "next/server";
import { runMetaSync } from "@/lib/meta/sync";

// Botão "Sincronizar agora" — chamado pelo navegador, já protegido pelo portão de
// senha normal do app (essa rota não está na lista de exceções do middleware).
export async function POST() {
  const resultado = await runMetaSync();
  return NextResponse.json(resultado);
}
