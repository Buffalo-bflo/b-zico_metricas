import { supabaseServer } from "@/lib/supabase/server";
import { monthBounds } from "@/lib/months";

// Semana no nosso padrão: começa no domingo e termina no sábado (não é o padrão ISO,
// que começa na segunda — foi um ajuste pedido explicitamente, pra bater com como o
// time enxerga a semana no dia a dia).
function toSunday(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export type Semana = { start: string; end: string };

// Dado um "YYYY-MM-DD", devolve o domingo daquela semana no mesmo formato.
export function sundayOf(dateStr: string): string {
  return toISODate(toSunday(new Date(dateStr + "T00:00:00")));
}

// Lista todas as semanas completas (domingo a sábado) que tocam algum dia com post de
// feed, da mais recente pra mais antiga. Usada em Comparar, onde a semana precisa ser
// sempre de 7 dias completos (mesmo que atravesse a virada do mês), pra comparação justa.
export async function getAvailableWeeks(): Promise<Semana[]> {
  const supabase = supabaseServer();
  const { data } = await supabase.from("feed_posts").select("post_date").order("post_date", { ascending: true });
  if (!data || data.length === 0) return [];

  const primeira = toSunday(new Date(data[0].post_date + "T00:00:00"));
  const ultima = toSunday(new Date(data[data.length - 1].post_date + "T00:00:00"));

  const semanas: Semana[] = [];
  const cursor = new Date(primeira);
  while (cursor <= ultima) {
    const start = new Date(cursor);
    const end = new Date(cursor);
    end.setDate(end.getDate() + 6);
    semanas.push({ start: toISODate(start), end: toISODate(end) });
    cursor.setDate(cursor.getDate() + 7);
  }
  return semanas.reverse();
}

// Quebra um mês (YYYY-MM) em pedaços de domingo a sábado, cortados nas bordas do mês —
// a primeira e a última semana do mês podem ter menos de 7 dias. Ex: agosto/2026 começa
// num sábado, então a "primeira semana" dentro do mês é só o dia 01; a última semana
// (30/08 domingo a 05/09 sábado) fica cortada em 30-31/08, já que o mês termina numa
// segunda. Usada nas telas que mostram semanas dentro de um mês selecionado.
export function getWeeksInMonth(mes: string): Semana[] {
  const { start: monthStart, end: monthEnd } = monthBounds(mes);
  const semanas: Semana[] = [];
  const cursor = toSunday(new Date(monthStart + "T00:00:00"));
  const limite = new Date(monthEnd + "T00:00:00");

  while (cursor <= limite) {
    const realEnd = new Date(cursor);
    realEnd.setDate(realEnd.getDate() + 6);
    const start = toISODate(cursor) < monthStart ? monthStart : toISODate(cursor);
    const end = toISODate(realEnd) > monthEnd ? monthEnd : toISODate(realEnd);
    semanas.push({ start, end });
    cursor.setDate(cursor.getDate() + 7);
  }
  return semanas;
}

export function weekLabel(start: string, end: string): string {
  const fmt = (iso: string) => {
    const [, m, d] = iso.split("-");
    return `${d}/${m}`;
  };
  return start === end ? fmt(start) : `${fmt(start)} – ${fmt(end)}`;
}
