"use client";

import { useState } from "react";
import { SectionTitle } from "@/components/Brand";
import { C, selectStyle, btnPrimary, btnSecondary } from "@/lib/designTokens";
import { fmtDate } from "@/lib/metrics";

export type Teste = {
  id: string;
  nome_teste: string;
  hipotese: string;
  variavel_testada: string;
  posts_grupo_a: string[];
  posts_grupo_b: string[];
  criterio_sucesso: string;
  data_inicio: string;
  data_fim: string | null;
  status: "Planejado" | "Em andamento" | "Concluído";
  resultado: "Confirmado" | "Refutado" | "Inconclusivo" | null;
  leitura_final: string | null;
};

export type PostOpcao = { id: string; post_type: string; post_date: string; description: string };

const STATUS_OPTS = ["Planejado", "Em andamento", "Concluído"] as const;
const RESULTADO_OPTS = ["Confirmado", "Refutado", "Inconclusivo"] as const;
const VARIAVEIS_SUGERIDAS = ["Gancho", "Formato", "Horário", "CTA", "Tema", "Duração", "Legenda"];

const hoje = () => new Date().toISOString().slice(0, 10);

const corResultado = (r: string | null) =>
  r === "Confirmado" ? C.roxo : r === "Refutado" ? C.erro : C.cinza;

const formVazio = {
  nomeTeste: "",
  hipotese: "",
  variavelTestada: "",
  criterioSucesso: "",
  dataInicio: hoje(),
  dataFim: "",
  postsGrupoA: [] as string[],
  postsGrupoB: [] as string[],
};

function SeletorPosts({
  posts,
  selecionados,
  onToggle,
  cor,
}: {
  posts: PostOpcao[];
  selecionados: string[];
  onToggle: (id: string) => void;
  cor: string;
}) {
  return (
    <div style={{ maxHeight: 150, overflowY: "auto", border: `1px solid ${C.linha}`, borderRadius: 3, marginTop: 4 }}>
      {posts.length === 0 && (
        <div style={{ padding: 10, fontSize: 11, color: C.cinza }}>Nenhum post disponível.</div>
      )}
      {posts.map((p) => {
        const ativo = selecionados.includes(p.id);
        return (
          <label
            key={p.id}
            style={{
              padding: "6px 10px",
              borderBottom: `1px solid ${C.linha}`,
              cursor: "pointer",
              background: ativo ? `${cor}22` : "transparent",
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 11,
              color: C.preto,
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <input type="checkbox" checked={ativo} onChange={() => onToggle(p.id)} />
            <span>
              {fmtDate(p.post_date)} · {p.post_type} · {(p.description ?? "").split("\n")[0].slice(0, 38)}
            </span>
          </label>
        );
      })}
    </div>
  );
}

export function TestesClient({ testesIniciais, posts }: { testesIniciais: Teste[]; posts: PostOpcao[] }) {
  const [testes, setTestes] = useState(testesIniciais);
  const [criando, setCriando] = useState(false);
  const [form, setForm] = useState(formVazio);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Teste>>({});

  const emAndamento = testes.filter((t) => t.status !== "Concluído");
  const concluidos = testes.filter((t) => t.status === "Concluído");

  const criar = async () => {
    setSalvando(true);
    setErro("");
    try {
      const res = await fetch("/api/testes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) setErro(json.error ?? "Não foi possível criar o teste.");
      else {
        setTestes([json.teste, ...testes]);
        setForm(formVazio);
        setCriando(false);
      }
    } finally {
      setSalvando(false);
    }
  };

  const salvarEdicao = async (id: string) => {
    setSalvando(true);
    setErro("");
    try {
      const res = await fetch("/api/testes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: draft.status,
          resultado: draft.resultado ?? null,
          leituraFinal: draft.leitura_final ?? "",
          dataFim: draft.data_fim ?? "",
        }),
      });
      const json = await res.json();
      if (!res.ok) setErro(json.error ?? "Não foi possível salvar.");
      else {
        setTestes(testes.map((t) => (t.id === id ? json.teste : t)));
        setEditandoId(null);
        setDraft({});
      }
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (id: string) => {
    setTestes(testes.filter((t) => t.id !== id));
    await fetch("/api/testes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  };

  const labelStyle = { fontFamily: "'Montserrat', sans-serif", fontSize: 11, color: C.cinza };
  const cardStyle = {
    background: C.branco,
    border: `1px solid ${C.linha}`,
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
  };

  const podeCriar =
    form.nomeTeste.trim() && form.hipotese.trim() && form.variavelTestada.trim() && form.criterioSucesso.trim() && form.dataInicio;

  function CardTeste({ t }: { t: Teste }) {
    const travado = t.data_inicio <= hoje();
    const editando = editandoId === t.id;
    const postsDe = (ids: string[]) =>
      ids.map((id) => posts.find((p) => p.id === id)).filter(Boolean) as PostOpcao[];

    return (
      <details className="baz-accordion" style={{ marginBottom: 12 }}>
        <summary className="baz-accordion-summary">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", flex: 1 }}>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 14, fontWeight: 700, color: C.preto }}>
              {t.nome_teste}
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: 20,
                  border: `1px solid ${t.status === "Concluído" ? C.cinza : C.roxo}`,
                  color: t.status === "Concluído" ? C.cinza : C.roxo,
                }}
              >
                {t.status}
              </span>
              {t.resultado && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 20,
                    background: corResultado(t.resultado),
                    color: C.branco,
                  }}
                >
                  {t.resultado}
                </span>
              )}
            </div>
          </div>
        </summary>
        <div className="baz-accordion-body">

        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.cinza, margin: "4px 0 10px" }}>
          {fmtDate(t.data_inicio)}
          {t.data_fim ? ` – ${fmtDate(t.data_fim)}` : " – em aberto"} · variável: {t.variavel_testada}
        </div>

        <div style={{ fontSize: 12, color: C.preto, marginBottom: 8 }}>
          <b>Hipótese:</b> {t.hipotese}
        </div>

        <div
          style={{
            fontSize: 12,
            color: C.preto,
            background: C.roxoTint,
            borderRadius: 4,
            padding: "8px 10px",
            marginBottom: 10,
          }}
        >
          <b>Critério de sucesso{travado ? " (travado)" : ""}:</b> {t.criterio_sucesso}
          {travado && (
            <div style={{ fontSize: 10, color: C.cinza, marginTop: 4 }}>
              Não pode mais ser alterado — o teste já começou. É o que impede reescrever o critério depois de ver
              o resultado.
            </div>
          )}
        </div>

        <div className="baz-row-2col-even" style={{ marginBottom: 10 }}>
          {(["A", "B"] as const).map((g) => {
            const lista = postsDe(g === "A" ? t.posts_grupo_a : t.posts_grupo_b);
            return (
              <div key={g}>
                <div style={{ ...labelStyle, fontWeight: 700 }}>Grupo {g} ({lista.length})</div>
                {lista.length === 0 ? (
                  <div style={{ fontSize: 11, color: C.cinza }}>Nenhum post.</div>
                ) : (
                  lista.map((p) => (
                    <div key={p.id} style={{ fontSize: 11, color: C.preto }}>
                      {fmtDate(p.post_date)} · {p.post_type} · {(p.description ?? "").split("\n")[0].slice(0, 34)}
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>

        {t.leitura_final && (
          <div style={{ fontSize: 12, color: C.preto, marginBottom: 8 }}>
            <b>Leitura final:</b> {t.leitura_final}
          </div>
        )}

        {editando ? (
          <div style={{ display: "grid", gap: 8, borderTop: `1px solid ${C.linha}`, paddingTop: 10 }}>
            <div className="baz-row-2col-even">
              <label style={labelStyle}>
                Status
                <select
                  value={draft.status ?? t.status}
                  onChange={(e) => setDraft({ ...draft, status: e.target.value as Teste["status"] })}
                  style={selectStyle}
                >
                  {STATUS_OPTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label style={labelStyle}>
                Data de fim
                <input
                  type="date"
                  value={draft.data_fim ?? t.data_fim ?? ""}
                  onChange={(e) => setDraft({ ...draft, data_fim: e.target.value })}
                  style={selectStyle}
                />
              </label>
            </div>
            <label style={labelStyle}>
              Resultado {(draft.status ?? t.status) !== "Concluído" && "(só quando Concluído)"}
              <select
                value={draft.resultado ?? t.resultado ?? ""}
                onChange={(e) => setDraft({ ...draft, resultado: (e.target.value || null) as Teste["resultado"] })}
                disabled={(draft.status ?? t.status) !== "Concluído"}
                style={{ ...selectStyle, opacity: (draft.status ?? t.status) !== "Concluído" ? 0.5 : 1 }}
              >
                <option value="">— selecione —</option>
                {RESULTADO_OPTS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>
            <label style={labelStyle}>
              Leitura final (o que aprendemos)
              <textarea
                value={draft.leitura_final ?? t.leitura_final ?? ""}
                onChange={(e) => setDraft({ ...draft, leitura_final: e.target.value })}
                rows={2}
                style={{ ...selectStyle, resize: "vertical", fontFamily: "'Montserrat', sans-serif" }}
              />
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => salvarEdicao(t.id)} disabled={salvando} className="baz-btn-primary" style={btnPrimary}>
                {salvando ? "Salvando..." : "Salvar"}
              </button>
              <button onClick={() => { setEditandoId(null); setDraft({}); setErro(""); }} className="baz-btn-secondary" style={btnSecondary}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              onClick={() => { setEditandoId(t.id); setDraft({}); setErro(""); }}
              style={{ background: "transparent", border: "none", color: C.roxo, cursor: "pointer", fontSize: 11, padding: 0 }}
            >
              Atualizar status / resultado
            </button>
            <button
              onClick={() => excluir(t.id)}
              style={{ background: "transparent", border: "none", color: C.cinza, cursor: "pointer", fontSize: 11, padding: 0 }}
            >
              Excluir
            </button>
          </div>
        )}
        </div>
      </details>
    );
  }

  return (
    <div className="baz-fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <SectionTitle>Calendário de testes</SectionTitle>
        <button onClick={() => setCriando((v) => !v)} className="baz-btn-primary" style={btnPrimary}>
          {criando ? "Cancelar" : "+ Novo teste"}
        </button>
      </div>

      <p style={{ ...labelStyle, marginTop: -8, marginBottom: 18, maxWidth: 720, lineHeight: 1.6 }}>
        Um teste compara dois grupos de posts variando <b>uma</b> coisa por vez. O critério de sucesso é definido
        antes de começar e trava na data de início — é isso que separa um teste de verdade de uma justificativa
        montada depois de ver o resultado.
      </p>

      {erro && (
        <div style={{ background: `${C.erro}14`, border: `1px solid ${C.erro}`, padding: "10px 12px", borderRadius: 4, fontSize: 12, color: C.preto, marginBottom: 14 }}>
          {erro}
        </div>
      )}

      {criando && (
        <div style={{ ...cardStyle, background: C.roxoTint, border: `1px solid ${C.roxo}33` }}>
          <div style={{ display: "grid", gap: 10 }}>
            <label style={labelStyle}>
              Nome do teste
              <input
                type="text"
                value={form.nomeTeste}
                onChange={(e) => setForm({ ...form, nomeTeste: e.target.value })}
                placeholder="Ex: Gancho de pergunta vs. gancho de afirmação"
                style={selectStyle}
              />
            </label>
            <label style={labelStyle}>
              Hipótese
              <textarea
                value={form.hipotese}
                onChange={(e) => setForm({ ...form, hipotese: e.target.value })}
                rows={2}
                placeholder="Ex: abrir com pergunta direta gera mais comentário do que abrir com afirmação"
                style={{ ...selectStyle, resize: "vertical", fontFamily: "'Montserrat', sans-serif" }}
              />
            </label>
            <label style={labelStyle}>
              Variável testada (só uma)
              <input
                type="text"
                list="variaveis-sugeridas"
                value={form.variavelTestada}
                onChange={(e) => setForm({ ...form, variavelTestada: e.target.value })}
                placeholder="Ex: gancho, formato, horário, CTA"
                style={selectStyle}
              />
              <datalist id="variaveis-sugeridas">
                {VARIAVEIS_SUGERIDAS.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            </label>
            <label style={labelStyle}>
              Critério de sucesso — <b style={{ color: C.erro }}>trava quando o teste começar</b>
              <textarea
                value={form.criterioSucesso}
                onChange={(e) => setForm({ ...form, criterioSucesso: e.target.value })}
                rows={2}
                placeholder="Ex: grupo A com pelo menos 30% mais comentários que o grupo B"
                style={{ ...selectStyle, resize: "vertical", fontFamily: "'Montserrat', sans-serif" }}
              />
            </label>
            <div className="baz-row-2col-even">
              <label style={labelStyle}>
                Data de início
                <input
                  type="date"
                  value={form.dataInicio}
                  onChange={(e) => setForm({ ...form, dataInicio: e.target.value })}
                  style={selectStyle}
                />
              </label>
              <label style={labelStyle}>
                Data de fim (opcional)
                <input
                  type="date"
                  value={form.dataFim}
                  onChange={(e) => setForm({ ...form, dataFim: e.target.value })}
                  style={selectStyle}
                />
              </label>
            </div>
            <div className="baz-row-2col-even">
              <div style={labelStyle}>
                Posts do grupo A
                <SeletorPosts
                  posts={posts}
                  selecionados={form.postsGrupoA}
                  cor={C.roxo}
                  onToggle={(id) =>
                    setForm((f) => ({
                      ...f,
                      postsGrupoA: f.postsGrupoA.includes(id)
                        ? f.postsGrupoA.filter((x) => x !== id)
                        : [...f.postsGrupoA, id],
                    }))
                  }
                />
              </div>
              <div style={labelStyle}>
                Posts do grupo B
                <SeletorPosts
                  posts={posts}
                  selecionados={form.postsGrupoB}
                  cor={C.creme}
                  onToggle={(id) =>
                    setForm((f) => ({
                      ...f,
                      postsGrupoB: f.postsGrupoB.includes(id)
                        ? f.postsGrupoB.filter((x) => x !== id)
                        : [...f.postsGrupoB, id],
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <button
                onClick={criar}
                disabled={!podeCriar || salvando}
                className="baz-btn-primary"
                style={{ ...btnPrimary, opacity: !podeCriar || salvando ? 0.5 : 1 }}
              >
                {salvando ? "Criando..." : "Criar teste"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.preto, marginBottom: 10 }}>
          Em andamento e planejados ({emAndamento.length})
        </div>
        {emAndamento.length === 0 ? (
          <p style={{ ...labelStyle, marginBottom: 20 }}>Nenhum teste ativo. Crie um com o botão acima.</p>
        ) : (
          emAndamento.map((t) => <CardTeste key={t.id} t={t} />)
        )}
      </div>

      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.preto, marginBottom: 10 }}>
          Histórico de concluídos ({concluidos.length})
        </div>
        {concluidos.length === 0 ? (
          <p style={labelStyle}>Nenhum teste concluído ainda.</p>
        ) : (
          concluidos.map((t) => <CardTeste key={t.id} t={t} />)
        )}
      </div>
    </div>
  );
}
