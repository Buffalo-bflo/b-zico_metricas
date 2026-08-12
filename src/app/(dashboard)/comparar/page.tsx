import { getAvailableMonths } from "@/lib/months";
import { getAvailableWeeks } from "@/lib/weeks";
import { CompararClient } from "@/components/CompararClient";
import { SectionTitle } from "@/components/Brand";
import { C } from "@/lib/designTokens";

export const dynamic = "force-dynamic";

export default async function CompararPage() {
  const [meses, semanas] = await Promise.all([getAvailableMonths(), getAvailableWeeks()]);

  if (meses.length === 0) {
    return (
      <div className="baz-fade-up">
        <SectionTitle>Comparar</SectionTitle>
        <p style={{ color: C.cinza, fontSize: 13 }}>
          Nenhum período disponível ainda. Suba os CSVs de pelo menos dois meses pra comparar.
        </p>
      </div>
    );
  }

  return <CompararClient meses={meses} semanas={semanas} />;
}
