-- "Contexto e datas importantes" vira range de datas (evento de vários dias), não só
-- um dia isolado. Renomeia a coluna existente pra event_date_start e adiciona
-- event_date_end; linhas antigas (um dia só) recebem end = start no backfill, então
-- continuam se comportando exatamente como antes até o usuário cadastrar um range de fato.
alter table context_notes rename column event_date to event_date_start;
alter table context_notes add column event_date_end date;
update context_notes set event_date_end = event_date_start where event_date_end is null;
alter table context_notes alter column event_date_end set not null;
alter table context_notes add constraint context_notes_range_valid check (event_date_end >= event_date_start);
