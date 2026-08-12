import { SectionTitle } from "@/components/Brand";
import { C } from "@/lib/designTokens";
import { fmt } from "@/lib/metrics";
import { weekLabel } from "@/lib/weeks";
import type { Projecao } from "@/lib/projection";

const METRIC_LABELS: Record<string, string> = {
  alcance: "Alcance",
  views: "Visualizações",
  visitas: "Visitas ao Perfil",
  cliques: "Cliques no Link",
  interacoes: "Interações",
  seguidores: "Novos Seguidores",
};

export function ProjecaoSection({
  projecaoData,
  testesResumo,
}: {
  projecaoData: Projecao | null;
  testesResumo: { confirmadas: number; refutadas: number; observando: number; total: number };
}) {
  return (
    <div style={{ background: C.branco, border: `1px solid ${C.linha}`, borderRadius: 4, padding: 20 }}>
      <SectionTitle>Projeção e tendências</SectionTitle>

      {!projecaoData ? (
        <p style={{ fontSize: 13, color: C.cinza }}>
          Ainda não há semanas completas o bastante de métricas diárias pra calcular uma projeção. Suba pelo
          menos uma semana inteira (segunda a domingo) de métricas diárias.
        </p>
      ) : (
        <>
          <p style={{ fontSize: 12, color: C.cinza, marginBottom: 16 }}>
            Se o ritmo de postagem e a estratégia de conteúdo dos últimos períodos continuarem parecidos,
            com base na média das últimas {projecaoData.semanasUsadas.length} semanas completas (
            {projecaoData.semanasUsadas.map((s) => weekLabel(s.start, s.end)).join(", ")}), a expectativa pra
            próxima semana é:
          </p>

          {(() => {
            const seguidores = projecaoData.projecao.find((p) => p.metric_type === "seguidores");
            if (!seguidores) return null;
            return (
              <div
                style={{
                  background: C.roxoTint,
                  border: `1px solid ${C.roxo}33`,
                  borderRadius: 6,
                  padding: "14px 18px",
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: C.roxoEscuro, marginBottom: 4 }}>
                  Expectativa de crescimento
                </div>
                <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 14, color: C.preto }}>
                  Com base no ganho médio recente (~{fmt(seguidores.mediaSemanal)} seguidores/semana), a
                  expectativa é ganhar{" "}
                  <strong style={{ fontFamily: "'JetBrains Mono', monospace", color: C.roxo }}>
                    ~{fmt(seguidores.mediaSemanal)} novos seguidores
                  </strong>{" "}
                  essa semana.
                </div>
              </div>
            );
          })()}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            {projecaoData.projecao
              .filter((p) => p.metric_type !== "seguidores")
              .map((p) => (
                <div
                  key={p.metric_type}
                  style={{
                    flex: "1 1 130px",
                    minWidth: 130,
                    background: "#FAFAFA",
                    border: `1px solid ${C.linha}`,
                    borderRadius: 6,
                    padding: "12px 14px",
                  }}
                >
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: C.cinza, marginBottom: 4 }}>
                    {METRIC_LABELS[p.metric_type]}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: C.preto }}>
                    ~{fmt(p.mediaSemanal)}
                  </div>
                  <div style={{ fontSize: 10, color: C.cinza }}>última semana: {fmt(p.ultimaSemanaCompleta)}</div>
                </div>
              ))}
          </div>

          <p style={{ fontSize: 11, color: C.cinza }}>
            É uma projeção simples (média das últimas semanas), não um modelo estatístico — serve pra ter uma
            referência de ritmo esperado, não uma garantia.
          </p>
        </>
      )}

      <div style={{ borderTop: `1px solid ${C.linha}`, marginTop: 20, paddingTop: 16 }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: C.cinza, marginBottom: 10 }}>
          Testes e hipóteses registradas
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: C.preto }}>
              {testesResumo.total}
            </div>
            <div style={{ fontSize: 11, color: C.cinza }}>posts marcados</div>
          </div>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: C.roxo }}>
              {testesResumo.confirmadas}
            </div>
            <div style={{ fontSize: 11, color: C.cinza }}>hipóteses confirmadas</div>
          </div>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: "#B3261E" }}>
              {testesResumo.refutadas}
            </div>
            <div style={{ fontSize: 11, color: C.cinza }}>hipóteses refutadas</div>
          </div>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: C.cinza }}>
              {testesResumo.observando}
            </div>
            <div style={{ fontSize: 11, color: C.cinza }}>ainda em observação</div>
          </div>
        </div>
      </div>
    </div>
  );
}
