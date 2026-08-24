-- Reels publicados só como teste (variação de gancho/formato/legenda) não são
-- conteúdo editorial "normal": não devem entrar na fila de Marcar Conteúdo nem
-- contar nos totais da Estratégia, porque ainda não passaram pela sua avaliação.
-- Ficam sinalizados aqui e aparecem na aba Testes aguardando agrupamento em Grupo A/B.
alter table feed_posts add column if not exists is_reels_teste boolean not null default false;
