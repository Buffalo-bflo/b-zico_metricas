"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { C } from "@/lib/designTokens";
import { monthLabelCap } from "@/lib/months";

export default function MonthSelector({ months }: { months: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mesAtual = searchParams.get("mes") || months[0] || "";

  if (months.length === 0) return null;

  const onChange = (mes: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mes", mes);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <select
      value={mesAtual}
      onChange={(e) => onChange(e.target.value)}
      style={{
        fontFamily: "'Montserrat', sans-serif",
        fontSize: 12,
        fontWeight: 700,
        padding: "7px 10px",
        border: `1px solid ${C.preto}`,
        borderRadius: 20,
        color: C.preto,
        background: C.branco,
        cursor: "pointer",
      }}
    >
      {months.map((m) => (
        <option key={m} value={m}>
          {monthLabelCap(m)}
        </option>
      ))}
    </select>
  );
}
