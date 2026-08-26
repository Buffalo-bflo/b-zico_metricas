-- Campo curto (note) continua sendo o "título" do evento na tela; detalhes é um
-- texto mais longo opcional, pro Gustavo registrar contexto extra (preço, link,
-- responsável etc.) sem lotar o título que aparece nas barras do calendário.
alter table context_notes add column if not exists detalhes text;
