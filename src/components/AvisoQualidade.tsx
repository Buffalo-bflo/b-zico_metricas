import { C } from "@/lib/designTokens";
import { mesLegivel } from "@/lib/dataQuality";

// Aviso mostrado no topo de qualquer tela quando o período escolhido cai antes do
// limite de 2 anos da Meta. Sem isso, os números aparecem na tela como se fossem
// verdade e viram base de decisão errada — que é exatamente o risco que queremos evitar.
export function AvisoQualidade({ corte, periodoLabel }: { corte: string | null; periodoLabel: string }) {
  return (
    <div
      style={{
        background: "#B3261E12",
        borderLeft: "3px solid #B3261E",
        borderRadius: 4,
        padding: "12px 14px",
        fontFamily: "'Montserrat', sans-serif",
        fontSize: 12,
        color: C.preto,
        lineHeight: 1.6,
        marginBottom: 18,
      }}
    >
      <b>Atenção: alcance e visualizações de {periodoLabel} não são confiáveis.</b>
      <br />
      A Meta guarda essas duas métricas por apenas 2 anos
      {corte && <> — antes de <b>{mesLegivel(corte.slice(0, 7))}</b> ela devolve números degradados</>}. Você vai ver
      posts com mais curtidas do que alcance, o que é impossível. <b>Curtidas, comentários, compartilhamentos e
      salvamentos continuam corretos</b> (ficam gravados no próprio post). Use só esses para analisar este período, e
      não compare o alcance daqui com o de períodos recentes.
    </div>
  );
}
