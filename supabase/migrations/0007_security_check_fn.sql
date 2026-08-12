-- Função que devolve se cada tabela do app ainda tem RLS (row level security) ligado.
-- É o principal jeito de detectar, sem precisar de um token de gerenciamento mais
-- poderoso, se alguém desligou sem querer a proteção que impede o navegador (que carrega
-- a chave pública) de ler os dados direto do banco, ignorando a tela de senha do app.
create or replace function public.rls_status_check()
returns table(table_name text, rls_enabled boolean)
language sql
security definer
set search_path = public, pg_catalog
as $$
  select tablename, rowsecurity
  from pg_tables
  where schemaname = 'public';
$$;

revoke all on function public.rls_status_check() from public, anon, authenticated;
grant execute on function public.rls_status_check() to service_role;
