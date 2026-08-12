-- Prepara o banco pra aceitar o saldo líquido de seguidores (ganhos - perdidos) vindo
-- da métrica follows_and_unfollows da Meta, no dia em que ela começar a devolver dado
-- de verdade pra conta da Bázico. Até lá, o app tenta buscar todo dia e simplesmente
-- não acha nada — sem isso, quando o dado aparecer, a gravação falharia.
alter table daily_account_metrics drop constraint if exists daily_account_metrics_metric_type_check;
alter table daily_account_metrics add constraint daily_account_metrics_metric_type_check
  check (metric_type in ('alcance','visitas','views','cliques','interacoes','seguidores','seguidores_liquido'));
