import Papa from "papaparse";

export interface AudienceSnapshot {
  age_gender: { faixa: string; homens: number; mulheres: number }[];
  top_cities: { local: string; pct: number }[];
  top_countries: { local: string; pct: number }[];
  top_pages: { local: string; pct: number }[];
}

function parsePercent(value: string | undefined): number {
  if (!value) return 0;
  const n = parseFloat(value.trim().replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

// Formato real do export de Público (UTF-16): várias "tabelas" dentro do mesmo
// arquivo, separadas por linha em branco. Idade/gênero vem uma faixa por linha.
// Cidades e países vêm "transpostos": uma linha com os nomes, a linha seguinte
// com as porcentagens na mesma ordem.
export function parsePublicoCsv(csvText: string): { snapshot: AudienceSnapshot; errors: string[] } {
  const parsed = Papa.parse<string[]>(csvText, { skipEmptyLines: false });
  const allRows = parsed.data;

  const snapshot: AudienceSnapshot = {
    age_gender: [],
    top_cities: [],
    top_countries: [],
    top_pages: [],
  };
  const errors: string[] = [];

  const semSepLinha = allRows[0]?.[0]?.trim().toLowerCase().startsWith("sep=")
    ? allRows.slice(1)
    : allRows;

  const blocos: string[][][] = [];
  let atual: string[][] = [];
  for (const row of semSepLinha) {
    const vazia = row.length === 0 || row.every((c) => c.trim() === "");
    if (vazia) {
      if (atual.length > 0) blocos.push(atual);
      atual = [];
    } else {
      atual.push(row);
    }
  }
  if (atual.length > 0) blocos.push(atual);

  for (const bloco of blocos) {
    const titulo = (bloco[0]?.[0] ?? "").trim();

    if (/etária|et.ria|g.nero|genero/i.test(titulo)) {
      for (const row of bloco.slice(2)) {
        if (!row[0]) continue;
        snapshot.age_gender.push({
          faixa: row[0].trim(),
          homens: parsePercent(row[1]),
          mulheres: parsePercent(row[2]),
        });
      }
    } else if (/cidades/i.test(titulo)) {
      const nomes = bloco[1] ?? [];
      const valores = bloco[2] ?? [];
      nomes.forEach((nome, i) => {
        if (!nome.trim()) return;
        snapshot.top_cities.push({ local: nome.trim(), pct: parsePercent(valores[i]) });
      });
    } else if (/pa.ses|paises/i.test(titulo)) {
      const nomes = bloco[1] ?? [];
      const valores = bloco[2] ?? [];
      nomes.forEach((nome, i) => {
        if (!nome.trim()) return;
        snapshot.top_countries.push({ local: nome.trim(), pct: parsePercent(valores[i]) });
      });
    } else if (/p.ginas|paginas/i.test(titulo)) {
      const nomes = bloco[1] ?? [];
      const valores = bloco[2] ?? [];
      nomes.forEach((nome, i) => {
        if (!nome.trim()) return;
        snapshot.top_pages.push({ local: nome.trim(), pct: parsePercent(valores[i]) });
      });
    } else if (titulo) {
      errors.push(`Bloco não reconhecido: "${titulo}" (ignorado)`);
    }
  }

  return { snapshot, errors };
}
