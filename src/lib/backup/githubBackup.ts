import { supabaseServer } from "@/lib/supabase/server";

// meta_integration fica de fora de propósito: guarda o token de acesso à Meta (uma
// credencial), não histórico de dados — não faz sentido nem é seguro incluir num backup.
const TABLES = [
  "feed_posts",
  "story_posts",
  "daily_account_metrics",
  "audience_snapshots",
  "monthly_follower_summary",
  "best_posting_time",
  "post_tags",
  "ai_recommendations",
  "context_notes",
  "testes",
];

export type BackupResult = { ok: boolean; path?: string; error?: string };

// Salva uma cópia de todas as tabelas de dados (não credenciais) como um arquivo JSON
// num repositório privado dedicado do GitHub, um arquivo por dia. Reenviar no mesmo dia
// sobrescreve o arquivo daquele dia (não duplica); dias diferentes ficam todos guardados,
// então o histórico de versões do próprio Git vira o histórico de backups.
export async function backupToGithub(): Promise<BackupResult> {
  const token = process.env.GITHUB_BACKUP_TOKEN;
  const repo = process.env.GITHUB_BACKUP_REPO;
  if (!token || !repo) {
    return { ok: false, error: "Backup não configurado (faltam GITHUB_BACKUP_TOKEN/GITHUB_BACKUP_REPO)." };
  }

  const supabase = supabaseServer();
  const dump: Record<string, unknown> = {};
  for (const table of TABLES) {
    // O Supabase corta em 1.000 linhas por consulta — sem paginar, feed_posts (1.9 mil
    // linhas) seria salvo pela metade sem nenhum aviso, e o backup pareceria bom.
    const linhas: Record<string, unknown>[] = [];
    for (let de = 0; ; de += 1000) {
      const { data, error } = await supabase.from(table).select("*").range(de, de + 999);
      if (error) return { ok: false, error: `Erro ao ler ${table}: ${error.message}` };
      linhas.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    dump[table] = linhas;
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const path = `backups/${hoje}.json`;
  const content = Buffer.from(JSON.stringify(dump, null, 2), "utf-8").toString("base64");
  const headers = {
    Authorization: `Bearer ${token}`,
    "User-Agent": "bazico-metricas-app",
    "Content-Type": "application/json",
  };

  // Se já existe um backup de hoje (reprocessamento no mesmo dia), o GitHub exige o
  // "sha" do arquivo atual pra permitir sobrescrever.
  let sha: string | undefined;
  const existing = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, { headers });
  if (existing.ok) {
    const json = (await existing.json()) as { sha?: string };
    sha = json.sha;
  }

  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ message: `Backup automático ${hoje}`, content, sha }),
  });

  if (!res.ok) {
    const texto = await res.text();
    return { ok: false, error: `GitHub respondeu ${res.status}: ${texto.slice(0, 300)}` };
  }

  return { ok: true, path };
}
