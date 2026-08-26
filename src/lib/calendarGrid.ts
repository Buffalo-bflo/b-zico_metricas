import type { Nota } from "@/lib/types";

export const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

// Quantas barras empilhadas mostrar antes de resumir o resto em "+N eventos" — acima
// disso vira exceção rara (vários eventos de vários dias se sobrepondo), não o caminho
// comum de um log pessoal de datas.
export const MAX_STACK_VISIVEL = 3;

export type CelulaMes = { dia: number; mes: number; ano: number; foraDoMes: boolean };

// Sempre preenche as 6 semanas completas (nunca deixa célula vazia) — os dias que
// "vazam" do mês anterior/seguinte entram com `foraDoMes: true`, pra aparecerem
// esmaecidos em vez de um buraco em branco no grid (mesmo padrão do Google Calendar/
// Notion). Como carregam a própria data real, uma barra de evento pode continuar
// visualmente até esses dias esmaecidos também, em vez de cortar seco na borda do mês.
export function buildMonthGrid(year: number, month: number): CelulaMes[] {
  const primeiro = new Date(year, month - 1, 1);
  const offset = primeiro.getDay();
  const diasNoMes = new Date(year, month, 0).getDate();
  const diasMesAnterior = new Date(year, month - 1, 0).getDate();
  const [anoAnt, mesAnt] = month === 1 ? [year - 1, 12] : [year, month - 1];
  const [anoProx, mesProx] = month === 12 ? [year + 1, 1] : [year, month + 1];

  const cells: CelulaMes[] = [];
  for (let i = offset; i > 0; i--) {
    cells.push({ dia: diasMesAnterior - i + 1, mes: mesAnt, ano: anoAnt, foraDoMes: true });
  }
  for (let d = 1; d <= diasNoMes; d++) {
    cells.push({ dia: d, mes: month, ano: year, foraDoMes: false });
  }
  let d = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ dia: d, mes: mesProx, ano: anoProx, foraDoMes: true });
    d++;
  }
  return cells;
}

export function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export type Segmento = {
  noteId: string;
  note: string;
  detalhes: string | null;
  weekIndex: number;
  colStart: number; // 0 a columns-1
  colCount: number;
  bordaEsquerdaAberta: boolean; // o evento continua antes do que aparece aqui
  bordaDireitaAberta: boolean; // o evento continua depois do que aparece aqui
};

// Recorta cada nota pra dentro da janela de datas dadas e quebra em um segmento por
// linha (uma barra não pode atravessar a quebra de linha do grid) — funciona igual pra
// um mês inteiro (várias semanas) e pra uma única semana (uma linha só, 7 datas),
// porque o algoritmo só olha posição dentro do array — nada aqui é específico de "mês".
export function buildEventSegments(notas: Nota[], cells: string[], columns = 7): Segmento[] {
  const segmentos: Segmento[] = [];

  for (const n of notas) {
    let atual: Segmento | null = null;
    let ultimoIso: string | null = null;

    const fechar = () => {
      if (!atual) return;
      atual.bordaDireitaAberta = ultimoIso !== n.event_date_end;
      segmentos.push(atual);
      atual = null;
    };

    cells.forEach((iso, cellIndex) => {
      const weekIndex = Math.floor(cellIndex / columns);
      const col = cellIndex % columns;
      const dentro = iso >= n.event_date_start && iso <= n.event_date_end;

      if (!dentro) {
        fechar();
        return;
      }
      if (atual && atual.weekIndex !== weekIndex) fechar();
      if (!atual) {
        atual = {
          noteId: n.id,
          note: n.note,
          detalhes: n.detalhes,
          weekIndex,
          colStart: col,
          colCount: 0,
          bordaEsquerdaAberta: iso !== n.event_date_start,
          bordaDireitaAberta: false,
        };
      }
      atual.colCount += 1;
      ultimoIso = iso;
    });

    fechar();
  }

  return segmentos;
}

function overlapCols(a: Segmento, b: Segmento): boolean {
  return a.colStart < b.colStart + b.colCount && b.colStart < a.colStart + a.colCount;
}

// Empilha os segmentos de uma mesma linha em "stacks" (stackRow), sempre pegando a
// primeira linha livre que não colide em coluna com nada já colocado — mesmo princípio
// de empilhamento de qualquer calendário de mês/semana.
export function atribuirStacks(segmentosDaLinha: Segmento[]): (Segmento & { stackRow: number })[] {
  const comStack: (Segmento & { stackRow: number })[] = [];
  const ordenados = [...segmentosDaLinha].sort((a, b) => a.colStart - b.colStart);
  for (const seg of ordenados) {
    let stackRow = 0;
    while (comStack.some((s) => s.stackRow === stackRow && overlapCols(s, seg))) stackRow++;
    comStack.push({ ...seg, stackRow });
  }
  return comStack;
}
