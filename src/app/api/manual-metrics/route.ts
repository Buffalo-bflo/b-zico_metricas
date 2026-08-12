import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

function activeMonthBounds(dateInMonth: string) {
  const [y, m] = dateInMonth.split("-").map(Number);
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export async function GET(req: NextRequest) {
  const supabase = supabaseServer();
  const mesAtivo = req.nextUrl.searchParams.get("mes");

  const { data: contexto } = await supabase.from("weekly_context").select("*").eq("id", true).maybeSingle();

  let seguidores = null;
  let horario = null;
  if (mesAtivo) {
    const { start, end } = activeMonthBounds(mesAtivo);
    const { data: s } = await supabase
      .from("monthly_follower_summary")
      .select("*")
      .eq("period_start", start)
      .eq("period_end", end)
      .maybeSingle();
    seguidores = s;

    const { data: h } = await supabase
      .from("best_posting_time")
      .select("*")
      .eq("period_start", start)
      .eq("period_end", end)
      .eq("day_of_week", "")
      .maybeSingle();
    horario = h;
  }

  return NextResponse.json({
    contexto: contexto?.context_text ?? "",
    seguidores,
    horario,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = supabaseServer();

  if (body.kind === "contexto") {
    const { error } = await supabase
      .from("weekly_context")
      .upsert({ id: true, context_text: body.contexto ?? "", updated_at: new Date().toISOString() });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.kind === "seguidores") {
    const { start, end } = activeMonthBounds(body.mesAtivo);
    const { error } = await supabase.from("monthly_follower_summary").upsert(
      {
        period_start: start,
        period_end: end,
        period_label: body.periodo ?? "",
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
    const { start, end } = activeMonthBounds(body.mesAtivo);
    const { error } = await supabase.from("best_posting_time").upsert(
      {
        period_start: start,
        period_end: end,
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
