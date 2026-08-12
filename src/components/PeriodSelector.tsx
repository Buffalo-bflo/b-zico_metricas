"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { C } from "@/lib/designTokens";
import { monthLabelCap } from "@/lib/months";
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
  const periodoAtual = searchParams.get("periodo") === "semana" ? "semana" : "mes";
  const semanas = getWeeksInMonth(mesAtual);
  const semanaAtual = searchParams.get("semana") || semanas[0]?.start || "";

  const push = (params: Record<string, string>) => {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(params)) sp.set(k, v);
    router.push(`${pathname}?${sp.toString()}`);
  };

  const onMonthChange = (mes: string) => {
    const novasSemanas = getWeeksInMonth(mes);
    push({ mes, periodo: periodoAtual, semana: novasSemanas[0]?.start ?? "" });
  };

  const onPeriodoChange = (periodo: "mes" | "semana") => {
    push({ mes: mesAtual, periodo, semana: semanas[0]?.start ?? "" });
  };

  const onSemanaChange = (semana: string) => {
    push({ mes: mesAtual, periodo: "semana", semana });
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
      <select value={mesAtual} onChange={(e) => onMonthChange(e.target.value)} style={selectStyle}>
        {months.map((m) => (
          <option key={m} value={m}>
            {monthLabelCap(m)}
          </option>
        ))}
      </select>

      <div style={{ display: "flex", border: `1px solid ${C.preto}`, borderRadius: 20, overflow: "hidden" }}>
        <button onClick={() => onPeriodoChange("mes")} style={toggleBtnStyle(periodoAtual === "mes")}>
          Mês
        </button>
        <button onClick={() => onPeriodoChange("semana")} style={toggleBtnStyle(periodoAtual === "semana")}>
          Semana
        </button>
      </div>

      {periodoAtual === "semana" && semanas.length > 0 && (
        <select value={semanaAtual} onChange={(e) => onSemanaChange(e.target.value)} style={selectStyle}>
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
