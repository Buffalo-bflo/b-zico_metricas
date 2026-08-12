import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("ai_recommendations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recommendation: data ?? null });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { recommendationText, periodContext } = body;

  if (!recommendationText || !recommendationText.trim()) {
    return NextResponse.json({ error: "Cole o texto da recomendação antes de salvar." }, { status: 400 });
  }

  const supabase = supabaseServer();
  const { error } = await supabase.from("ai_recommendations").insert({
    period_context: periodContext ?? null,
    recommendation_text: recommendationText,
    model_used: "Claude.ai (colado manualmente)",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
