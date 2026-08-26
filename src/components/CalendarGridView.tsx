"use client";

import { C, TYPE } from "@/lib/designTokens";
import { DIAS_SEMANA, MAX_STACK_VISIVEL, buildEventSegments, atribuirStacks } from "@/lib/calendarGrid";
import type { Nota } from "@/lib/types";

export type CelulaGrid = { iso: string; foraDoMes?: boolean };

function hojeIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// Renderizador compartilhado de grid — usado tanto pela visão de Mês (várias semanas)
// quanto pela de Semana (uma linha só). Cada semana é UM grid de 7 colunas × (1 linha
// de números + `MAX_STACK_VISIVEL` linhas de barra), com linhas-guia verticais de
// altura fixa por trás — é isso que faz o grid ler como uma tabela de verdade (tipo
// Google Calendar), em vez de números soltos no vazio. As barras de evento continuam
// como itens que atravessam colunas por cima dessas linhas, então uma barra de vários
// dias segue contínua visualmente mesmo com o grid por trás dela.
export function CalendarGridView({
  cells,
  notas,
  onDayClick,
  onEventClick,
  size = "compact",
}: {
  cells: CelulaGrid[];
  notas: Nota[];
  onDayClick?: (iso: string) => void;
  onEventClick?: (nota: Nota) => void;
  size?: "compact" | "large";
}) {
  const alturaData = size === "large" ? 40 : 28;
  const alturaBarra = size === "large" ? 22 : 16;
  const fonteBarra = size === "large" ? 11 : 9;
  const fonteDia = size === "large" ? 13 : 11;
  const hoje = hojeIso();

  const isoCells = cells.map((c) => c.iso);
  const segmentosTodos = buildEventSegments(notas, isoCells);
  const notaPorId = new Map(notas.map((n) => [n.id, n]));

  const semanas: CelulaGrid[][] = [];
  for (let i = 0; i < cells.length; i += 7) semanas.push(cells.slice(i, i + 7));

  const totalLinhas = 1 + MAX_STACK_VISIVEL;
  const gridTemplateRows = `${alturaData}px repeat(${MAX_STACK_VISIVEL}, ${alturaBarra}px)`;

  return (
    <div style={{ border: `1px solid ${C.linha}`, borderRadius: 4, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: `2px solid ${C.preto}` }}>
        {DIAS_SEMANA.map((d, i) => (
          <div key={i} style={{ ...TYPE.micro, color: C.cinza, textAlign: "center", padding: "8px 0" }}>
            {d}
          </div>
        ))}
      </div>

      {semanas.map((semana, weekIndex) => {
        const segsSemana = segmentosTodos.filter((s) => s.weekIndex === weekIndex);
        const comStack = atribuirStacks(segsSemana);
        const visiveis = comStack.filter((s) => s.stackRow < MAX_STACK_VISIVEL);
        const escondidos = comStack.filter((s) => s.stackRow >= MAX_STACK_VISIVEL);

        return (
          <div
            key={weekIndex}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gridTemplateRows,
              borderBottom: weekIndex < semanas.length - 1 ? `1px solid ${C.linha}` : "none",
            }}
          >
            {/* linhas-guia verticais — só decorativas, ficam atrás do conteúdo */}
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`guia-${i}`}
                style={{ gridColumn: i + 1, gridRow: `1 / span ${totalLinhas}`, borderRight: `1px solid ${C.linha}` }}
              />
            ))}

            {semana.map((cell, i) => {
              const dia = Number(cell.iso.slice(8, 10));
              const ehHoje = cell.iso === hoje;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onDayClick?.(cell.iso)}
                  disabled={!onDayClick}
                  className="baz-day-cell"
                  style={{
                    gridColumn: i + 1,
                    gridRow: 1,
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                    padding: "4px 0 0 6px",
                    border: "none",
                    background: "transparent",
                    cursor: onDayClick ? "pointer" : "default",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: fonteDia,
                      fontWeight: ehHoje ? 700 : 400,
                      color: ehHoje ? C.branco : cell.foraDoMes ? C.cinza : C.preto,
                      background: ehHoje ? C.roxo : "transparent",
                      width: ehHoje ? 22 : "auto",
                      height: ehHoje ? 22 : "auto",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {dia}
                  </span>
                </button>
              );
            })}

            {visiveis.map((s) => (
              <button
                key={s.noteId}
                type="button"
                onClick={() => {
                  const nota = notaPorId.get(s.noteId);
                  if (nota) onEventClick?.(nota);
                }}
                title={s.detalhes ? `${s.note}\n${s.detalhes}` : s.note}
                style={{
                  gridColumn: `${s.colStart + 1} / span ${s.colCount}`,
                  gridRow: s.stackRow + 2,
                  alignSelf: "center",
                  margin: "0 3px",
                  height: alturaBarra - 3,
                  background: C.roxo,
                  color: C.branco,
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: fonteBarra,
                  fontWeight: 700,
                  lineHeight: `${alturaBarra - 3}px`,
                  padding: "0 6px",
                  border: "none",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  textAlign: "left",
                  cursor: onEventClick ? "pointer" : "default",
                  borderTopLeftRadius: s.bordaEsquerdaAberta ? 0 : 3,
                  borderBottomLeftRadius: s.bordaEsquerdaAberta ? 0 : 3,
                  borderTopRightRadius: s.bordaDireitaAberta ? 0 : 3,
                  borderBottomRightRadius: s.bordaDireitaAberta ? 0 : 3,
                }}
              >
                {s.note}
              </button>
            ))}

            {escondidos.length > 0 && (
              <div
                title={escondidos.map((s) => s.note).join(" · ")}
                style={{
                  gridColumn: "1 / -1",
                  gridRow: MAX_STACK_VISIVEL + 1,
                  alignSelf: "end",
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: 9,
                  color: C.cinza,
                  padding: "0 6px",
                }}
              >
                +{escondidos.length} evento{escondidos.length > 1 ? "s" : ""}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
