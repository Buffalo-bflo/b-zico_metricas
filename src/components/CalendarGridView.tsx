"use client";

import { C } from "@/lib/designTokens";
import { DIAS_SEMANA, MAX_STACK_VISIVEL, buildEventSegments, atribuirStacks } from "@/lib/calendarGrid";
import type { Nota } from "@/lib/types";

// Renderizador compartilhado de grid — usado tanto pela visão de Mês (várias semanas,
// `cells` com `null` de preenchimento) quanto pela de Semana (uma linha só, 7 células).
// `size="large"` (semana) ganha células/fonte maiores que `size="compact"` (mês), já
// que a semana tem uma tela inteira só pra uma linha.
export function CalendarGridView({
  cells,
  notas,
  onDayClick,
  onEventClick,
  size = "compact",
}: {
  cells: (string | null)[];
  notas: Nota[];
  onDayClick?: (iso: string) => void;
  onEventClick?: (nota: Nota) => void;
  size?: "compact" | "large";
}) {
  const alturaDia = size === "large" ? 32 : 20;
  const alturaBarra = size === "large" ? 20 : 14;
  const fonteBarra = size === "large" ? 11 : 8;
  const fonteDia = size === "large" ? 13 : 10;

  const segmentosTodos = buildEventSegments(notas, cells);
  const notaPorId = new Map(notas.map((n) => [n.id, n]));

  const semanas: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) semanas.push(cells.slice(i, i + 7));

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
        {DIAS_SEMANA.map((d, i) => (
          <div
            key={i}
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: fonteDia, color: C.cinza, textAlign: "center" }}
          >
            {d}
          </div>
        ))}
      </div>

      {semanas.map((semana, weekIndex) => {
        const segsSemana = segmentosTodos.filter((s) => s.weekIndex === weekIndex);
        const comStack = atribuirStacks(segsSemana);
        const visiveis = comStack.filter((s) => s.stackRow < MAX_STACK_VISIVEL);
        const escondidos = comStack.filter((s) => s.stackRow >= MAX_STACK_VISIVEL);
        const stacksVisiveis = visiveis.reduce((m, s) => Math.max(m, s.stackRow + 1), 0);

        return (
          <div key={weekIndex} style={{ marginBottom: size === "large" ? 8 : 4 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
              {semana.map((iso, i) => {
                if (iso === null) return <div key={i} />;
                const dia = Number(iso.slice(8, 10));
                const mes = Number(iso.slice(5, 7));
                const label = dia === 1 ? `${dia}/${mes}` : String(dia);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onDayClick?.(iso)}
                    disabled={!onDayClick}
                    className="baz-day-cell"
                    style={{
                      height: alturaDia,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: fonteDia,
                      border: "none",
                      borderRadius: 3,
                      padding: 0,
                      cursor: onDayClick ? "pointer" : "default",
                      background: "transparent",
                      color: C.preto,
                    }}
                  >
                    {label}
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
                        height: alturaBarra,
                        background: C.roxo,
                        color: C.branco,
                        fontFamily: "'Montserrat', sans-serif",
                        fontSize: fonteBarra,
                        fontWeight: 700,
                        lineHeight: `${alturaBarra}px`,
                        padding: "0 4px",
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
}
