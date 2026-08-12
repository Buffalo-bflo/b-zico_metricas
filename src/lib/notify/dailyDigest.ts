import nodemailer from "nodemailer";
import type { SyncResult } from "@/lib/meta/sync";
import type { BackupResult } from "@/lib/backup/githubBackup";

// Envia o resumo diário (sincronização + backup) pelo próprio Gmail do Gustavo, usando
// uma "senha de app" em vez da senha normal da conta — é assim que o Google permite um
// programa mandar e-mail em nome de alguém sem expor a senha de verdade.
export async function sendDailyDigest(sync: SyncResult, backup: BackupResult): Promise<void> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.ALERT_EMAIL_TO;
  if (!user || !pass || !to) return; // Ainda não configurado — não é um erro, só não envia.

  const tudoCerto = sync.errors.length === 0 && backup.ok;
  const assunto = tudoCerto
    ? "✅ Bázico Métricas — tudo certo hoje"
    : "⚠️ Bázico Métricas — algo precisa de atenção";

  const linhas = [
    `Sincronização: ${sync.dailyMetricRows} linhas de métricas diárias, ${sync.feedPosts} posts de feed, ${sync.storyPosts} stories ativos, público ${sync.publicoSalvo ? "atualizado" : "não atualizado"}.`,
    sync.errors.length > 0
      ? `Erros na sincronização:\n${sync.errors.map((e) => `  - ${e}`).join("\n")}`
      : "Sincronização sem erros.",
    "",
    backup.ok
      ? `Backup salvo em ${backup.path}.`
      : `Backup falhou: ${backup.error}`,
  ];

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `Bázico Métricas <${user}>`,
    to,
    subject: assunto,
    text: linhas.join("\n"),
  });
}
