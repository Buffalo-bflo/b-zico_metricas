"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { C } from "@/lib/designTokens";

export function AgeGenderChart({
  data,
}: {
  data: { faixa: string; homens: number; mulheres: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.linha} vertical={false} />
        <XAxis
          dataKey="faixa"
          tick={{ fontSize: 11, fontFamily: "'Montserrat', sans-serif", fill: C.preto }}
          axisLine={{ stroke: C.linha }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fill: C.cinza }}
          axisLine={false}
          tickLine={false}
          unit="%"
        />
        <Tooltip
          contentStyle={{
            background: C.preto,
            border: "none",
            borderRadius: 3,
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 12,
          }}
          labelStyle={{ color: C.creme }}
        />
        <Bar dataKey="homens" name="Homens" fill={C.roxo} radius={[2, 2, 0, 0]} />
        <Bar dataKey="mulheres" name="Mulheres" fill={C.creme} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
