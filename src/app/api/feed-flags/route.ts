import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Marca/desmarca um post do Feed como impulsionado (tráfego pago) — usado pra excluir
// do cálculo de média orgânica de referência, já que impulsionamento infla as métricas.
export async function POST(req: NextRequest) {
  const { postId, paidBoost } = await req.json();
  if (!postId) return NextResponse.json({ error: "postId é obrigatório." }, { status: 400 });

  const supabase = supabaseServer();
  const { error } = await supabase.from("feed_posts").update({ paid_boost: !!paidBoost }).eq("id", postId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
