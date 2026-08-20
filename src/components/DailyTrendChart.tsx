"use client";

import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { C } from "@/lib/designTokens";
import { CustomTooltip } from "@/components/Brand";
import { fmt, fmtDate } from "@/lib/metrics";

const METRIC_OPTIONS = [
  { key: "alcance", label: "Alcance" },
  { key: "views", label: "Visualizações" },
  { key: "visitas", label: "Visitas ao Perfil" },
  { key: "cliques", label: "Cliques no Link" },
  { key: "interacoes", label: "Interações" },
  { key: "seguidores", label: "Novos Seguidores" },
];

export type DailyPoint = {
  metric_date: string;
  alcance: number;
  views: number;
  visitas: number;
  cliques: number;
  interacoes: number;
  seguidores: number;
};

export function DailyTrendChart({ data }: { data: DailyPoint[] }) {
  const [metric, setMetric] = useState<keyof DailyPoint>("alcance");

  return (
    <div style={{ background: C.branco, border: `1px solid ${C.linha}`, borderRadius: 4, padding: 20, marginBottom: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: C.preto }}>Tendência diária da conta</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {METRIC_OPTIONS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key as keyof DailyPoint)}
              className="baz-touch-target"
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: 11,
                fontWeight: metric === m.key ? 700 : 300,
                padding: "5px 10px",
                background: metric === m.key ? C.roxoTint : "transparent",
                color: metric === m.key ? C.roxo : C.cinza,
                border: `1px solid ${metric === m.key ? C.roxo : C.linha}`,
                borderRadius: 20,
                cursor: "pointer",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="fillMetric" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={C.roxo} stopOpacity={0.35} />
              <stop offset="95%" stopColor={C.roxo} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={C.linha} vertical={false} />
          <XAxis
            dataKey="metric_date"
            tickFormatter={fmtDate}
            tick={{ fontSize: 10, fontFamily: "'Montserrat', sans-serif", fill: C.cinza }}
            axisLine={{ stroke: C.linha }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fill: C.cinza }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => fmt(v)}
          />
          <Tooltip content={<CustomTooltip fmtLabel={fmtDate} fmtValue={fmt} />} />
          <Area type="monotone" dataKey={metric} stroke={C.roxo} strokeWidth={2} fill="url(#fillMetric)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
