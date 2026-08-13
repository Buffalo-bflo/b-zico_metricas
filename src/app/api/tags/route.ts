import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = supabaseServer();
  const { data, error } = await supabase.from("post_tags").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tags: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    postId,
    editorialLine,
    contentMode,
    engagementObjective,
    origin,
    hypothesis,
    hypothesisStatus,
    actualResult,
    strategicObjective,
  } = body;

  if (!postId) {
    return NextResponse.json({ error: "postId é obrigatório." }, { status: 400 });
  }

  const supabase = supabaseServer();
  const { error } = await supabase.from("post_tags").upsert(
    {
      post_id: postId,
      editorial_line: editorialLine || null,
      content_mode: contentMode || null,
      engagement_objective: engagementObjective || null,
      strategic_objective: strategicObjective || null,
      origin: origin || "Interno",
      hypothesis: hypothesis || null,
      hypothesis_status: hypothesisStatus || "Observar",
      actual_result: actualResult || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "post_id" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
