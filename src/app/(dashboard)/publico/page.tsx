import { supabaseServer } from "@/lib/supabase/server";
import { SectionTitle } from "@/components/Brand";
import { AgeGenderChart } from "@/components/AgeGenderChart";
import { C } from "@/lib/designTokens";
import { resolvePeriod, type PeriodSearchParams } from "@/lib/period";
import { fmtDate } from "@/lib/metrics";

export const dynamic = "force-dynamic";

type Item = { local: string; pct: number };

export default async function PublicoPage({
  searchParams,
}: {
  searchParams: Promise<PeriodSearchParams>;
}) {
  const period = await resolvePeriod(await searchParams);
  const supabase = supabaseServer();
  const { data: snapshots, error } = await supabase
    .from("audience_snapshots")
    .select("*")
    .order("snapshot_date", { ascending: false });

  if (error) {
    return (
      <div className="baz-fade-up">
        <SectionTitle>Público</SectionTitle>
        <p style={{ color: C.erro, fontSize: 13 }}>Erro ao buscar dados: {error.message}</p>
      </div>
    );
  }

  // Público é sempre um retrato do momento (a Meta não guarda histórico diário disso) —
  // por isso mostramos o snapshot mais recente que exista até o fim do período escolhido,
  // não uma média nem uma soma.
  const data = (snapshots ?? []).find((s) => s.snapshot_date <= period.end) ?? null;

  if (!data) {
    return (
      <div className="baz-fade-up">
        <SectionTitle>Público</SectionTitle>
        <p style={{ color: C.cinza, fontSize: 13 }}>
          Nenhum snapshot de Público até {period.label.toLowerCase()} ainda. Suba o CSV de Público
          na tela de upload, ou aguarde a próxima sincronização automática.
        </p>
      </div>
    );
  }

  const ageGender = data.age_gender as { faixa: string; homens: number; mulheres: number }[];
  const cities = data.top_cities as Item[];
  const countries = (data.top_countries as Item[]).slice(0, 3);
  const pages = data.top_pages as Item[];

  const maxCityPct = cities[0]?.pct || 1;

  return (
    <div className="baz-fade-up">
      <p style={{ color: C.cinza, fontSize: 12, marginBottom: 16 }}>
        Retrato de {fmtDate(data.snapshot_date)} · {period.label}
      </p>
      <div className="baz-row-2col-even">
      <div style={{ background: C.branco, border: `1px solid ${C.linha}`, borderRadius: 4, padding: 20 }}>
        <SectionTitle>Faixa etária e gênero (%)</SectionTitle>
        <AgeGenderChart data={ageGender} />
      </div>

      <div style={{ background: C.branco, border: `1px solid ${C.linha}`, borderRadius: 4, padding: 20 }}>
        <SectionTitle>Principais cidades</SectionTitle>
        {cities.map((c, i) => (
          <div key={c.local} style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.cinza, width: 20 }}>
              {i + 1}
            </div>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: C.preto, width: 170 }}>
              {c.local}
            </div>
            <div
              style={{
                flex: 1,
                background: C.roxoTint,
                borderRadius: 2,
                height: 8,
                marginRight: 8,
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: "100%",
                  width: `${(c.pct / maxCityPct) * 100}%`,
                  background: C.roxo,
                  borderRadius: 2,
                }}
              />
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.preto, width: 40, textAlign: "right" }}>
              {c.pct}%
            </div>
          </div>
        ))}
      </div>

      {pages.length > 0 && (
        <div style={{ background: C.branco, border: `1px solid ${C.linha}`, borderRadius: 4, padding: 20 }}>
          <SectionTitle>Outras páginas que o público segue</SectionTitle>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {pages.map((p) => (
              <div
                key={p.local}
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: 12,
                  padding: "6px 12px",
                  background: C.roxoTint,
                  color: C.roxoEscuro,
                  borderRadius: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {p.local}
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 11 }}>
                  {p.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: C.branco, border: `1px solid ${C.linha}`, borderRadius: 4, padding: 20 }}>
        <SectionTitle>Países</SectionTitle>
        {countries.map((c) => (
          <div
            key={c.local}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: `1px solid ${C.linha}`,
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 12,
              color: C.preto,
            }}
          >
            <span>{c.local}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{c.pct}%</span>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
