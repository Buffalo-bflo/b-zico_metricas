import Papa from "papaparse";
import { parseCount, normalizeDate } from "./shared";

export interface ParsedDailyMetric {
  metric_date: string;
  metric_type: string;
  value: number;
}

const METRIC_KEYWORDS: [RegExp, string][] = [
  [/alcance/i, "alcance"],
  [/visitas/i, "visitas"],
  [/visualiza/i, "views"],
  [/cliques/i, "cliques"],
  [/intera/i, "interacoes"],
  [/seguidor/i, "seguidores"],
];

function detectMetricType(title: string): string | null {
  for (const [re, key] of METRIC_KEYWORDS) {
    if (re.test(title)) return key;
  }
  return null;
}

// Formato real do export (UTF-16, valores entre aspas): linha "sep=,", linha de
// título (usada pra descobrir qual métrica é), linha de cabeçalho "Data","Primary",
// depois uma linha por dia, ex: "2026-08-01T00:00:00","58".
export function parseDailyMetricCsv(csvText: string): { rows: ParsedDailyMetric[]; errors: string[] } {
  const parsed = Papa.parse<string[]>(csvText, { skipEmptyLines: false });
  const allRows = parsed.data.filter((r) => r.length > 0 && r.some((c) => c.trim() !== ""));

  if (allRows.length < 3) {
    return { rows: [], errors: ["Arquivo muito curto — não parece o formato esperado."] };
  }

  const rows = allRows[0][0]?.trim().toLowerCase().startsWith("sep=") ? allRows.slice(1) : allRows;

  const title = rows[0]?.[0] ?? "";
  const metricType = detectMetricType(title);
  if (!metricType) {
    return {
      rows: [],
      errors: [`Não consegui identificar a métrica pelo título "${title}". Confirme o arquivo.`],
    };
  }

  const headerIdx = rows.findIndex(
    (r) => r[0]?.trim().toLowerCase() === "data" && r[1]?.trim().toLowerCase() === "primary"
  );
  const dataRows = headerIdx >= 0 ? rows.slice(headerIdx + 1) : rows.slice(2);

  const result: ParsedDailyMetric[] = [];
  const errors: string[] = [];
  for (const r of dataRows) {
    if (!r[0]) continue;
    try {
      result.push({
        metric_date: normalizeDate(r[0]),
        metric_type: metricType,
        value: parseCount(r[1]),
      });
    } catch (e) {
      errors.push(`Linha "${r.join(",")}": ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { rows: result, errors };
}
