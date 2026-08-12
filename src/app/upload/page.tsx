"use client";

import { useState } from "react";
import { SectionTitle } from "@/components/Brand";
import { C, btnPrimary } from "@/lib/designTokens";

function SyncCard() {
  const [sincronizando, setSincronizando] = useState(false);
  const [resultado, setResultado] = useState<Record<string, unknown> | null>(null);
  const [erro, setErro] = useState("");

  const sincronizar = async () => {
    setSincronizando(true);
    setErro("");
    setResultado(null);
    try {
      const res = await fetch("/api/sync/manual", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || "Não foi possível sincronizar.");
      } else {
        setResultado(data);
      }
    } catch {
      setErro("Não foi possível conectar. Tenta de novo.");
    }
    setSincronizando(false);
  };

  return (
    <div
      style={{
        background: C.roxoTint,
        border: `1px solid ${C.roxo}33`,
        borderRadius: 6,
        padding: 24,
        maxWidth: 480,
        marginBottom: 28,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: C.roxoEscuro, marginBottom: 4 }}>
        Sincronização automática (Feed, Métricas diárias, Stories, Público)
      </div>
      <div style={{ fontSize: 12, color: C.preto, marginBottom: 16 }}>
        Puxa direto da API da Meta os últimos 10 dias de Feed e métricas diárias, os Stories que
        ainda estão ativos agora (a Meta só guarda 24h) e um retrato atual do Público — roda sozinha
        todo dia de madrugada. Use esse botão se quiser forçar agora. Só Seguidores perdidos continua
        manual (a Meta ainda não está devolvendo esse dado pra nossa conta).
      </div>
      <button
        onClick={sincronizar}
        disabled={sincronizando}
        className="baz-btn-primary"
        style={{ ...btnPrimary, opacity: sincronizando ? 0.6 : 1, cursor: sincronizando ? "default" : "pointer" }}
      >
        {sincronizando ? "Sincronizando..." : "Sincronizar agora"}
      </button>

      {erro && <div style={{ color: "#B3261E", fontSize: 12, marginTop: 12 }}>{erro}</div>}

      {resultado && (
        <div style={{ marginTop: 16, fontSize: 13, color: C.preto }}>
          <div>✓ {String(resultado.dailyMetricRows)} linhas de métricas diárias</div>
          <div>✓ {String(resultado.feedPosts)} posts de feed</div>
          <div>✓ {String(resultado.storyPosts)} stories ativos agora</div>
          <div>{resultado.publicoSalvo ? "✓" : "—"} snapshot de Público {resultado.publicoSalvo ? "atualizado" : "não atualizado"}</div>
          {Array.isArray(resultado.errors) && resultado.errors.length > 0 && (
            <div style={{ color: "#B3261E", marginTop: 6 }}>
              {(resultado.errors as string[]).map((e, i) => (
                <div key={i}>{e}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UploadCard({
  titulo,
  descricao,
  tipo,
  multiplo,
  renderResultado,
}: {
  titulo: string;
  descricao: string;
  tipo: "feed_stories" | "daily_metric" | "publico";
  multiplo?: boolean;
  renderResultado: (resultados: Record<string, unknown>[]) => React.ReactNode;
}) {
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [resultados, setResultados] = useState<Record<string, unknown>[]>([]);
  const [erro, setErro] = useState("");

  const enviar = async () => {
    if (arquivos.length === 0) return;
    setEnviando(true);
    setErro("");
    setResultados([]);
    const novos: Record<string, unknown>[] = [];
    try {
      for (const arquivo of arquivos) {
        const form = new FormData();
        form.append("file", arquivo);
        form.append("tipo", tipo);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) {
          setErro(data.error || `Não foi possível processar ${arquivo.name}.`);
          break;
        }
        novos.push({ nomeArquivo: arquivo.name, ...data });
      }
      setResultados(novos);
    } catch {
      setErro("Não foi possível conectar. Tenta de novo.");
    }
    setEnviando(false);
  };

  return (
    <div
      style={{
        background: C.branco,
        border: `1px solid ${C.linha}`,
        borderRadius: 6,
        padding: 24,
        maxWidth: 480,
        marginBottom: 20,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: C.preto, marginBottom: 4 }}>{titulo}</div>
      <div style={{ fontSize: 12, color: C.cinza, marginBottom: 16 }}>{descricao}</div>

      <input
        type="file"
        accept=".csv"
        multiple={multiplo}
        onChange={(e) => setArquivos(Array.from(e.target.files ?? []))}
        style={{ fontSize: 13, marginBottom: 16, display: "block" }}
      />

      <button
        onClick={enviar}
        disabled={arquivos.length === 0 || enviando}
        className="baz-btn-primary"
        style={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 700,
          fontSize: 13,
          padding: "9px 16px",
          background: C.preto,
          color: C.branco,
          border: "none",
          borderRadius: 3,
          cursor: arquivos.length === 0 || enviando ? "default" : "pointer",
          opacity: arquivos.length === 0 || enviando ? 0.5 : 1,
        }}
      >
        {enviando ? "Processando..." : "Subir"}
      </button>

      {erro && <div style={{ color: "#B3261E", fontSize: 12, marginTop: 12 }}>{erro}</div>}

      {resultados.length > 0 && (
        <div style={{ marginTop: 16, fontSize: 13, color: C.preto }}>{renderResultado(resultados)}</div>
      )}
    </div>
  );
}

export default function UploadPage() {
  return (
    <div
      className="baz-fade-up baz-page-pad"
      style={{
        fontFamily: "'Montserrat', sans-serif",
        background: "#FAFAFA",
        minHeight: "100vh",
      }}
    >
      <SectionTitle>Subir CSVs do mês</SectionTitle>

      <SyncCard />

      <UploadCard
        titulo="CSV de Conteúdo (Feed ou Stories)"
        descricao="Export do Meta Business Suite — pode ser o de Feed ou o de Stories, um arquivo por vez."
        tipo="feed_stories"
        renderResultado={(resultados) =>
          resultados.map((r, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div>✓ {String(r.feedCount)} posts de feed salvos</div>
              <div>✓ {String(r.storyCount)} stories salvos</div>
              {Array.isArray(r.errors) && r.errors.length > 0 && (
                <div style={{ color: "#B3261E" }}>
                  {(r.errors as string[]).map((e, j) => (
                    <div key={j}>{e}</div>
                  ))}
                </div>
              )}
            </div>
          ))
        }
      />

      <UploadCard
        titulo="Métricas diárias da conta"
        descricao="Os 6 arquivos (Alcance, Visitas, Visualizações, Cliques, Interações, Seguidores) — pode selecionar todos de uma vez."
        tipo="daily_metric"
        multiplo
        renderResultado={(resultados) =>
          resultados.map((r, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div>
                ✓ {String(r.nomeArquivo)}: {String(r.metricRows)} dias salvos
              </div>
              {Array.isArray(r.errors) && r.errors.length > 0 && (
                <div style={{ color: "#B3261E" }}>
                  {(r.errors as string[]).map((e, j) => (
                    <div key={j}>{e}</div>
                  ))}
                </div>
              )}
            </div>
          ))
        }
      />

      <UploadCard
        titulo="Público"
        descricao="CSV de Público (idade/gênero, cidades, países) — sempre um retrato do momento do export, não acumula por dia."
        tipo="publico"
        renderResultado={(resultados) =>
          resultados.map((r, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div>✓ {String(r.ageGenderCount)} faixas etárias</div>
              <div>✓ {String(r.citiesCount)} cidades</div>
              <div>✓ {String(r.countriesCount)} países</div>
              {Array.isArray(r.errors) && r.errors.length > 0 && (
                <div style={{ color: "#B3261E" }}>
                  {(r.errors as string[]).map((e, j) => (
                    <div key={j}>{e}</div>
                  ))}
                </div>
              )}
            </div>
          ))
        }
      />
    </div>
  );
}
