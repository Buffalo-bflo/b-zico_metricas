import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = supabaseServer();
  const periodStart = req.nextUrl.searchParams.get("periodStart");
  const periodEnd = req.nextUrl.searchParams.get("periodEnd");

  const { data: notas } = await supabase.from("context_notes").select("*").order("event_date", { ascending: true });

  let seguidores = null;
  let horario = null;
  if (periodStart && periodEnd) {
    const { data: s } = await supabase
      .from("monthly_follower_summary")
      .select("*")
      .eq("period_start", periodStart)
      .eq("period_end", periodEnd)
      .maybeSingle();
    seguidores = s;

    const { data: h } = await supabase
      .from("best_posting_time")
      .select("*")
      .eq("period_start", periodStart)
      .eq("period_end", periodEnd)
      .eq("day_of_week", "")
      .maybeSingle();
    horario = h;
  }

  return NextResponse.json({ notas: notas ?? [], seguidores, horario });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = supabaseServer();

  if (body.kind === "contexto_add") {
    if (!body.nota?.trim() || !body.data) {
      return NextResponse.json({ error: "Data e texto da nota são obrigatórios." }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("context_notes")
      .insert({ event_date: body.data, note: body.nota.trim() })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, nota: data });
  }

  if (body.kind === "contexto_remove") {
    const { error } = await supabase.from("context_notes").delete().eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.kind === "seguidores") {
    const { error } = await supabase.from("monthly_follower_summary").upsert(
      {
        period_start: body.periodStart,
        period_end: body.periodEnd,
        period_label: body.periodLabel ?? "",
        gained: Number(body.ganhos) || 0,
        lost: Number(body.perdidos) || 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "period_start,period_end" }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.kind === "horario") {
    const { error } = await supabase.from("best_posting_time").upsert(
      {
        period_start: body.periodStart,
        period_end: body.periodEnd,
        day_of_week: "",
        peak_window: body.melhorHorario ?? "",
      },
      { onConflict: "period_start,period_end,day_of_week" }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: `kind "${body.kind}" desconhecido.` }, { status: 400 });
}
