-- "Automatically expose new tables" ficou desmarcado na criação do projeto (por segurança),
-- o que também impediu o Supabase de conceder automaticamente permissão de leitura/escrita
-- pro role "service_role" (usado pelo servidor do app) nas tabelas novas. RLS continua
-- ligado (o service_role sempre ignora RLS por padrão no Supabase), isso aqui só dá a
-- permissão básica de tabela que faltava.
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
