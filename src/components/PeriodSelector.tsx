"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { C } from "@/lib/designTokens";
import { monthOnlyLabel } from "@/lib/months";
import { getWeeksInMonth, weekLabel } from "@/lib/weeks";

const selectStyle = {
  fontFamily: "'Montserrat', sans-serif",
  fontSize: 12,
  fontWeight: 700,
  padding: "7px 10px",
  border: `1px solid ${C.preto}`,
  borderRadius: 20,
  color: C.preto,
  background: C.branco,
  cursor: "pointer",
} as const;

export default function PeriodSelector({ months }: { months: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (months.length === 0) return null;

  const mesAtual = searchParams.get("mes") || months[0];
  const anoAtual = mesAtual.slice(0, 4);
  const periodoAtual = searchParams.get("periodo") === "semana" ? "semana" : "mes";
  const semanas = getWeeksInMonth(mesAtual);
  const semanaAtual = searchParams.get("semana") || semanas[0]?.start || "";

  // Com anos de histórico, uma lista única de meses fica gigante — separamos em
  // Ano → Mês, e só então Semana (quando o modo semanal está ligado).
  const anos = Array.from(new Set(months.map((m) => m.slice(0, 4)))).sort().reverse();
  const mesesDoAno = months.filter((m) => m.startsWith(anoAtual));

  const push = (params: Record<string, string>) => {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(params)) sp.set(k, v);
    router.push(`${pathname}?${sp.toString()}`);
  };

  const irPara = (mes: string) => {
    push({ mes, periodo: periodoAtual, semana: getWeeksInMonth(mes)[0]?.start ?? "" });
  };

  // Ao trocar de ano, cai no mês mais recente que existe naquele ano.
  const onAnoChange = (ano: string) => {
    const primeiroDoAno = months.find((m) => m.startsWith(ano));
    if (primeiroDoAno) irPara(primeiroDoAno);
  };

  const toggleBtnStyle = (active: boolean) => ({
    fontFamily: "'Montserrat', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    padding: "6px 12px",
    border: "none",
    background: active ? C.preto : "transparent",
    color: active ? C.branco : C.cinza,
    cursor: "pointer",
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <select value={anoAtual} onChange={(e) => onAnoChange(e.target.value)} className="baz-touch-target" style={selectStyle}>
        {anos.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      <select value={mesAtual} onChange={(e) => irPara(e.target.value)} className="baz-touch-target" style={selectStyle}>
        {mesesDoAno.map((m) => (
          <option key={m} value={m}>
            {monthOnlyLabel(m)}
          </option>
        ))}
      </select>

      <div style={{ display: "flex", border: `1px solid ${C.preto}`, borderRadius: 20, overflow: "hidden" }}>
        <button
          onClick={() => push({ mes: mesAtual, periodo: "mes", semana: semanas[0]?.start ?? "" })}
          className="baz-touch-target"
          style={toggleBtnStyle(periodoAtual === "mes")}
        >
          Mês
        </button>
        <button
          onClick={() => push({ mes: mesAtual, periodo: "semana", semana: semanas[0]?.start ?? "" })}
          className="baz-touch-target"
          style={toggleBtnStyle(periodoAtual === "semana")}
        >
          Semana
        </button>
      </div>

      {periodoAtual === "semana" && semanas.length > 0 && (
        <select
          value={semanaAtual}
          onChange={(e) => push({ mes: mesAtual, periodo: "semana", semana: e.target.value })}
          style={selectStyle}
        >
          {semanas.map((s) => (
            <option key={s.start} value={s.start}>
              {weekLabel(s.start, s.end)}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
