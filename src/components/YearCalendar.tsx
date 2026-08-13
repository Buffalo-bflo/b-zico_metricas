"use client";

import { useState } from "react";
import { C } from "@/lib/designTokens";

type Nota = { id: string; event_date: string; note: string };

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

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

export function YearCalendar({ notas, onDayClick }: { notas: Nota[]; onDayClick?: (iso: string) => void }) {
  const [ano, setAno] = useState(new Date().getFullYear());

  const notasPorDia = new Map<string, string[]>();
  for (const n of notas) {
    const lista = notasPorDia.get(n.event_date) ?? [];
    lista.push(n.note);
    notasPorDia.set(n.event_date, lista);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 12 }}>
        <button
          onClick={() => setAno((a) => a - 1)}
          style={{ background: "transparent", border: "none", color: C.cinza, cursor: "pointer", fontSize: 16 }}
        >
          ‹
        </button>
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 14, color: C.preto }}>{ano}</div>
        <button
          onClick={() => setAno((a) => a + 1)}
          style={{ background: "transparent", border: "none", color: C.cinza, cursor: "pointer", fontSize: 16 }}
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
                    style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.cinza, textAlign: "center" }}
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                {cells.map((dia, i) => {
                  if (dia === null) return <div key={i} />;
                  const iso = toIso(ano, mes, dia);
                  const notasDia = notasPorDia.get(iso);
                  const temNota = !!notasDia?.length;
                  return (
                    <div
                      key={i}
                      onClick={() => onDayClick?.(iso)}
                      title={notasDia?.join(" · ")}
                      style={{
                        aspectRatio: "1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10,
                        borderRadius: 3,
                        cursor: onDayClick ? "pointer" : "default",
                        background: temNota ? C.roxo : "transparent",
                        color: temNota ? C.branco : C.preto,
                        fontWeight: temNota ? 700 : 400,
                      }}
                    >
                      {dia}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
