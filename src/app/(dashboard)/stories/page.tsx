import { supabaseServer } from "@/lib/supabase/server";
import { SectionTitle, KpiCard } from "@/components/Brand";
import { C } from "@/lib/designTokens";
import { fmt, fmtDate, fmtTime, median } from "@/lib/metrics";
import { resolvePeriod, type PeriodSearchParams } from "@/lib/period";

export const dynamic = "force-dynamic";

type StoryRow = {
  id: string;
  description: string;
  media_type: string | null;
  published_at: string;
  post_date: string;
  views: number;
  reach: number;
  link_clicks: number;
  replies: number;
  follows: number;
};

const MEDIA_TYPE_LABEL: Record<string, string> = { IMAGE: "Foto", VIDEO: "Vídeo" };

export default async function StoriesPage({
  searchParams,
}: {
  searchParams: Promise<PeriodSearchParams>;
}) {
  const supabase = supabaseServer();
  const period = await resolvePeriod(await searchParams);
  const { data, error } = await supabase
    .from("story_posts")
    .select("id, description, media_type, published_at, post_date, views, reach, link_clicks, replies, follows")
    .gte("post_date", period.start)
    .lte("post_date", period.end)
    .order("post_date", { ascending: false });

  if (error) {
    return (
      <div className="baz-fade-up">
        <SectionTitle>Stories</SectionTitle>
        <p style={{ color: C.erro, fontSize: 13 }}>Erro ao buscar dados: {error.message}</p>
      </div>
    );
  }

  const stories = (data ?? []) as StoryRow[];

  if (stories.length === 0) {
    return (
      <div className="baz-fade-up">
        <SectionTitle>Stories</SectionTitle>
        <p style={{ color: C.cinza, fontSize: 13 }}>
          Nenhum story encontrado ainda. Suba o CSV de Conteúdo (Stories) na tela de upload.
        </p>
      </div>
    );
  }

  const doMes = stories;

  const stats = {
    medianaViews: median(doMes.map((s) => s.views)),
    medianaAlcance: median(doMes.map((s) => s.reach)),
    totalCliques: doMes.reduce((a, s) => a + s.link_clicks, 0),
    totalRespostas: doMes.reduce((a, s) => a + s.replies, 0),
  };

  const ordenado = [...doMes].sort((a, b) => b.views - a.views).slice(0, 15);

  return (
    <div className="baz-fade-up">
      <SectionTitle>Stories</SectionTitle>

      <div className="baz-stagger" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <KpiCard label="Stories publicados" value={doMes.length} accent={C.creme} />
        <KpiCard label="Mediana de views" value={fmt(stats.medianaViews)} accent={C.creme} />
        <KpiCard label="Mediana de alcance" value={fmt(stats.medianaAlcance)} accent={C.creme} />
        <KpiCard label="Cliques em link (total)" value={fmt(stats.totalCliques)} accent={C.creme} />
        <KpiCard label="Respostas (total)" value={fmt(stats.totalRespostas)} accent={C.creme} />
      </div>

      <div style={{ background: C.branco, border: `1px solid ${C.linha}`, borderRadius: 4, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.preto, marginBottom: 12 }}>
          Top 15 stories por views
        </div>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.preto}` }}>
                {["Data", "Hora", "Tipo", "Views", "Alcance", "Cliques", "Respostas", "+Seg.", "Descrição"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: h === "Data" || h === "Hora" || h === "Tipo" || h === "Descrição" ? "left" : "right",
                      padding: "8px 10px",
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: C.cinza,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordenado.map((s) => (
                <tr key={s.id} style={{ borderBottom: `1px solid ${C.linha}` }}>
                  <td style={{ padding: "9px 10px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.cinza }}>
                    {fmtDate(s.post_date)}
                  </td>
                  <td style={{ padding: "9px 10px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.cinza, whiteSpace: "nowrap" }}>
                    {fmtTime(s.published_at)}
                  </td>
                  <td style={{ padding: "9px 10px", fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: C.preto, whiteSpace: "nowrap" }}>
                    {s.media_type ? (MEDIA_TYPE_LABEL[s.media_type] ?? s.media_type) : "—"}
                  </td>
                  <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: C.preto }}>
                    {fmt(s.views)}
                  </td>
                  <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.cinza }}>
                    {fmt(s.reach)}
                  </td>
                  <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.cinza }}>
                    {fmt(s.link_clicks)}
                  </td>
                  <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.cinza }}>
                    {fmt(s.replies)}
                  </td>
                  <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.roxo }}>
                    {s.follows > 0 ? `+${s.follows}` : "—"}
                  </td>
                  <td style={{ padding: "9px 10px", fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: C.cinza, maxWidth: 220 }}>
                    {s.description ? s.description.slice(0, 60) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
