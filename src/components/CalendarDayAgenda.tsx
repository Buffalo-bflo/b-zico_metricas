"use client";

import { C, btnPrimary } from "@/lib/designTokens";
import type { Nota } from "@/lib/types";

function tituloDoDia(dataIso: string): string {
  const d = new Date(dataIso + "T00:00:00");
  const texto = d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Visão de Dia: lista em cards, sem grade de horário — os eventos daqui não têm hora
// real no banco (um "16h" dentro do título é só texto solto), e é assim que o próprio
// Google Calendar trata eventos de dia inteiro: uma lista no topo, não uma grade.
export function CalendarDayAgenda({
  dataIso,
  notas,
  onEdit,
  onRemove,
  onAdd,
}: {
  dataIso: string;
  notas: Nota[];
  onEdit: (nota: Nota) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  const doDia = notas.filter((n) => n.event_date_start <= dataIso && dataIso <= n.event_date_end);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: C.preto }}>
          {tituloDoDia(dataIso)}
        </div>
        <button onClick={onAdd} className="baz-btn-primary" style={btnPrimary}>
          + Adicionar evento
        </button>
      </div>

      {doDia.length === 0 ? (
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: C.cinza, padding: "20px 0" }}>
          Nenhum evento neste dia.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {doDia.map((n) => (
            <div
              key={n.id}
              style={{
                border: `1px solid ${C.linha}`,
                borderRadius: 4,
                padding: "10px 12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.roxo, flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 700, color: C.preto }}>
                    {n.note}
                  </span>
                </div>
                {n.event_date_start !== n.event_date_end && (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.roxo, marginTop: 2, marginLeft: 16 }}>
                    {n.event_date_start === dataIso ? "Início" : n.event_date_end === dataIso ? "Fim" : "Em andamento"}
                  </div>
                )}
                {n.detalhes && (
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: C.cinza, marginTop: 4, marginLeft: 16 }}>
                    {n.detalhes}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                <button
                  onClick={() => onEdit(n)}
                  className="baz-btn-ghost-muted"
                  style={{ background: "transparent", border: "none", color: C.roxo, cursor: "pointer", fontSize: 12 }}
                >
                  editar
                </button>
                <button
                  onClick={() => onRemove(n.id)}
                  className="baz-btn-ghost-muted"
                  style={{ background: "transparent", border: "none", color: C.cinza, cursor: "pointer", fontSize: 12 }}
                >
                  remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
