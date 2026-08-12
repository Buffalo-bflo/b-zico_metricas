import { NextRequest, NextResponse } from "next/server";
import { runMetaSync } from "@/lib/meta/sync";
import { backupToGithub } from "@/lib/backup/githubBackup";
import { sendDailyDigest } from "@/lib/notify/dailyDigest";
import { runSecurityCheck, isSecurityCheckDay } from "@/lib/security/securityCheck";

// Chamado só pelo cron da Vercel (uma vez por dia). Não passa pelo portão de senha
// (o cron não tem cookie de sessão) — em vez disso, exige o cabeçalho Authorization
// que só a própria Vercel conhece (configurado via variável CRON_SECRET).
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const resultado = await runMetaSync();
  const backup = await backupToGithub();
  const security = isSecurityCheckDay() ? await runSecurityCheck() : null;
  await sendDailyDigest(resultado, backup, security);

  return NextResponse.json({ ...resultado, backup, security });
}
