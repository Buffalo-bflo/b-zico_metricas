-- Guarda a credencial da integração com a API oficial da Meta (Instagram Graph API).
-- Singleton (uma linha só, como weekly_context) — o token de Página de longa duração
-- não expira na prática (só invalida se a senha do Facebook mudar, o app for removido,
-- ou o acesso for revogado manualmente).
create table if not exists meta_integration (
  id boolean primary key default true check (id),
  page_id text not null,
  ig_user_id text not null,
  page_access_token text not null,
  updated_at timestamptz default now()
);
alter table meta_integration enable row level security;
grant all on all tables in schema public to service_role;
