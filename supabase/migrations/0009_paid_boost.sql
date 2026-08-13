-- Marca posts que tiveram impulsionamento pago (tráfego pago), pra poder excluí-los do
-- cálculo de média orgânica de referência por formato — impulsionamento infla as
-- métricas e não representa o alcance orgânico normal de um post.
alter table feed_posts add column if not exists paid_boost boolean not null default false;
