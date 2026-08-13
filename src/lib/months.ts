import { supabaseServer } from "@/lib/supabase/server";

// Lista os meses (YYYY-MM) que têm pelo menos um post de feed, do mais recente pro mais
// antigo. Precisa paginar: o Supabase corta em 1.000 linhas por consulta e, com quase
// 2 mil posts, meses inteiros sumiriam do seletor sem nenhum aviso.
export async function getAvailableMonths(): Promise<string[]> {
  const supabase = supabaseServer();
  const meses = new Set<string>();
  for (let de = 0; ; de += 1000) {
    const { data } = await supabase
      .from("feed_posts")
      .select("post_date")
      .order("post_date", { ascending: true })
      .range(de, de + 999);
    if (!data?.length) break;
    for (const p of data) meses.add(p.post_date.slice(0, 7));
    if (data.length < 1000) break;
  }
  return Array.from(meses).sort().reverse();
}

export const MESES_NOMES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export function monthLabel(mes: string): string {
  const [ano, mesNum] = mes.split("-");
  return `${MESES_NOMES[Number(mesNum) - 1]} de ${ano}`;
}

// Só o nome do mês, sem o ano — usado quando o ano já aparece num seletor separado.
export function monthOnlyLabel(mes: string): string {
  const nome = MESES_NOMES[Number(mes.split("-")[1]) - 1];
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}

// Só a primeira letra maiúscula (ex: "Agosto de 2026") — não usar CSS text-transform:
// capitalize aqui, porque isso deixaria "de" e outras palavras maiúsculas também.
export function monthLabelCap(mes: string): string {
  const label = monthLabel(mes);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function monthBounds(mes: string): { start: string; end: string } {
  const [y, m] = mes.split("-").map(Number);
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}
