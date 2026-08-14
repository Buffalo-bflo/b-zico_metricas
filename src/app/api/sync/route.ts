import { NextRequest, NextResponse } from "next/server";
import { runMetaSync, type SyncResult } from "@/lib/meta/sync";
import { backupToGithub, type BackupResult } from "@/lib/backup/githubBackup";
import { sendDailyDigest } from "@/lib/notify/dailyDigest";
import { runSecurityCheck, isSecurityCheckDay, type SecurityCheckResult } from "@/lib/security/securityCheck";

// Chamado só pelo cron da Vercel (uma vez por dia). Não passa pelo portão de senha
// (o cron não tem cookie de sessão) — em vez disso, exige o cabeçalho Authorization
// que só a própria Vercel conhece (configurado via variável CRON_SECRET).
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  // Cada etapa é isolada de propósito: se a sincronização com a Meta falhar (token
  // revogado, permissão retirada, app bloqueado etc.), o backup e o e-mail de aviso
  // continuam rodando mesmo assim — é justamente quando a Meta falha que o e-mail
  // avisando disso importa mais. Um erro nunca vira uma exceção sem tratamento: a rota
  // sempre devolve um JSON explicando o que deu certo e o que não deu.
  const resultadoVazio: SyncResult = { dailyMetricRows: 0, feedPosts: 0, storyPosts: 0, publicoSalvo: false, errors: [] };
  const backupVazio: BackupResult = { ok: false, error: "Não executado (sincronização travou antes de chegar aqui)." };

  let resultado: SyncResult;
  try {
    resultado = await runMetaSync();
  } catch (e) {
    resultado = { ...resultadoVazio, errors: [`Sincronização travou: ${e instanceof Error ? e.message : String(e)}`] };
  }

  let backup: BackupResult;
  try {
    backup = await backupToGithub();
  } catch (e) {
    backup = { ...backupVazio, error: `Backup travou: ${e instanceof Error ? e.message : String(e)}` };
  }

  let security: SecurityCheckResult | null = null;
  if (isSecurityCheckDay()) {
    try {
      security = await runSecurityCheck();
    } catch (e) {
      security = { ran: true, ok: false, alerts: [`Checagem travou: ${e instanceof Error ? e.message : String(e)}`] };
    }
  }

  try {
    await sendDailyDigest(resultado, backup, security);
  } catch {
    // Se até o envio do e-mail falhar, não há como avisar por e-mail — mas não deixamos
    // isso derrubar a resposta da rota, que já carrega os mesmos erros no JSON.
  }

  return NextResponse.json({ ...resultado, backup, security });
}
