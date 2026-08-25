import type { Nota } from "@/lib/types";

export type LembreteEvento = {
  id: string;
  note: string;
  tipo: "hoje" | "proximo";
  diasRestantes?: number;
  ateData?: string;
};

const LIMIARES = [15, 5, 1];

// Datas do Postgres (tipo `date`) não têm fuso — comparar em UTC evita que o horário
// local do servidor empurre "hoje" pro dia errado perto da meia-noite.
function parseDataUTC(iso: string): number {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return Date.UTC(ano, mes - 1, dia);
}

function diasEntre(deIso: string, ateIso: string): number {
  const MS_POR_DIA = 24 * 60 * 60 * 1000;
  return Math.round((parseDataUTC(ateIso) - parseDataUTC(deIso)) / MS_POR_DIA);
}

// Função pura (sem acesso a banco) pra ficar fácil de testar/raciocinar: dado o
// conjunto de notas e a data de "hoje", devolve só as que merecem aparecer no lembrete
// agora — 15/5/1 dia(s) antes do início, ou qualquer dia dentro do próprio evento.
// Quando os dois critérios bateriam pra mesma nota, "hoje" vence — é mais acionável
// que uma contagem regressiva.
export function computeLembretes(notas: Nota[], hoje: Date): LembreteEvento[] {
  const hojeIso = hoje.toISOString().slice(0, 10);
  const lembretes: LembreteEvento[] = [];

  for (const n of notas) {
    const acontecendoHoje = hojeIso >= n.event_date_start && hojeIso <= n.event_date_end;
    if (acontecendoHoje) {
      lembretes.push({
        id: n.id,
        note: n.note,
        tipo: "hoje",
        ateData: n.event_date_end !== n.event_date_start ? n.event_date_end : undefined,
      });
      continue;
    }
    const diasRestantes = diasEntre(hojeIso, n.event_date_start);
    if (LIMIARES.includes(diasRestantes)) {
      lembretes.push({ id: n.id, note: n.note, tipo: "proximo", diasRestantes });
    }
  }

  return lembretes;
}
