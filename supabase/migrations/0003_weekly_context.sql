-- Contexto livre da semana (datas importantes, pedidos do CMO etc.) usado no prompt
-- da recomendação por IA. É um valor único que vai sendo substituído (igual ao
-- protótipo, que guardava só o texto mais recente).
create table if not exists weekly_context (
  id boolean primary key default true check (id),
  context_text text not null default '',
  updated_at timestamptz default now()
);
alter table weekly_context enable row level security;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
