"use client";

import { useState } from "react";
import { C } from "@/lib/designTokens";
import type { Nota } from "@/lib/types";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

// Quantas barras empilhadas mostrar antes de resumir o resto em "+N eventos" — acima
// disso vira exceção rara (vários eventos de vários dias se sobrepondo), não o caminho
// comum de um log pessoal de datas.
const MAX_STACK_VISIVEL = 3;

function buildMonthGrid(year: number, month: number): (number | null)[] {
  const primeiro = new Date(year, month - 1, 1);
  const offset = primeiro.getDay();
  const diasNoMes = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= diasNoMes; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

type Segmento = {
  noteId: string;
  note: string;
  weekIndex: number;
  colStart: number; // 0-6
  colCount: number;
  bordaEsquerdaAberta: boolean; // o evento continua antes do que aparece aqui
  bordaDireitaAberta: boolean; // o evento continua depois do que aparece aqui
};

// Recorta cada nota pro mês em questão e quebra em um segmento por semana (uma barra
// não pode atravessar a quebra de linha do grid) — é assim que Google Calendar/Notion
// fazem: uma barra contínua por semana, com as pontas "abertas" quando o evento
// continua fora do trecho visível ali.
function buildEventSegments(
  notas: Nota[],
  year: number,
  month: number,
  offset: number,
  diasNoMes: number
): Segmento[] {
  const monthStartIso = toIso(year, month, 1);
  const monthEndIso = toIso(year, month, diasNoMes);
  const segmentos: Segmento[] = [];

  for (const n of notas) {
    if (n.event_date_end < monthStartIso || n.event_date_start > monthEndIso) continue;

    const clipStartIso = n.event_date_start > monthStartIso ? n.event_date_start : monthStartIso;
    const clipEndIso = n.event_date_end < monthEndIso ? n.event_date_end : monthEndIso;
    const diaInicio = Number(clipStartIso.slice(8, 10));
    const diaFim = Number(clipEndIso.slice(8, 10));

    let atual: Segmento | null = null;
    const fechar = (ultimoDiaIso: string) => {
      if (!atual) return;
      atual.bordaDireitaAberta = ultimoDiaIso !== n.event_date_end;
      segmentos.push(atual);
      atual = null;
    };

    for (let dia = diaInicio; dia <= diaFim; dia++) {
      const cellIndex = offset + (dia - 1);
      const weekIndex = Math.floor(cellIndex / 7);
      const col = cellIndex % 7;
      const isoDia = toIso(year, month, dia);

      if (atual && atual.weekIndex !== weekIndex) fechar(toIso(year, month, dia - 1));
      if (!atual) {
        atual = {
          noteId: n.id,
          note: n.note,
          weekIndex,
          colStart: col,
          colCount: 0,
          bordaEsquerdaAberta: isoDia !== n.event_date_start,
          bordaDireitaAberta: false,
        };
      }
      atual.colCount += 1;
      if (dia === diaFim) fechar(isoDia);
    }
  }

  return segmentos;
}

function overlapCols(a: Segmento, b: Segmento): boolean {
  return a.colStart < b.colStart + b.colCount && b.colStart < a.colStart + a.colCount;
}

// Empilha os segmentos de uma mesma semana em "linhas" (stackRow), sempre pegando a
// primeira linha livre que não colide em coluna com nada já colocado — mesmo princípio
// de empilhamento de qualquer calendário de mês.
function atribuirStacks(segmentosDaSemana: Segmento[]): (Segmento & { stackRow: number })[] {
  const comStack: (Segmento & { stackRow: number })[] = [];
  const ordenados = [...segmentosDaSemana].sort((a, b) => a.colStart - b.colStart);
  for (const seg of ordenados) {
    let stackRow = 0;
    while (comStack.some((s) => s.stackRow === stackRow && overlapCols(s, seg))) stackRow++;
    comStack.push({ ...seg, stackRow });
  }
  return comStack;
}

export function YearCalendar({ notas, onDayClick }: { notas: Nota[]; onDayClick?: (iso: string) => void }) {
  const [ano, setAno] = useState(new Date().getFullYear());

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 12 }}>
        <button
          onClick={() => setAno((a) => a - 1)}
          className="baz-icon-btn baz-touch-target"
          style={{ background: "transparent", border: "none", color: C.cinza, cursor: "pointer", fontSize: 16, width: 28, height: 28 }}
        >
          ‹
        </button>
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 14, color: C.preto }}>{ano}</div>
        <button
          onClick={() => setAno((a) => a + 1)}
          className="baz-icon-btn baz-touch-target"
          style={{ background: "transparent", border: "none", color: C.cinza, cursor: "pointer", fontSize: 16, width: 28, height: 28 }}
        >
          ›
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
        }}
      >
        {MESES.map((nomeMes, idx) => {
          const mes = idx + 1;
          const cells = buildMonthGrid(ano, mes);
          const offset = cells.findIndex((c) => c !== null);
          const diasNoMes = cells.filter((c) => c !== null).length;
          const segmentosMes = buildEventSegments(notas, ano, mes, offset, diasNoMes);
          const semanas: (number | null)[][] = [];
          for (let i = 0; i < cells.length; i += 7) semanas.push(cells.slice(i, i + 7));

          return (
            <div key={mes} style={{ border: `1px solid ${C.linha}`, borderRadius: 4, padding: 10 }}>
              <div
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.preto,
                  marginBottom: 6,
                  textAlign: "center",
                }}
              >
                {nomeMes}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 2 }}>
                {DIAS_SEMANA.map((d, i) => (
                  <div
                    key={i}
                    style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.cinza, textAlign: "center" }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {semanas.map((semana, weekIndex) => {
                const segsSemana = segmentosMes.filter((s) => s.weekIndex === weekIndex);
                const comStack = atribuirStacks(segsSemana);
                const visiveis = comStack.filter((s) => s.stackRow < MAX_STACK_VISIVEL);
                const escondidos = comStack.filter((s) => s.stackRow >= MAX_STACK_VISIVEL);
                const stacksVisiveis = visiveis.reduce((m, s) => Math.max(m, s.stackRow + 1), 0);

                return (
                  <div key={weekIndex} style={{ marginBottom: 4 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                      {semana.map((dia, i) => {
                        if (dia === null) return <div key={i} />;
                        const iso = toIso(ano, mes, dia);
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => onDayClick?.(iso)}
                            disabled={!onDayClick}
                            className="baz-day-cell"
                            style={{
                              height: 20,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 10,
                              border: "none",
                              borderRadius: 3,
                              padding: 0,
                              cursor: onDayClick ? "pointer" : "default",
                              background: "transparent",
                              color: C.preto,
                            }}
                          >
                            {dia}
                          </button>
                        );
                      })}
                    </div>

                    {Array.from({ length: stacksVisiveis }).map((_, stackRow) => (
                      <div
                        key={stackRow}
                        style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginTop: 2 }}
                      >
                        {visiveis
                          .filter((s) => s.stackRow === stackRow)
                          .map((s) => (
                            <div
                              key={s.noteId}
                              title={s.note}
                              style={{
                                gridColumn: `${s.colStart + 1} / span ${s.colCount}`,
                                height: 14,
                                background: C.roxo,
                                color: C.branco,
                                fontFamily: "'Montserrat', sans-serif",
                                fontSize: 8,
                                fontWeight: 700,
                                lineHeight: "14px",
                                padding: "0 4px",
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                                textOverflow: "ellipsis",
                                borderTopLeftRadius: s.bordaEsquerdaAberta ? 0 : 3,
                                borderBottomLeftRadius: s.bordaEsquerdaAberta ? 0 : 3,
                                borderTopRightRadius: s.bordaDireitaAberta ? 0 : 3,
                                borderBottomRightRadius: s.bordaDireitaAberta ? 0 : 3,
                              }}
                            >
                              {s.note}
                            </div>
                          ))}
                      </div>
                    ))}

                    {escondidos.length > 0 && (
                      <div
                        title={escondidos.map((s) => s.note).join(" · ")}
                        style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 8, color: C.cinza, marginTop: 2 }}
                      >
                        +{escondidos.length} evento{escondidos.length > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
