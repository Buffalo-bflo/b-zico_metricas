"use client";

import { useState } from "react";
import { SectionTitle } from "@/components/Brand";
import { C, selectStyle, btnPrimary, btnSecondary } from "@/lib/designTokens";
import { buildMonthGrid, toIso } from "@/lib/calendarGrid";
import { sundayOf, weekLabel } from "@/lib/weeks";
import { fmtDate } from "@/lib/metrics";
import { CalendarGridView, type CelulaGrid } from "@/components/CalendarGridView";
import { CalendarDayAgenda } from "@/components/CalendarDayAgenda";
import type { Nota } from "@/lib/types";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

type Modo = "dia" | "semana" | "mes";

function hojeIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, delta: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function addMonthsKeepingFirst(iso: string, delta: number): string {
  const [anoStr, mesStr] = iso.split("-");
  let ano = Number(anoStr);
  let mes = Number(mesStr) + delta;
  while (mes > 12) {
    mes -= 12;
    ano += 1;
  }
  while (mes < 1) {
    mes += 12;
    ano -= 1;
  }
  return toIso(ano, mes, 1);
}

const formVazio = { dataInicio: "", dataFim: "", titulo: "", detalhes: "" };
const labelStyle = { fontFamily: "'Montserrat', sans-serif", fontSize: 11, color: C.cinza };

const modoBtnStyle = (active: boolean) => ({
  fontFamily: "'Montserrat', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  padding: "6px 14px",
  border: "none",
  background: active ? C.preto : "transparent",
  color: active ? C.branco : C.cinza,
  cursor: "pointer",
});

export function CalendarioClient({ notasIniciais }: { notasIniciais: Nota[] }) {
  const [notas, setNotas] = useState(notasIniciais);
  const [modo, setModo] = useState<Modo>("mes");
  const [dataFoco, setDataFoco] = useState(hojeIso());
  const [form, setForm] = useState(formVazio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const abrirNovo = (dataInicioPrefill?: string) => {
    setEditandoId(null);
    setForm({ ...formVazio, dataInicio: dataInicioPrefill ?? "" });
    setErro("");
  };

  const abrirEdicao = (nota: Nota) => {
    setEditandoId(nota.id);
    setForm({
      dataInicio: nota.event_date_start,
      dataFim: nota.event_date_start === nota.event_date_end ? "" : nota.event_date_end,
      titulo: nota.note,
      detalhes: nota.detalhes ?? "",
    });
    setErro("");
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setForm(formVazio);
    setErro("");
  };

  const salvar = async () => {
    if (!form.dataInicio || !form.titulo.trim()) return;
    setSalvando(true);
    setErro("");
    try {
      const res = await fetch("/api/manual-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: editandoId ? "contexto_update" : "contexto_add",
          id: editandoId ?? undefined,
          dataInicio: form.dataInicio,
          dataFim: form.dataFim || undefined,
          nota: form.titulo,
          detalhes: form.detalhes || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        const novaLista = editandoId
          ? notas.map((n) => (n.id === editandoId ? json.nota : n))
          : [...notas, json.nota];
        setNotas(novaLista.sort((a, b) => a.event_date_start.localeCompare(b.event_date_start)));
        setForm(formVazio);
        setEditandoId(null);
      } else {
        setErro(json.error ?? "Não foi possível salvar.");
      }
    } finally {
      setSalvando(false);
    }
  };

  const remover = async (id: string) => {
    setNotas(notas.filter((n) => n.id !== id));
    if (editandoId === id) cancelarEdicao();
    await fetch("/api/manual-metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "contexto_remove", id }),
    });
  };

  const irAnterior = () => {
    if (modo === "mes") setDataFoco((d) => addMonthsKeepingFirst(d, -1));
    else if (modo === "semana") setDataFoco((d) => addDays(d, -7));
    else setDataFoco((d) => addDays(d, -1));
  };
  const irProximo = () => {
    if (modo === "mes") setDataFoco((d) => addMonthsKeepingFirst(d, 1));
    else if (modo === "semana") setDataFoco((d) => addDays(d, 7));
    else setDataFoco((d) => addDays(d, 1));
  };

  const [anoStr, mesStr] = dataFoco.split("-");
  const ano = Number(anoStr);
  const mes = Number(mesStr);

  let cells: CelulaGrid[] = [];
  let labelPeriodo = "";
  if (modo === "mes") {
    cells = buildMonthGrid(ano, mes).map((c) => ({ iso: toIso(c.ano, c.mes, c.dia), foraDoMes: c.foraDoMes }));
    labelPeriodo = `${MESES[mes - 1]} ${ano}`;
  } else if (modo === "semana") {
    const domingo = sundayOf(dataFoco);
    cells = Array.from({ length: 7 }, (_, i) => ({ iso: addDays(domingo, i) }));
    labelPeriodo = weekLabel(domingo, addDays(domingo, 6));
  }

  return (
    <div className="baz-fade-up" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <SectionTitle>Calendário</SectionTitle>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", border: `1px solid ${C.preto}`, borderRadius: 20, overflow: "hidden" }}>
            {(["dia", "semana", "mes"] as Modo[]).map((m) => (
              <button key={m} onClick={() => setModo(m)} className="baz-touch-target" style={modoBtnStyle(modo === m)}>
                {m === "dia" ? "Dia" : m === "semana" ? "Semana" : "Mês"}
              </button>
            ))}
          </div>
          <button onClick={() => setDataFoco(hojeIso())} className="baz-btn-secondary" style={btnSecondary}>
            Hoje
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={irAnterior}
              className="baz-icon-btn baz-touch-target"
              style={{ background: "transparent", border: "none", color: C.cinza, cursor: "pointer", fontSize: 16, width: 28, height: 28 }}
            >
              ‹
            </button>
            <button
              onClick={irProximo}
              className="baz-icon-btn baz-touch-target"
              style={{ background: "transparent", border: "none", color: C.cinza, cursor: "pointer", fontSize: 16, width: 28, height: 28 }}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <div style={{ background: C.branco, border: `1px solid ${C.linha}`, borderRadius: 4, padding: 20 }}>
        {labelPeriodo && (
          <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 14, color: C.preto, marginBottom: 14 }}>
            {labelPeriodo}
          </div>
        )}

        {modo === "dia" ? (
          <CalendarDayAgenda
            dataIso={dataFoco}
            notas={notas}
            onEdit={abrirEdicao}
            onRemove={remover}
            onAdd={() => abrirNovo(dataFoco)}
          />
        ) : (
          <CalendarGridView
            cells={cells}
            notas={notas}
            onDayClick={(iso) => abrirNovo(iso)}
            onEventClick={abrirEdicao}
            size={modo === "semana" ? "large" : "compact"}
          />
        )}
      </div>

      <div style={{ background: C.branco, border: `1px solid ${C.linha}`, borderRadius: 4, padding: 20 }}>
        <SectionTitle tight>{editandoId ? "Editando evento" : "Novo evento"}</SectionTitle>

        {erro && (
          <div
            style={{
              background: `${C.erro}14`,
              border: `1px solid ${C.erro}`,
              padding: "8px 10px",
              borderRadius: 4,
              fontSize: 11,
              color: C.preto,
              margin: "10px 0",
            }}
          >
            {erro}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", marginTop: 12 }}>
          <label style={labelStyle}>
            Data de início
            <input
              type="date"
              value={form.dataInicio}
              onChange={(e) => setForm({ ...form, dataInicio: e.target.value })}
              style={{ ...selectStyle, width: 160 }}
            />
          </label>
          <label style={labelStyle}>
            Data final (opcional)
            <input
              type="date"
              value={form.dataFim}
              min={form.dataInicio || undefined}
              onChange={(e) => setForm({ ...form, dataFim: e.target.value })}
              style={{ ...selectStyle, width: 160 }}
            />
          </label>
          <label style={{ ...labelStyle, flex: 1, minWidth: 220 }}>
            Título
            <input
              type="text"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ex: Dia do Cliente"
              style={selectStyle}
            />
          </label>
        </div>

        <label style={{ ...labelStyle, display: "block", marginTop: 10 }}>
          Detalhes (opcional)
          <textarea
            value={form.detalhes}
            onChange={(e) => setForm({ ...form, detalhes: e.target.value })}
            rows={2}
            placeholder="Ex: preço, link, quem é o responsável, o que precisa estar pronto antes."
            style={{ ...selectStyle, resize: "vertical", fontFamily: "'Montserrat', sans-serif" }}
          />
        </label>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            onClick={salvar}
            disabled={salvando || !form.dataInicio || !form.titulo.trim()}
            className="baz-btn-primary"
            style={{ ...btnPrimary, opacity: salvando || !form.dataInicio || !form.titulo.trim() ? 0.5 : 1 }}
          >
            {salvando ? "Salvando..." : editandoId ? "Salvar edição" : "Adicionar"}
          </button>
          {editandoId && (
            <button onClick={cancelarEdicao} className="baz-btn-secondary" style={btnSecondary}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div style={{ background: C.branco, border: `1px solid ${C.linha}`, borderRadius: 4, padding: 20 }}>
        <SectionTitle tight>Todos os eventos ({notas.length})</SectionTitle>
        {notas.length === 0 ? (
          <p style={{ ...labelStyle, marginTop: 10 }}>Nenhum evento cadastrado ainda.</p>
        ) : (
          <div style={{ marginTop: 10 }}>
            {notas.map((n) => (
              <div
                key={n.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "8px 0",
                  borderBottom: `1px solid ${C.linha}`,
                }}
              >
                <div style={{ display: "flex", gap: 10 }}>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.roxo,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {n.event_date_start === n.event_date_end
                      ? fmtDate(n.event_date_start)
                      : `${fmtDate(n.event_date_start)} – ${fmtDate(n.event_date_end)}`}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: C.preto }}>{n.note}</div>
                    {n.detalhes && (
                      <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 11, color: C.cinza, marginTop: 2 }}>
                        {n.detalhes}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                  <button
                    onClick={() => abrirEdicao(n)}
                    className="baz-btn-ghost-muted"
                    style={{ background: "transparent", border: "none", color: C.roxo, cursor: "pointer", fontSize: 12 }}
                  >
                    editar
                  </button>
                  <button
                    onClick={() => remover(n.id)}
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
    </div>
  );
}
