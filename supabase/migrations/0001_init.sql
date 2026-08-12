-- Bázico · Métricas Orgânicas — schema inicial
-- Rode este arquivo inteiro uma vez no SQL Editor do Supabase.

create table if not exists feed_posts (
  id text primary key,
  account_username text,
  post_type text not null,
  raw_post_type text,
  description text,
  permalink text,
  published_at timestamptz not null,
  post_date date not null,
  duration_seconds numeric,
  views bigint default 0,
  reach bigint default 0,
  likes bigint default 0,
  shares bigint default 0,
  follows bigint default 0,
  comments bigint default 0,
  saves bigint default 0,
  imported_at timestamptz default now(),
  source_file text
);

create table if not exists story_posts (
  id text primary key,
  account_username text,
  description text,
  published_at timestamptz not null,
  post_date date not null,
  views bigint default 0,
  reach bigint default 0,
  link_clicks bigint default 0,
  replies bigint default 0,
  follows bigint default 0,
  imported_at timestamptz default now(),
  source_file text
);

create table if not exists daily_account_metrics (
  metric_date date not null,
  metric_type text not null check (metric_type in ('alcance','visitas','views','cliques','interacoes','seguidores')),
  value numeric not null,
  imported_at timestamptz default now(),
  primary key (metric_date, metric_type)
);

create table if not exists audience_snapshots (
  snapshot_date date primary key,
  age_gender jsonb not null default '[]',
  top_cities jsonb not null default '[]',
  top_countries jsonb not null default '[]',
  top_pages jsonb not null default '[]',
  imported_at timestamptz default now()
);

create table if not exists monthly_follower_summary (
  period_label text not null,
  period_start date not null,
  period_end date not null,
  gained integer not null default 0,
  lost integer not null default 0,
  updated_at timestamptz default now(),
  primary key (period_start, period_end)
);

create table if not exists best_posting_time (
  period_start date not null,
  period_end date not null,
  day_of_week text not null default '',
  peak_window text not null,
  primary key (period_start, period_end, day_of_week)
);

create table if not exists post_tags (
  post_id text primary key references feed_posts(id) on delete cascade,
  editorial_line text,
  content_mode text,
  engagement_objective text,
  origin text default 'Interno',
  hypothesis text,
  hypothesis_status text default 'Observar',
  tagged_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  period_context text,
  recommendation_text text not null,
  model_used text,
  created_at timestamptz default now()
);

-- RLS ligado por padrão (defesa em profundidade): nenhuma tabela fica acessível
-- pela API pública sem uma política explícita. O app usa a service_role key
-- no servidor, que sempre ignora RLS, então isso não afeta o funcionamento do app.
alter table feed_posts enable row level security;
alter table story_posts enable row level security;
alter table daily_account_metrics enable row level security;
alter table audience_snapshots enable row level security;
alter table monthly_follower_summary enable row level security;
alter table best_posting_time enable row level security;
alter table post_tags enable row level security;
alter table ai_recommendations enable row level security;
