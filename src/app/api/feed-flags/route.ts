import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Marca/desmarca flags de um post do Feed:
// - paidBoost: teve tráfego pago — exclui da média de referência orgânica.
// - reelsTeste: publicado só como teste (variação de gancho/formato) — some da fila
//   de Marcar Conteúdo na Estratégia e passa a aguardar agrupamento na aba Testes.
export async function POST(req: NextRequest) {
  const { postId, paidBoost, reelsTeste } = await req.json();
  if (!postId) return NextResponse.json({ error: "postId é obrigatório." }, { status: 400 });

  const patch: Record<string, boolean> = {};
  if (paidBoost !== undefined) patch.paid_boost = !!paidBoost;
  if (reelsTeste !== undefined) {
    patch.is_reels_teste = !!reelsTeste;
    // Marcar manualmente também registra que nasceu como teste; desmarcar não apaga isso,
    // pra não perder o histórico se foi um engano.
    if (reelsTeste) patch.foi_reels_teste = true;
  }

  const supabase = supabaseServer();
  const { error } = await supabase.from("feed_posts").update(patch).eq("id", postId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
