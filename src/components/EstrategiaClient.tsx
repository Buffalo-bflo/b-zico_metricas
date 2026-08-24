"use client";

import { useState } from "react";
import { SectionTitle } from "@/components/Brand";
import {
  C,
  selectStyle,
  btnPrimary,
  btnSecondary,
  LINHA_EDITORIAL_OPTS,
  MODO_CONTEUDO_OPTS,
  OBJETIVO_OPTS,
  OBJETIVO_ESTRATEGICO_OPTS,
  OBJETIVO_ESTRATEGICO_OPTS_AJUDA,
  ORIGEM_OPTS,
  ORIGEM_OPTS_AJUDA,
  STATUS_HIP_OPTS,
  TYPE,
} from "@/lib/designTokens";
import { fmtDate } from "@/lib/metrics";
import { YearCalendar } from "@/components/YearCalendar";

type Post = { id: string; post_type: string; description: string; post_date: string };
type Tag = {
  post_id: string;
  editorial_line: string | null;
  content_mode: string | null;
  engagement_objective: string | null;
  strategic_objective: string | null;
  origin: string | null;
  hypothesis: string | null;
  hypothesis_status: string | null;
  actual_result: string | null;
};
type Seguidores = { period_label: string; gained: number; lost: number } | null;
type Horario = { peak_window: string } | null;
type Nota = { id: string; event_date: string; note: string };
type Periodo = { start: string; end: string; label: string };

const formDraftVazio = {
  linhaEditorial: "",
  modoConteudo: "",
  objetivos: [] as string[],
  objetivoEstrategico: "",
  origem: "Agência",
  hipotese: "",
  statusHip: "",
  resultado: "",
};

export function EstrategiaClient({
  posts,
  tags: tagsIniciais,
  period,
  seguidoresInicial,
  horarioInicial,
  notasIniciais,
}: {
  posts: Post[];
  tags: Record<string, Tag>;
  period: Periodo;
  seguidoresInicial: Seguidores;
  horarioInicial: Horario;
  notasIniciais: Nota[];
}) {
  const [tags, setTags] = useState(tagsIniciais);
  const [selectedPostId, setSelectedPostId] = useState("");
  const [formDraft, setFormDraft] = useState(formDraftVazio);
  const [salvandoTag, setSalvandoTag] = useState(false);

  const [seguidores, setSeguidores] = useState({
    ganhos: String(seguidoresInicial?.gained ?? ""),
    perdidos: String(seguidoresInicial?.lost ?? ""),
  });
  const [seguidoresSalvo, setSeguidoresSalvo] = useState(false);

  const [melhorHorario, setMelhorHorario] = useState(horarioInicial?.peak_window ?? "");
  const [horarioSalvo, setHorarioSalvo] = useState(false);

  const [notas, setNotas] = useState(notasIniciais);
  const [novaData, setNovaData] = useState("");
  const [novaNota, setNovaNota] = useState("");
  const [salvandoNota, setSalvandoNota] = useState(false);

  const qtdMarcados = Object.keys(tags).length;

  const abrirFormPost = (postId: string) => {
    setSelectedPostId(postId);
    const t = tags[postId];
    setFormDraft(
      t
        ? {
            linhaEditorial: t.editorial_line ?? "",
            modoConteudo: t.content_mode ?? "",
            objetivos: t.engagement_objective ? t.engagement_objective.split(", ").filter(Boolean) : [],
            objetivoEstrategico: t.strategic_objective ?? "",
            origem: t.origin ?? "Agência",
            hipotese: t.hypothesis ?? "",
            statusHip: t.hypothesis_status ?? "",
            resultado: t.actual_result ?? "",
          }
        : formDraftVazio
    );
  };

  const alternarObjetivo = (o: string) => {
    setFormDraft((f) => ({
      ...f,
      objetivos: f.objetivos.includes(o) ? f.objetivos.filter((x) => x !== o) : [...f.objetivos, o],
    }));
  };

  const salvarTag = async () => {
    // Objetivo Estratégico é obrigatório: sem ele a IA não sabe por qual critério julgar
    // o post, e acabaria usando régua única pra tudo.
    if (!selectedPostId || !formDraft.objetivoEstrategico) return;
    setSalvandoTag(true);
    try {
      const objetivoJunto = formDraft.objetivos.join(", ");
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: selectedPostId,
          editorialLine: formDraft.linhaEditorial,
          contentMode: formDraft.modoConteudo,
          engagementObjective: objetivoJunto,
          strategicObjective: formDraft.objetivoEstrategico,
          origin: formDraft.origem,
          hypothesis: formDraft.hipotese,
          hypothesisStatus: formDraft.statusHip,
          actualResult: formDraft.resultado,
        }),
      });
      if (res.ok) {
        setTags({
          ...tags,
          [selectedPostId]: {
            post_id: selectedPostId,
            editorial_line: formDraft.linhaEditorial,
            content_mode: formDraft.modoConteudo,
            engagement_objective: objetivoJunto,
            strategic_objective: formDraft.objetivoEstrategico,
            origin: formDraft.origem,
            hypothesis: formDraft.hipotese,
            hypothesis_status: formDraft.statusHip,
            actual_result: formDraft.resultado,
          },
        });
        setSelectedPostId("");
      }
    } finally {
      setSalvandoTag(false);
    }
  };

  const salvarSeguidores = async () => {
    await fetch("/api/manual-metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "seguidores",
        periodStart: period.start,
        periodEnd: period.end,
        periodLabel: period.label,
        ...seguidores,
      }),
    });
    setSeguidoresSalvo(true);
    setTimeout(() => setSeguidoresSalvo(false), 2000);
  };

  const salvarHorario = async () => {
    await fetch("/api/manual-metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "horario", periodStart: period.start, periodEnd: period.end, melhorHorario }),
    });
    setHorarioSalvo(true);
    setTimeout(() => setHorarioSalvo(false), 2000);
  };

  const adicionarNota = async () => {
    if (!novaData || !novaNota.trim()) return;
    setSalvandoNota(true);
    try {
      const res = await fetch("/api/manual-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "contexto_add", data: novaData, nota: novaNota }),
      });
      const json = await res.json();
      if (res.ok) {
        setNotas([...notas, json.nota].sort((a, b) => a.event_date.localeCompare(b.event_date)));
        setNovaData("");
        setNovaNota("");
      }
    } finally {
      setSalvandoNota(false);
    }
  };

  const removerNota = async (id: string) => {
    setNotas(notas.filter((n) => n.id !== id));
    await fetch("/api/manual-metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "contexto_remove", id }),
    });
  };

  const ganhos = Number(seguidores.ganhos) || 0;
  const perdidos = Number(seguidores.perdidos) || 0;
  const saldo = ganhos - perdidos;
  const taxaPerda = ganhos > 0 ? (perdidos / ganhos) * 100 : 0;

  const labelStyle = { fontFamily: "'Montserrat', sans-serif", fontSize: 11, color: C.cinza };

  return (
    <div className="baz-fade-in" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div style={{ background: C.branco, border: `1px solid ${C.linha}`, borderRadius: 4, padding: 20 }}>
        <SectionTitle>
          Marcar conteúdo — {qtdMarcados} de {posts.length} posts
        </SectionTitle>
        <div className="baz-row-2col-even">
          <div>
            <div style={{ ...labelStyle, marginBottom: 8 }}>
              Escolha um post pra marcar Linha Editorial, Modo de Conteúdo, Origem e sua hipótese:
            </div>
            <div style={{ maxHeight: 320, overflowY: "auto", border: `1px solid ${C.linha}`, borderRadius: 3 }}>
              {posts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => abrirFormPost(p.id)}
                  aria-pressed={selectedPostId === p.id}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    font: "inherit",
                    padding: "8px 12px",
                    border: "none",
                    borderBottom: `1px solid ${C.linha}`,
                    cursor: "pointer",
                    background: selectedPostId === p.id ? C.roxoTint : "transparent",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: C.preto }}>
                    {fmtDate(p.post_date)} · {p.post_type} · {p.description?.split("\n")[0].slice(0, 40)}
                  </div>
                  {tags[p.id] && (
                    <span style={{ color: C.roxo, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                      ✓
                    </span>
                  )}
                </button>
              ))}
              {posts.length === 0 && (
                <div style={{ ...labelStyle, padding: 12 }}>Nenhum post neste período.</div>
              )}
            </div>
          </div>

          <div>
            {!selectedPostId && (
              <div style={{ ...labelStyle, padding: 20, textAlign: "center" }}>
                Selecione um post à esquerda pra marcar.
              </div>
            )}
            {selectedPostId && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={labelStyle}>
                  Linha Editorial
                  <select
                    value={formDraft.linhaEditorial}
                    onChange={(e) => setFormDraft({ ...formDraft, linhaEditorial: e.target.value })}
                    style={selectStyle}
                  >
                    <option value="">— selecione —</option>
                    {LINHA_EDITORIAL_OPTS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={labelStyle}>
                  Modo de Conteúdo
                  <select
                    value={formDraft.modoConteudo}
                    onChange={(e) => setFormDraft({ ...formDraft, modoConteudo: e.target.value })}
                    style={selectStyle}
                  >
                    <option value="">— selecione —</option>
                    {MODO_CONTEUDO_OPTS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </label>
                <div style={labelStyle}>
                  Objetivo de Engajamento (pode marcar mais de um)
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 6 }}>
                    {OBJETIVO_OPTS.map((o) => (
                      <label
                        key={o}
                        style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.preto, cursor: "pointer" }}
                      >
                        <input
                          type="checkbox"
                          checked={formDraft.objetivos.includes(o)}
                          onChange={() => alternarObjetivo(o)}
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                </div>
                <label style={labelStyle}>
                  Objetivo Estratégico <span style={{ color: C.erro }}>*</span>
                  <span style={{ display: "block", fontSize: 10, color: C.cinza, marginTop: 2 }}>
                    Para QUEM o post é direcionado no funil — diferente do Objetivo de Engajamento acima, que é a
                    ação buscada. Define por qual critério a IA vai julgar esse post.
                  </span>
                  <select
                    value={formDraft.objetivoEstrategico}
                    onChange={(e) => setFormDraft({ ...formDraft, objetivoEstrategico: e.target.value })}
                    style={{
                      ...selectStyle,
                      borderColor: formDraft.objetivoEstrategico ? C.linha : C.erro,
                    }}
                  >
                    <option value="">— selecione —</option>
                    {OBJETIVO_ESTRATEGICO_OPTS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                  {formDraft.objetivoEstrategico && (
                    <span style={{ display: "block", fontSize: 10, color: C.roxo, marginTop: 4, lineHeight: 1.5 }}>
                      {OBJETIVO_ESTRATEGICO_OPTS_AJUDA[formDraft.objetivoEstrategico]}
                    </span>
                  )}
                </label>
                <label style={labelStyle}>
                  Origem
                  <select
                    value={formDraft.origem}
                    onChange={(e) => setFormDraft({ ...formDraft, origem: e.target.value })}
                    style={selectStyle}
                  >
                    {ORIGEM_OPTS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                  {formDraft.origem && (
                    <span style={{ display: "block", fontSize: 10, color: C.cinza, marginTop: 4, lineHeight: 1.5 }}>
                      {ORIGEM_OPTS_AJUDA[formDraft.origem]}
                    </span>
                  )}
                </label>
                <label style={labelStyle}>
                  Hipótese (por que performou assim)
                  <textarea
                    value={formDraft.hipotese}
                    onChange={(e) => setFormDraft({ ...formDraft, hipotese: e.target.value })}
                    rows={2}
                    style={{ ...selectStyle, resize: "vertical", fontFamily: "'Montserrat', sans-serif" }}
                    placeholder="Ex: dilema real gera comentário porque força posicionamento"
                  />
                </label>
                <label style={labelStyle}>
                  Resultado real (só se foi diferente do objetivo marcado acima)
                  <textarea
                    value={formDraft.resultado}
                    onChange={(e) => setFormDraft({ ...formDraft, resultado: e.target.value })}
                    rows={2}
                    style={{ ...selectStyle, resize: "vertical", fontFamily: "'Montserrat', sans-serif" }}
                    placeholder="Ex: queria curtidas, o que veio mesmo foi compartilhamento"
                  />
                </label>
                <label style={labelStyle}>
                  Status da Hipótese
                  <span style={{ display: "block", fontSize: 10, color: C.cinza, marginTop: 2 }}>
                    Só preencha se este post for um teste deliberado — um gancho, formato ou ângulo novo que você
                    quer avaliar. Conteúdo de rotina ou Padrão fixo pode ficar sem status.
                  </span>
                  <select
                    value={formDraft.statusHip}
                    onChange={(e) => setFormDraft({ ...formDraft, statusHip: e.target.value })}
                    style={selectStyle}
                  >
                    <option value="">— nenhum (conteúdo de rotina) —</option>
                    {STATUS_HIP_OPTS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                  <span style={{ display: "block", fontSize: 10, color: C.cinza, marginTop: 4, lineHeight: 1.5 }}>
                    Confirmada = a hipótese bateu com o resultado. Refutada = resultado foi diferente do esperado.
                    Padrão fixo = não é teste novo, é formato repetido de propósito — não comparar como hipótese
                    isolada.
                  </span>
                </label>
                {!formDraft.objetivoEstrategico && (
                  <div style={{ fontSize: 11, color: C.erro }}>
                    Escolha o Objetivo Estratégico para poder salvar.
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button
                    onClick={salvarTag}
                    disabled={salvandoTag || !formDraft.objetivoEstrategico}
                    className="baz-btn-primary"
                    style={{ ...btnPrimary, opacity: salvandoTag || !formDraft.objetivoEstrategico ? 0.5 : 1 }}
                  >
                    {salvandoTag ? "Salvando..." : "Salvar marcação"}
                  </button>
                  <button onClick={() => setSelectedPostId("")} className="baz-btn-secondary" style={btnSecondary}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <details className="baz-accordion">
        <summary className="baz-accordion-summary">
          <SectionTitle tight>Seguidores ganhos e perdidos — resumo do app</SectionTitle>
        </summary>
        <div className="baz-accordion-body">
        <div style={{ ...labelStyle, marginBottom: 12 }}>
          Vem do Meta Business Suite (desktop) → Público → Tendências, filtrando pelo mesmo período mostrado
          abaixo. O período é sempre o que está selecionado no topo da tela (Mês ou Semana) — muda de lá, não aqui.
        </div>
        <div className="baz-row-3col-even" style={{ marginBottom: 12 }}>
          <div>
            <div style={labelStyle}>Período</div>
            <div
              style={{
                ...selectStyle,
                background: C.roxoTint,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
              }}
            >
              {period.label}
            </div>
          </div>
          <label style={labelStyle}>
            Seguidores ganhos (app)
            <input
              type="number"
              value={seguidores.ganhos}
              onChange={(e) => setSeguidores({ ...seguidores, ganhos: e.target.value })}
              style={selectStyle}
            />
          </label>
          <label style={labelStyle}>
            Seguidores perdidos (app)
            <input
              type="number"
              value={seguidores.perdidos}
              onChange={(e) => setSeguidores({ ...seguidores, perdidos: e.target.value })}
              style={selectStyle}
            />
          </label>
        </div>
        <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 10, color: C.cinza, textTransform: "uppercase" }}>
              Saldo líquido
            </div>
            <div style={{ ...TYPE.stat, color: C.roxo }}>
              {saldo > 0 ? "+" : ""}
              {saldo}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 10, color: C.cinza, textTransform: "uppercase" }}>
              Taxa de perda
            </div>
            <div
              style={{
                ...TYPE.stat,
                color: taxaPerda > 60 ? C.erro : C.preto,
              }}
            >
              {taxaPerda.toFixed(0)}%
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={salvarSeguidores} className="baz-btn-secondary" style={btnSecondary}>
            Salvar
          </button>
          {seguidoresSalvo && (
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 11, color: C.roxo }}>Salvo ✓</span>
          )}
        </div>
        </div>
      </details>

      <details className="baz-accordion">
        <summary className="baz-accordion-summary">
          <SectionTitle tight>Melhor horário para postar</SectionTitle>
        </summary>
        <div className="baz-accordion-body">
        <div style={{ ...labelStyle, marginBottom: 8 }}>
          Vem da tela &quot;Horários de atividade dos seguidores&quot;, dentro de Insights → Público, no app —
          referente ao período {period.label}.
        </div>
        <input
          type="text"
          value={melhorHorario}
          onChange={(e) => setMelhorHorario(e.target.value)}
          placeholder="Ex: Segunda, Terça e Quarta: 18h às 21h"
          style={{ ...selectStyle, fontFamily: "'Montserrat', sans-serif" }}
        />
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={salvarHorario} className="baz-btn-secondary" style={btnSecondary}>
            Salvar
          </button>
          {horarioSalvo && (
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 11, color: C.roxo }}>Salvo ✓</span>
          )}
        </div>
        </div>
      </details>

      <details className="baz-accordion">
        <summary className="baz-accordion-summary">
          <SectionTitle tight>Contexto e datas importantes</SectionTitle>
        </summary>
        <div className="baz-accordion-body">
        <div style={{ ...labelStyle, marginBottom: 12 }}>
          Cadastre quantas datas futuras quiser, de qualquer mês — nada aqui se apaga quando você adiciona uma
          nova. Cada nota aparece pra IA a partir da semana em que foi cadastrada. Clica num dia do calendário
          pra já preencher a data de uma nota nova.
        </div>

        <div style={{ marginBottom: 20 }}>
          <YearCalendar notas={notas} onDayClick={(iso) => setNovaData(iso)} />
        </div>

        {notas.length > 0 && (
          <div style={{ marginBottom: 16 }}>
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
                    {fmtDate(n.event_date)}
                  </div>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: C.preto }}>{n.note}</div>
                </div>
                <button
                  onClick={() => removerNota(n.id)}
                  className="baz-btn-ghost-muted"
                  style={{ background: "transparent", border: "none", color: C.cinza, cursor: "pointer", fontSize: 12 }}
                >
                  remover
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <label style={labelStyle}>
            Data
            <input
              type="date"
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
              style={{ ...selectStyle, width: 160 }}
            />
          </label>
          <label style={{ ...labelStyle, flex: 1, minWidth: 220 }}>
            Nota
            <input
              type="text"
              value={novaNota}
              onChange={(e) => setNovaNota(e.target.value)}
              placeholder="Ex: Dia do Cliente, começar a preparar."
              style={selectStyle}
            />
          </label>
          <button
            onClick={adicionarNota}
            disabled={salvandoNota || !novaData || !novaNota.trim()}
            className="baz-btn-primary"
            style={{ ...btnPrimary, opacity: salvandoNota || !novaData || !novaNota.trim() ? 0.5 : 1 }}
          >
            Adicionar
          </button>
        </div>
        </div>
      </details>
    </div>
  );
}
