import { C } from "@/lib/designTokens";
import NavTabs from "@/components/NavTabs";
import { getAvailableMonths } from "@/lib/months";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const months = await getAvailableMonths();
  return (
    <div
      className="baz-page-pad"
      style={{
        fontFamily: "'Montserrat', sans-serif",
        background: "#FAFAFA",
        minHeight: "100vh",
      }}
    >
      <div
        className="baz-dashboard-header baz-stagger"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
          position: "relative",
        }}
      >
        <img src="/logo-diferente.png" alt="" className="baz-watermark" />
        <div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <img src="/logo-bazico.png" alt="BÁZICO" style={{ height: 20, marginRight: 10 }} />
            <span
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 300,
                fontSize: 14,
                color: C.cinza,
                display: "flex",
                alignItems: "center",
              }}
            >
              <img
                src="/logo-diferente.png"
                alt="≠"
                style={{ height: 13, margin: "0 6px", opacity: 0.55 }}
              />
              Orgânico Instagram
            </span>
          </div>
          <div
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 300,
              fontSize: 12,
              color: C.cinza,
              marginTop: 4,
              marginLeft: 30,
            }}
          >
            @sejabazico · Fonte: Meta Business Suite
          </div>
        </div>
        <NavTabs months={months} />
      </div>

      {children}
    </div>
  );
}
