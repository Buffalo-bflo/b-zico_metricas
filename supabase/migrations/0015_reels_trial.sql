-- Reels de teste (Trial Reels do Instagram, lançados em 2026) passam a ser detectados
-- automaticamente pela API da Meta, em vez de só pela caixinha manual da aba Feed.
--
-- A Meta devolve `is_shared_to_feed` por reel: false = ainda não está no perfil/grade
-- (teste em andamento); true = está no perfil. Quando um teste vai pro feed, o campo vira
-- true e o reel ficaria idêntico a um publicado normal — por isso guardamos aqui, de forma
-- permanente, que ele NASCEU como teste. É isso que permite destacar "teste que funcionou".
alter table feed_posts add column if not exists shared_to_feed boolean;
alter table feed_posts add column if not exists foi_reels_teste boolean not null default false;
alter table feed_posts add column if not exists promovido_em date;

-- Tudo que já estava marcado como teste manualmente nasceu como teste.
update feed_posts set foi_reels_teste = true where is_reels_teste;
