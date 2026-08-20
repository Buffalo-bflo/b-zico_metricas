import { C } from "@/lib/designTokens";

export function Diff({ tipo }: { tipo?: "big" | "normal" }) {
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        color: C.roxo,
        fontWeight: 700,
        marginRight: 8,
        fontSize: tipo === "big" ? 22 : 14,
      }}
    >
      ≠
    </span>
  );
}

export function SectionTitle({ children, tight }: { children: React.ReactNode; tight?: boolean }) {
  return (
    <h2
      style={{
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: 700,
        fontSize: 15,
        letterSpacing: "-0.01em",
        color: C.preto,
        margin: tight ? 0 : "0 0 14px 0",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Diff />
      {children}
    </h2>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div
      className="baz-card"
      style={{
        background: C.branco,
        border: `1px solid ${C.linha}`,
        borderRadius: 6,
        padding: "18px 20px",
        flex: "1 1 150px",
        minWidth: 150,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 3,
          height: "100%",
          background: accent || C.roxo,
        }}
      />
      <div
        style={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 300,
          fontSize: 11,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: C.cinza,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
          fontSize: 26,
          color: C.preto,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 11,
            color: C.roxo,
            marginTop: 6,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

export const TabButton = ({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) => (
  <a
    href={href}
    className={`baz-tab baz-touch-target${active ? " active" : ""}`}
    style={{
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: active ? 700 : 400,
      fontSize: 13,
      padding: "9px 14px",
      background: "transparent",
      color: active ? C.preto : C.cinza,
      border: "none",
      borderBottom: `1px solid ${C.linha}`,
      cursor: "pointer",
      marginRight: 2,
      display: "inline-flex",
      alignItems: "center",
    }}
  >
    {children}
  </a>
);

export const CustomTooltip = ({
  active,
  payload,
  label,
  fmtLabel,
  fmtValue,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  fmtLabel: (label: string) => string;
  fmtValue: (value: number) => string;
}) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: C.preto,
        color: C.branco,
        padding: "8px 12px",
        borderRadius: 3,
        fontFamily: "'Montserrat', sans-serif",
        fontSize: 12,
      }}
    >
      <div style={{ color: C.creme, marginBottom: 4 }}>{fmtLabel(label ?? "")}</div>
      {payload.map((p, i) => (
        <div key={i}>{fmtValue(p.value)}</div>
      ))}
    </div>
  );
};
