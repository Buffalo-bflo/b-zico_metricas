import { getAvailableMonths, monthBounds, monthLabelCap } from "@/lib/months";
import { getWeeksInMonth, weekLabel } from "@/lib/weeks";

export type PeriodSearchParams = { mes?: string; periodo?: string; semana?: string };

export type ResolvedPeriod = {
  mes: string;
  periodo: "mes" | "semana";
  start: string;
  end: string;
  label: string;
  semanas: { start: string; end: string }[];
};

// Traduz os parâmetros da URL (mês, ou mês+semana) num intervalo de datas concreto,
// usado por Visão Geral, Feed, Stories e Público pra filtrar os dados. Semana aqui
// sempre é domingo-a-sábado, cortada nas bordas do mês selecionado (ver lib/weeks.ts).
export async function resolvePeriod(params: PeriodSearchParams): Promise<ResolvedPeriod> {
  const meses = await getAvailableMonths();
  const mes = params.mes && meses.includes(params.mes) ? params.mes : meses[0] ?? "";
  const periodo = params.periodo === "semana" ? "semana" : "mes";
  const semanas = mes ? getWeeksInMonth(mes) : [];

  if (periodo === "semana" && semanas.length > 0) {
    const semana = semanas.find((s) => s.start === params.semana) ?? semanas[0];
    return {
      mes,
      periodo: "semana",
      start: semana.start,
      end: semana.end,
      label: `Semana ${weekLabel(semana.start, semana.end)}`,
      semanas,
    };
  }

  const { start, end } = monthBounds(mes);
  return { mes, periodo: "mes", start, end, label: monthLabelCap(mes), semanas };
}
