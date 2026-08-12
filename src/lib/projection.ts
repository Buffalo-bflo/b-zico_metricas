import { supabaseServer } from "@/lib/supabase/server";
import { mondayOf } from "@/lib/weeks";

const METRIC_TYPES = ["alcance", "views", "visitas", "cliques", "interacoes", "seguidores"] as const;

export type ProjecaoMetrica = {
  metric_type: (typeof METRIC_TYPES)[number];
  mediaSemanal: number;
  ultimaSemanaCompleta: number;
};

export type Projecao = {
  projecao: ProjecaoMetrica[];
  semanasUsadas: { start: string; end: string }[];
};

// Média móvel simples das últimas semanas COMPLETAS (7 dias com dado) de cada métrica
// diária. É a mesma lógica pra todas as métricas, incluindo seguidores — a ideia é
// "se o ritmo dos últimos períodos continuar parecido, é razoável esperar algo perto
// dessa média pra semana que vem". Não é um modelo estatístico sofisticado, é
// deliberadamente simples e auditável (dá pra conferir a conta à mão).
export async function computeWeeklyProjection(maxSemanas = 4): Promise<Projecao | null> {
  const supabase = supabaseServer();
  const { data } = await supabase
    .from("daily_account_metrics")
    .select("*")
    .order("metric_date", { ascending: true });

  if (!data || data.length === 0) return null;

  const porSemana = new Map<
    string,
    { start: string; end: string; dias: Set<string>; somas: Record<string, number> }
  >();

  for (const row of data) {
    const start = mondayOf(row.metric_date);
    if (!porSemana.has(start)) {
      const endDate = new Date(start + "T00:00:00");
      endDate.setDate(endDate.getDate() + 6);
      porSemana.set(start, {
        start,
        end: endDate.toISOString().slice(0, 10),
        dias: new Set(),
        somas: {},
      });
    }
    const entry = porSemana.get(start)!;
    entry.dias.add(row.metric_date);
    entry.somas[row.metric_type] = (entry.somas[row.metric_type] ?? 0) + Number(row.value);
  }

  const semanasCompletas = Array.from(porSemana.values())
    .filter((s) => s.dias.size === 7)
    .sort((a, b) => b.start.localeCompare(a.start))
    .slice(0, maxSemanas);

  if (semanasCompletas.length === 0) return null;

  const projecao: ProjecaoMetrica[] = METRIC_TYPES.map((mt) => {
    const valores = semanasCompletas.map((s) => s.somas[mt] ?? 0);
    const mediaSemanal = valores.reduce((a, b) => a + b, 0) / valores.length;
    return { metric_type: mt, mediaSemanal, ultimaSemanaCompleta: valores[0] };
  });

  return {
    projecao,
    semanasUsadas: semanasCompletas.map((s) => ({ start: s.start, end: s.end })),
  };
}
