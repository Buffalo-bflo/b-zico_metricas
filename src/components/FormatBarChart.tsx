"use client";

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { C, TIPO_COLORS } from "@/lib/designTokens";
import { fmt } from "@/lib/metrics";

export function FormatBarChart({
  data,
}: {
  data: { tipo: string; medianaViews: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.linha} vertical={false} />
        <XAxis
          dataKey="tipo"
          tick={{ fontSize: 11, fontFamily: "'Montserrat', sans-serif", fill: C.preto }}
          axisLine={{ stroke: C.linha }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fill: C.cinza }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => fmt(v)}
        />
        <Tooltip
          contentStyle={{
            background: C.preto,
            border: "none",
            borderRadius: 3,
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 12,
          }}
          labelStyle={{ color: C.creme, fontWeight: 700, marginBottom: 2 }}
          itemStyle={{ color: C.branco }}
          formatter={(value) => [fmt(Number(value)), "Mediana de views"]}
        />
        <Bar dataKey="medianaViews" radius={[3, 3, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.tipo} fill={TIPO_COLORS[entry.tipo] ?? C.roxo} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
