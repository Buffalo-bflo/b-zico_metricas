# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Usuário único e confirmado: Gustavo, do marketing da Bázico (marca de moda básica masculina — camisetas, polos, calças, nécessaires, cintos — sediada em Aracaju/SE, perfil `@sejabazico`). Não é um produto público: sem cadastro, sem clientes externos, protegido por senha única compartilhada. Gustavo é leigo tecnicamente ("vibe coding") — não escreve código, descreve o que precisa e acompanha passo a passo.

## Product Purpose

Painel web privado que acompanha as métricas orgânicas do Instagram da Bázico. Existe para substituir o processo manual mensal de recriar o dashboard como um artifact do Claude.ai colando dados exportados à mão — sem histórico acumulado nem comparação entre meses. O app resolve isso com banco de dados permanente e coleta automática diária. Sucesso = Gustavo consegue ver tendência, comparar períodos e decidir estratégia de conteúdo sem recriar nada manualmente todo mês.

## Positioning

Histórico persistente + sincronização automática diária com a Meta Graph API, em vez de recriação manual mensal. Diferenciais que um concorrente genérico de "dashboard de Instagram" não replicaria:
- Detecta sozinho o corte de degradação de dados da Meta (alcance/views somem/degradam depois de ~2 anos) e protege os números já capturados no banco antes disso acontecer.
- Média de referência por formato, calculada excluindo posts impulsionados, parceria/UGC/repost e períodos degradados — criada para substituir uma meta de remuneração baseada em chute.
- Recomendação semanal por IA via "ponte de copiar/colar" com o Claude.ai Pro do próprio Gustavo, evitando pagar API separada da Anthropic.

## Operating Context

- Robô diário (Vercel Cron, 5h da manhã horário de Aracaju): sincroniza Feed/métricas diárias/Stories ativos/Público da Meta, salva backup completo em repositório privado do GitHub, roda checagem de segurança RLS a cada 2 dias, envia e-mail de resumo diário para motabuffalo@gmail.com (mesmo quando está tudo certo).
- Botão "Sincronizar agora" na tela de Upload força atualização na hora.
- Dados chegam por duas vias em paralelo: upload manual de CSV (Feed/Stories/métricas diárias/Público) e sincronização automática via Instagram Graph API (Feed + métricas diárias, exceto "Cliques no link"). Stories, Público e "seguidores perdidos" continuam só manual/CSV.
- Seletor de período presente em todas as telas: Ano → Mês → Semana. Semana = domingo a sábado (decisão deliberada, não é o padrão ISO, para bater com como o time enxerga a semana).
- 6 telas: Visão Geral, Feed, Stories, Público, Estratégia (marcação editorial, seguidores ganhos/perdidos, melhor horário, calendário de datas importantes, média de referência por formato, projeção de tendência, recomendação semanal por IA), Comparar (até 4 períodos lado a lado).

## Capabilities and Constraints

- Login por senha única compartilhada (cookie assinado via `jose`) — decisão consciente para o estágio atual de um único usuário; não confundir com autenticação multiusuário.
- Recomendação por IA não usa API paga da Anthropic — usa ponte de copiar/colar manual (app monta prompt → Gustavo cola no Claude.ai Pro → cola resposta de volta).
- Token de acesso à Meta Graph API (longa duração) fica na tabela `meta_integration` do Supabase, nunca em variável de ambiente ou exposto ao navegador.
- App roda em modo Development na Meta (não passou por App Review) — só a conta @sejabazico como testadora, porque só acessa dados da própria empresa.
- Limitações reais e testadas da Meta (não são bugs do app): alcance/views degradam depois de ~2 anos (corte hoje em julho/2024, avança todo dia — o app exclui período degradado de médias e avisa visualmente); Stories somem em 24h (se a coleta diária falhar um dia, aqueles Stories se perdem para sempre, sem recuperação); não dá pra saber via API se um post foi impulsionado (marcação manual); não dá pra identificar colab/parceria via API (campo `collaborators` não retorna nada); "outras páginas que o público segue" não existe na API nem no CSV do Business Suite.
- Conceitos internos que não podem ser reinterpretados: "Índice de equilíbrio" (nota 0–100 por métrica relativa aos outros posts, média final — evita que um post viral só em views pareça "melhor" sem ter gerado comentário/salvamento); "Projeção de tendência" (média simples das últimas 4 semanas completas, deliberadamente simples e auditável, não é modelo estatístico).
- Custo operacional: R$ 0 — Vercel Hobby, Supabase free tier, sem API paga.
- Stack já existente (não greenfield): Next.js 16 (App Router) + React 19 + Recharts + Supabase + Papaparse + Nodemailer + jose, TypeScript.

## Brand Commitments

Identidade visual (cores, fontes, símbolo) portada literalmente do protótipo original em React aprovado pelo Gustavo (`bazico_dashboard_julho_2.jsx`), que segue o visual da marca Bázico. Assets de logo em `public/` (`logo-bazico.png`, `logo-diferente.png`).

## Evidence on Hand

- Protótipo visual original aprovado: `C:\Users\Usuário\Desktop\ANALISTA_DE_MARKETING_&_IA\BÁZICO_MÉTRICAS\bazico_dashboard_julho_2.jsx` (referência de identidade visual, não o código em produção).
- Planilha de métricas do Instagram usada como fonte original: `BÁZICO_Métricas_Instagram.xlsx` (mesma pasta acima).
- Dados reais já no banco de produção: 1.903 posts de Feed (desde 10/08/2020), 304 Stories (desde 01/07/2026), 263 linhas de métricas diárias, 3 snapshots de Público — sem testemunhos, cases ou dados de terceiros fictícios a inventar.
- Documento de contexto completo mantido pelo próprio Gustavo/sessões anteriores: `CONTEXTO-PARA-CLAUDE.md` nesta pasta.

## Product Principles

1. Nunca substituir um número bom por um degradado — dado histórico capturado é protegido permanentemente, mesmo depois que a Meta esquece.
2. Simplicidade auditável antes de sofisticação estatística (ex.: projeção de tendência deliberadamente simples, para o Gustavo entender e confiar no número).
3. Zero custo operacional adicional é restrição de produto, não só técnica — decisões (login simples, ponte copiar/colar) existem para manter o app gratuito.
4. LGPD e segurança são requisito obrigatório em toda decisão, não um extra a revisar depois (ver regras de conformidade do projeto).
5. O app é para uma pessoa não-técnica decidir estratégia de conteúdo — clareza e confiança no número importam mais que completude técnica.

## Accessibility & Inclusion

Nenhum requisito específico de acessibilidade foi definido além dos padrões web básicos; usuário único, sem necessidades de acessibilidade relatadas até o momento.
