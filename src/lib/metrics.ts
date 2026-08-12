export const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(Math.round(n));

export const fmtDate = (d: string) => {
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
};

export const median = (arr: number[]) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};
