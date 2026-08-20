"use client";

import { useState } from "react";
import { SectionTitle } from "@/components/Brand";
import { C, FONT_MONO, btnPrimary, btnSecondary } from "@/lib/designTokens";

type Recomendacao = {
  recommendation_text: string;
  created_at: string;
  model_used: string | null;
} | null;

export function RecomendacaoSection({
  prompt,
  contextoAtual,
  recomendacaoInicial,
}: {
  prompt: string;
  contextoAtual: string;
  recomendacaoInicial: Recomendacao;
}) {
  const [copiado, setCopiado] = useState(false);
  const [resposta, setResposta] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState("");
  const [ultima, setUltima] = useState<Recomendacao>(recomendacaoInicial);
  const [mostrarPrompt, setMostrarPrompt] = useState(false);

  const copiarPrompt = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const salvarResposta = async () => {
    if (!resposta.trim()) return;
    setSalvando(true);
    setErro("");
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationText: resposta, periodContext: contextoAtual }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || "Não foi possível salvar.");
      } else {
        setUltima({ recommendation_text: resposta, created_at: new Date().toISOString(), model_used: "Claude.ai (colado manualmente)" });
        setResposta("");
        setSalvo(true);
        setTimeout(() => setSalvo(false), 2500);
      }
    } finally {
      setSalvando(false);
    }
  };

  return (
    <details className="baz-accordion">
      <summary className="baz-accordion-summary">
        <SectionTitle tight>Recomendação para a próxima semana</SectionTitle>
      </summary>
      <div className="baz-accordion-body">
      <div style={{ border: `1px solid ${C.linha}`, borderRadius: 4, marginBottom: 16, overflow: "hidden" }}>
        {[
          <>Copie o prompt abaixo (já vem com os dados do mês preenchidos).</>,
          <>
            Abra uma conversa nova no{" "}
            <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" style={{ color: C.roxo, textDecoration: "underline" }}>
              Claude.ai
            </a>{" "}
            (sua conta Pro) e cole.
          </>,
          <>Copie a resposta do Claude e cole no campo abaixo pra guardar no histórico.</>,
        ].map((texto, i, arr) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
              padding: "12px 16px",
              borderBottom: i < arr.length - 1 ? `1px solid ${C.linha}` : "none",
            }}
          >
            <span style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 11, color: C.cinza, flexShrink: 0, paddingTop: 1 }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: C.preto, lineHeight: 1.6 }}>
              {texto}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <button onClick={copiarPrompt} className="baz-btn-primary" style={btnPrimary}>
          {copiado ? "Copiado ✓" : "Copiar prompt"}
        </button>
        <button onClick={() => setMostrarPrompt((v) => !v)} className="baz-btn-secondary" style={btnSecondary}>
          {mostrarPrompt ? "Esconder prompt" : "Ver prompt"}
        </button>
      </div>

      {mostrarPrompt && (
        <pre
          style={{
            whiteSpace: "pre-wrap",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: C.preto,
            background: "#FAFAFA",
            border: `1px solid ${C.linha}`,
            borderRadius: 3,
            padding: 12,
            maxHeight: 300,
            overflowY: "auto",
            marginBottom: 16,
          }}
        >
          {prompt}
        </pre>
      )}

      <label style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 11, color: C.cinza, display: "block", marginBottom: 6 }}>
        Cole aqui a resposta do Claude
      </label>
      <textarea
        value={resposta}
        onChange={(e) => setResposta(e.target.value)}
        rows={6}
        placeholder="Cole aqui o texto que o Claude respondeu..."
        style={{
          width: "100%",
          fontFamily: "'Montserrat', sans-serif",
          fontSize: 12,
          padding: 10,
          border: `1px solid ${C.linha}`,
          borderRadius: 3,
          resize: "vertical",
          marginBottom: 10,
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={salvarResposta} disabled={salvando || !resposta.trim()} className="baz-btn-primary" style={{ ...btnPrimary, opacity: salvando || !resposta.trim() ? 0.5 : 1 }}>
          {salvando ? "Salvando..." : "Salvar recomendação"}
        </button>
        {salvo && <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 11, color: C.roxo }}>Salvo ✓</span>}
      </div>
      {erro && <div style={{ color: C.erro, fontSize: 12, marginTop: 8 }}>{erro}</div>}

      {ultima && (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.linha}` }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: C.cinza, marginBottom: 8 }}>
            Última recomendação salva — {new Date(ultima.created_at).toLocaleDateString("pt-BR")}
          </div>
          <div style={{ whiteSpace: "pre-wrap", fontSize: 13, color: C.preto, lineHeight: 1.6 }}>
            {ultima.recommendation_text}
          </div>
        </div>
      )}
      </div>
    </details>
  );
}
