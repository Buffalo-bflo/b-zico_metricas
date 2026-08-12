-- "Contexto e datas importantes" era uma única linha global (id=true) que se sobrescrevia
-- a cada "Salvar" — datas futuras cadastradas hoje seriam apagadas na próxima vez que
-- alguém salvasse algo. Vira uma lista de notas com data própria, sem limite de quantas
-- datas futuras podem ficar cadastradas ao mesmo tempo.
create table if not exists context_notes (
  id uuid primary key default gen_random_uuid(),
  event_date date not null,
  note text not null,
  created_at timestamptz default now()
);
alter table context_notes enable row level security;

drop table if exists weekly_context;

-- Campo pra registrar o resultado real quando ele diverge do objetivo esperado
-- (ex: "queria curtidas, veio foi compartilhamento") — separado da hipótese, que é o
-- "porquê", pra não misturar as duas coisas no mesmo texto.
alter table post_tags add column if not exists actual_result text;
