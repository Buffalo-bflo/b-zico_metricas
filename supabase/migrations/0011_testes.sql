-- Testes de conteúdo como objeto próprio. Antes isso só existia como campo solto
-- ("hipótese") dentro de cada post, o que não permitia comparar grupo A contra grupo B
-- nem registrar o critério de sucesso ANTES do teste começar.
create table if not exists testes (
  id uuid primary key default gen_random_uuid(),
  nome_teste text not null,
  hipotese text not null,
  variavel_testada text not null,
  posts_grupo_a text[] not null default '{}',
  posts_grupo_b text[] not null default '{}',
  criterio_sucesso text not null,
  data_inicio date not null,
  data_fim date,
  status text not null default 'Planejado'
    check (status in ('Planejado','Em andamento','Concluído')),
  -- Só faz sentido preencher quando o teste terminou. O banco garante isso, não só a tela:
  -- assim nem uma chamada direta à API consegue gravar resultado de teste em andamento.
  resultado text
    check (resultado is null or resultado in ('Confirmado','Refutado','Inconclusivo')),
  leitura_final text,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now(),
  constraint resultado_so_quando_concluido
    check (resultado is null or status = 'Concluído')
);

alter table testes enable row level security;
