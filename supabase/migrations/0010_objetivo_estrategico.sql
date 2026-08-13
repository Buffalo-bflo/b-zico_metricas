-- "Objetivo Estratégico" é diferente do "Objetivo de Engajamento" que já existia:
-- aquele é sobre a AÇÃO que o post busca (comentário, salvamento); este é sobre PARA QUEM
-- o post é direcionado dentro do funil. Um post de Aquisição julgado por conversão direta
-- pareceria fracasso mesmo tendo feito exatamente o trabalho dele.
alter table post_tags add column if not exists strategic_objective text;
