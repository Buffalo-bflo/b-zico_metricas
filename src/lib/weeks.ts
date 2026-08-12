import { supabaseServer } from "@/lib/supabase/server";

// Semana no padrão ISO: começa na segunda-feira. Isso é o que permite uma "semana"
// atravessar a virada do mês naturalmente (ex: 27/07 a 02/08), sem precisar de
// nenhum caso especial — a semana é sempre 7 dias a partir da segunda-feira,
// não importa se o mês muda no meio.
function toMonday(date: Date): Date {
  const d = new Date(date);
  const dia = d.getDay(); // 0 = domingo
  const offset = dia === 0 ? -6 : 1 - dia;
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export type Semana = { start: string; end: string };

// Lista todas as semanas (segunda a domingo) que tocam algum dia com post de feed,
// da mais recente pra mais antiga.
export async function getAvailableWeeks(): Promise<Semana[]> {
  const supabase = supabaseServer();
  const { data } = await supabase.from("feed_posts").select("post_date").order("post_date", { ascending: true });
  if (!data || data.length === 0) return [];

  const primeira = toMonday(new Date(data[0].post_date + "T00:00:00"));
  const ultima = toMonday(new Date(data[data.length - 1].post_date + "T00:00:00"));

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

export function weekLabel(start: string, end: string): string {
  const fmt = (iso: string) => {
    const [, m, d] = iso.split("-");
    return `${d}/${m}`;
  };
  return `${fmt(start)} – ${fmt(end)}`;
}
