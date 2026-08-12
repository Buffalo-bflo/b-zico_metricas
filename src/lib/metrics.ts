export const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(Math.round(n));

export const fmtDate = (d: string) => {
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
};

// Hora local de publicação, a partir de um timestamp ISO — ajuda a achar o story de
// volta no Arquivo do Instagram, que também lista por horário.
export const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

export const median = (arr: number[]) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};
