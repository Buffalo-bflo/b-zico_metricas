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
  ORIGEM_OPTS,
  STATUS_HIP_OPTS,
} from "@/lib/designTokens";
import { fmtDate } from "@/lib/metrics";

type Post = { id: string; post_type: string; description: string; post_date: string };
type Tag = {
  post_id: string;
  editorial_line: string | null;
  content_mode: string | null;
  engagement_objective: string | null;
  origin: string | null;
  hypothesis: string | null;
  hypothesis_status: string | null;
};
type Seguidores = { period_label: string; gained: number; lost: number } | null;
type Horario = { peak_window: string } | null;

const formDraftVazio = {
  linhaEditorial: "",
  modoConteudo: "",
  objetivo: "",
  origem: "Interno",
  hipotese: "",
  statusHip: "Observar",
};

export function EstrategiaClient({
  posts,
  tags: tagsIniciais,
  mesAtivo,
  seguidoresInicial,
  horarioInicial,
  contextoInicial,
}: {
  posts: Post[];
  tags: Record<string, Tag>;
  mesAtivo: string;
  seguidoresInicial: Seguidores;
  horarioInicial: Horario;
  contextoInicial: string;
}) {
  const [tags, setTags] = useState(tagsIniciais);
  const [selectedPostId, setSelectedPostId] = useState("");
  const [formDraft, setFormDraft] = useState(formDraftVazio);
  const [salvandoTag, setSalvandoTag] = useState(false);

  const [seguidores, setSeguidores] = useState({
    periodo: seguidoresInicial?.period_label ?? "",
    ganhos: String(seguidoresInicial?.gained ?? ""),
    perdidos: String(seguidoresInicial?.lost ?? ""),
  });
  const [seguidoresSalvo, setSeguidoresSalvo] = useState(false);

  const [melhorHorario, setMelhorHorario] = useState(horarioInicial?.peak_window ?? "");
  const [horarioSalvo, setHorarioSalvo] = useState(false);

  const [contexto, setContexto] = useState(contextoInicial);
  const [contextoSalvo, setContextoSalvo] = useState(false);

  const qtdMarcados = Object.keys(tags).length;

  const abrirFormPost = (postId: string) => {
    setSelectedPostId(postId);
    const t = tags[postId];
    setFormDraft(
      t
        ? {
            linhaEditorial: t.editorial_line ?? "",
            modoConteudo: t.content_mode ?? "",
            objetivo: t.engagement_objective ?? "",
            origem: t.origin ?? "Interno",
            hipotese: t.hypothesis ?? "",
            statusHip: t.hypothesis_status ?? "Observar",
          }
        : formDraftVazio
    );
  };

  const salvarTag = async () => {
    if (!selectedPostId) return;
    setSalvandoTag(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: selectedPostId,
          editorialLine: formDraft.linhaEditorial,
          contentMode: formDraft.modoConteudo,
          engagementObjective: formDraft.objetivo,
          origin: formDraft.origem,
          hypothesis: formDraft.hipotese,
          hypothesisStatus: formDraft.statusHip,
        }),
      });
      if (res.ok) {
        setTags({
          ...tags,
          [selectedPostId]: {
            post_id: selectedPostId,
            editorial_line: formDraft.linhaEditorial,
            content_mode: formDraft.modoConteudo,
            engagement_objective: formDraft.objetivo,
            origin: formDraft.origem,
            hypothesis: formDraft.hipotese,
            hypothesis_status: formDraft.statusHip,
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
      body: JSON.stringify({ kind: "seguidores", mesAtivo, ...seguidores }),
    });
    setSeguidoresSalvo(true);
    setTimeout(() => setSeguidoresSalvo(false), 2000);
  };

  const salvarHorario = async () => {
    await fetch("/api/manual-metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "horario", mesAtivo, melhorHorario }),
    });
    setHorarioSalvo(true);
    setTimeout(() => setHorarioSalvo(false), 2000);
  };

  const salvarContexto = async () => {
    await fetch("/api/manual-metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "contexto", contexto }),
    });
    setContextoSalvo(true);
    setTimeout(() => setContextoSalvo(false), 2000);
  };

  const ganhos = Number(seguidores.ganhos) || 0;
  const perdidos = Number(seguidores.perdidos) || 0;
  const saldo = ganhos - perdidos;
  const taxaPerda = ganhos > 0 ? (perdidos / ganhos) * 100 : 0;

  const labelStyle = { fontFamily: "'Montserrat', sans-serif", fontSize: 11, color: C.cinza };

  return (
    <div className="baz-fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
                <div
                  key={p.id}
                  onClick={() => abrirFormPost(p.id)}
                  style={{
                    padding: "8px 12px",
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
                </div>
              ))}
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
                <label style={labelStyle}>
                  Objetivo de Engajamento
                  <select
                    value={formDraft.objetivo}
                    onChange={(e) => setFormDraft({ ...formDraft, objetivo: e.target.value })}
                    style={selectStyle}
                  >
                    <option value="">— selecione —</option>
                    {OBJETIVO_OPTS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
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
                  Status da Hipótese
                  <select
                    value={formDraft.statusHip}
                    onChange={(e) => setFormDraft({ ...formDraft, statusHip: e.target.value })}
                    style={selectStyle}
                  >
                    {STATUS_HIP_OPTS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </label>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button onClick={salvarTag} disabled={salvandoTag} className="baz-btn-primary" style={btnPrimary}>
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

      <div style={{ background: C.branco, border: `1px solid ${C.linha}`, borderRadius: 4, padding: 20 }}>
        <SectionTitle>Seguidores ganhos e perdidos — resumo do app</SectionTitle>
        <div style={{ ...labelStyle, marginBottom: 12 }}>
          Vem do Meta Business Suite (desktop) → Público → Tendências, filtrando pelo período exato do mês.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <label style={labelStyle}>
            Período informado
            <input
              type="text"
              value={seguidores.periodo}
              onChange={(e) => setSeguidores({ ...seguidores, periodo: e.target.value })}
              style={selectStyle}
            />
          </label>
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
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: C.roxo }}>
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
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 20,
                fontWeight: 700,
                color: taxaPerda > 60 ? "#B33" : C.preto,
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

      <div style={{ background: C.branco, border: `1px solid ${C.linha}`, borderRadius: 4, padding: 20 }}>
        <SectionTitle>Melhor horário para postar</SectionTitle>
        <div style={{ ...labelStyle, marginBottom: 8 }}>
          Vem da tela &quot;Horários de atividade dos seguidores&quot;, dentro de Insights → Público, no app.
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

      <div style={{ background: C.branco, border: `1px solid ${C.linha}`, borderRadius: 4, padding: 20 }}>
        <SectionTitle>Contexto e datas importantes — próxima semana</SectionTitle>
        <textarea
          value={contexto}
          onChange={(e) => setContexto(e.target.value)}
          rows={3}
          placeholder="Ex: 20/09 é Dia do Cliente, começar a preparar. Patches de customização já disponíveis em estoque."
          style={{
            width: "100%",
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 12,
            padding: 10,
            border: `1px solid ${C.linha}`,
            borderRadius: 3,
            resize: "vertical",
          }}
        />
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={salvarContexto} className="baz-btn-secondary" style={btnSecondary}>
            Salvar contexto
          </button>
          {contextoSalvo && (
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 11, color: C.roxo }}>Salvo ✓</span>
          )}
        </div>
      </div>
    </div>
  );
}
