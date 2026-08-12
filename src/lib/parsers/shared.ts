// Meta exporta números como texto simples, mas às vezes com separador de milhar.
// Como todas as métricas aqui são contagens inteiras, é seguro só remover
// qualquer caractere que não seja dígito antes de converter.
export function parseCount(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const digits = String(value).replace(/[^\d]/g, "");
  if (!digits) return 0;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : 0;
}

// A data pode vir como "2026-07-01" ou "01/07/2026" (formato brasileiro) dependendo
// da exportação. O horário pode vir como "14:09" (só hora) ou já como um timestamp completo.
export function parseDataHora(dataStr: string, horaStr: string): { publishedAt: Date; postDate: string } {
  const horaTrim = (horaStr || "").trim();

  // Se "Horário de publicação" já parece um timestamp completo, usa direto.
  const asFullTimestamp = new Date(horaTrim);
  if (horaTrim.length > 8 && !isNaN(asFullTimestamp.getTime())) {
    return {
      publishedAt: asFullTimestamp,
      postDate: asFullTimestamp.toISOString().slice(0, 10),
    };
  }

  const dateIso = normalizeDate(dataStr);
  const timePart = /^\d{1,2}:\d{2}(:\d{2})?$/.test(horaTrim) ? horaTrim : "00:00";
  const combined = new Date(`${dateIso}T${timePart.length === 5 ? timePart + ":00" : timePart}`);

  if (isNaN(combined.getTime())) {
    throw new Error(`Não consegui interpretar data/hora: "${dataStr}" "${horaStr}"`);
  }

  return { publishedAt: combined, postDate: dateIso };
}

export function normalizeDate(dataStr: string): string {
  const s = (dataStr || "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const brMatch = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) {
    const [, dd, mm, yyyy] = brMatch;
    return `${yyyy}-${mm}-${dd}`;
  }
  throw new Error(`Formato de data não reconhecido: "${dataStr}"`);
}

// Os CSVs de métricas diárias e de Público do Meta Business Suite vêm em UTF-16
// (diferente do CSV de Conteúdo, que é UTF-8). Detecta pelo BOM (marca no início do
// arquivo) e decodifica corretamente.
export function decodeCsvBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(buffer);
  }
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(buffer);
  }
  return new TextDecoder("utf-8").decode(buffer);
}

export const TIPO_POST_MAP: Record<string, string> = {
  "Reel do Instagram": "Reels",
  "Carrossel do Instagram": "Carrossel",
  "Imagem do Instagram": "Imagem",
  "Story do Instagram": "Story",
};
