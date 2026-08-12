import { supabaseServer } from "@/lib/supabase/server";

export type SecurityCheckResult = {
  ran: boolean;
  ok: boolean;
  alerts: string[];
};

// Roda a cada 2 dias (chamado pelo cron diário, que decide o dia certo) — confirma que
// nenhuma tabela ficou sem RLS (o que abriria os dados pro navegador direto, ignorando a
// senha do app) e que o repositório de backup continua privado.
export async function runSecurityCheck(): Promise<SecurityCheckResult> {
  const alerts: string[] = [];

  const supabase = supabaseServer();
  const { data: rlsRows, error: rlsError } = await supabase.rpc("rls_status_check");
  if (rlsError) {
    alerts.push(`Não foi possível checar RLS das tabelas: ${rlsError.message}`);
  } else {
    for (const row of (rlsRows ?? []) as { table_name: string; rls_enabled: boolean }[]) {
      if (!row.rls_enabled) alerts.push(`Tabela "${row.table_name}" está SEM row level security ligado.`);
    }
  }

  const token = process.env.GITHUB_BACKUP_TOKEN;
  const repo = process.env.GITHUB_BACKUP_REPO;
  if (token && repo) {
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}`, {
        headers: { Authorization: `Bearer ${token}`, "User-Agent": "bazico-metricas-app" },
      });
      if (res.ok) {
        const json = (await res.json()) as { private?: boolean };
        if (!json.private) alerts.push(`Repositório de backup (${repo}) não está mais privado.`);
      } else {
        alerts.push(`Não foi possível checar o repositório de backup (status ${res.status}).`);
      }
    } catch (e) {
      alerts.push(`Erro ao checar repositório de backup: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { ran: true, ok: alerts.length === 0, alerts };
}

// Dia sim, dia não — cadência estável de 2 em 2 dias, independente do mês.
export function isSecurityCheckDay(): boolean {
  const diasDesdeEpoch = Math.floor(Date.now() / 86_400_000);
  return diasDesdeEpoch % 2 === 0;
}
