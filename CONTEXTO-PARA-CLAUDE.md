# Bázico Métricas — contexto completo do projeto
*Atualizado em 13/08/2026*

Cole este documento numa conversa nova do Claude.ai para dar contexto total sobre o projeto.

---

## 1. O QUE É

Um aplicativo web privado que acompanha as métricas orgânicas do Instagram da **Bázico** (marca de moda básica masculina — camisetas, polos, calças, nécessaires, cintos — sediada em Aracaju/SE, perfil `@sejabazico`).

**Por que existe:** antes, o dashboard era recriado todo mês como um artifact do Claude.ai, colando dados exportados na mão. Cada mês era um arquivo isolado — sem histórico acumulado, sem comparação entre períodos, e refeito do zero toda vez. O app resolve isso com um banco de dados permanente e coleta automática.

**Quem usa:** só o Gustavo (marketing da Bázico). Não é público, não tem cadastro, não tem clientes externos.

---

## 2. ONDE AS COISAS FICAM

| O quê | Onde |
|---|---|
| Site publicado | `https://b-zico-metricas.vercel.app` (senha única) |
| Hospedagem do site | Vercel, plano gratuito (Hobby), região São Paulo |
| Banco de dados | Supabase (PostgreSQL), plano gratuito, região São Paulo |
| Código-fonte | GitHub `Buffalo-bflo/b-zico_metricas` — **privado** |
| Backups diários | GitHub `Buffalo-bflo/b-zico-metricas-backups` — **privado** |
| Fonte dos dados | Instagram Graph API (Meta), via app em modo Development |

**Custo total: R$ 0.** Tudo roda em plano gratuito. A recomendação por IA não usa API paga — usa uma "ponte de copiar/colar": o app monta o prompt, o Gustavo cola no Claude.ai da assinatura Pro dele e cola a resposta de volta.

---

## 3. O QUE O APP TEM (6 abas)

- **Visão Geral** — gráfico de tendência diária + números do período + melhor/pior post.
- **Feed** — tabela de todos os posts, ordenável, com caixinha para marcar posts impulsionados.
- **Stories** — tabela com data, hora, tipo (foto/vídeo), views, alcance, cliques, respostas.
- **Público** — faixa etária/gênero, principais cidades, top 3 países.
- **Estratégia** — marcação de conteúdo (linha editorial, modo, objetivo, origem, hipótese, resultado real), seguidores ganhos/perdidos, melhor horário, calendário de datas importantes, média de referência por formato, projeção de tendência e a recomendação semanal por IA.
- **Comparar** — compara até 4 períodos lado a lado (por mês ou por semana), com gráfico sobreposto.

**Seletor de período** (topo de todas as telas): Ano → Mês → Semana. Semana é **domingo a sábado** (não é o padrão ISO — foi decisão deliberada para bater com como o time enxerga a semana).

---

## 4. DADOS QUE JÁ ESTÃO NO BANCO

| Tipo | Quantidade | Cobertura |
|---|---|---|
| Posts de Feed | 1.903 | 10/08/2020 até hoje |
| Stories | 304 | 01/07/2026 até hoje |
| Métricas diárias da conta | 263 linhas | 01/07/2026 até hoje |
| Snapshots de Público | 3 | jul–ago/2026 |
| Posts marcados (tags) | 1 | — |
| Posts marcados como impulsionados | 0 | — |

Tamanho do banco: **12 MB** de 500 MB disponíveis no plano gratuito (menos de 3%).

---

## 5. O QUE ACONTECE SOZINHO TODO DIA

Um robô (Vercel Cron) roda **todo dia às 5h da manhã** (horário de Aracaju) e executa, nesta ordem:

1. **Sincroniza com a Meta** — puxa os últimos 10 dias de posts de Feed, métricas diárias da conta, todos os Stories que ainda estão ativos, e um retrato atual do Público.
2. **Salva um backup completo** do banco (formato JSON) no repositório privado de backups do GitHub, um arquivo por dia.
3. **A cada 2 dias, roda uma checagem de segurança** — confirma que todas as tabelas do banco continuam com a proteção RLS ligada e que o repositório de backup continua privado.
4. **Envia um e-mail de resumo** para `motabuffalo@gmail.com` dizendo o que sincronizou, se o backup deu certo e se a segurança está ok. O e-mail chega todo dia, mesmo quando está tudo certo.

Também existe um botão **"Sincronizar agora"** na tela de Upload, para forçar a atualização na hora.

**Prática diária recomendada:** ler o e-mail da manhã. Se der erro, ele aparece ali com a mensagem exata.

---

## 6. O QUE AINDA É MANUAL

- **Seguidores ganhos e perdidos** — digitado à mão na aba Estratégia. A Meta tem um campo (`follows_and_unfollows`) que resolveria isso, mas ele não retorna dado nenhum para esta conta. O app tenta buscar todo dia automaticamente; no dia em que a Meta liberar, passa a funcionar sozinho.
- **Melhor horário para postar** — digitado à mão (vem dos Insights do app do Instagram).
- **Marcar posts como impulsionados** — a API da Meta não informa se um post teve tráfego pago (isso vive na API de Anúncios, que é outro sistema e exigiria App Review). Marcação manual na aba Feed.
- **Marcar origem do conteúdo** (parceria/influencer, UGC/cliente, repost) — a API também não informa isso; um Colab com influencer aparece como post normal da marca.
- **Marcação editorial dos posts** — linha editorial, modo de conteúdo, objetivo, hipótese.

---

## 7. LIMITAÇÕES REAIS DA META (não são falhas do app)

Estas foram todas testadas na prática contra a API real, não deduzidas de documentação:

1. **Alcance e visualizações duram 2 anos.** Depois disso a Meta não devolve erro — devolve **números degradados**, o que é mais perigoso, porque entram na análise como se fossem verdade. O sintoma: posts aparecem com mais curtidas do que alcance, o que é impossível. Hoje o corte está em **julho/2024** e ele **anda para frente todos os dias**.
   - O app detecta esse corte sozinho (olhando a proporção de posts impossíveis por mês) e: exclui período degradado dos cálculos de média, mostra aviso vermelho quando você abre um período antigo, e avisa no Comparar que a diferença percentual seria falsa.
   - Curtidas, comentários, compartilhamentos e salvamentos **não degradam** — ficam gravados no próprio post.
   - Como agora guardamos os números no nosso banco, eles ficam preservados mesmo depois que a Meta esquece. Tanto o robô diário quanto o script de importação nunca substituem um valor bom por um degradado.

2. **Stories somem em 24 horas.** A API só lista os que ainda estão ativos. Por isso a coleta precisa rodar todo dia — se falhar um dia, os Stories daquele dia se perdem para sempre. Não existe forma de recuperar Stories anteriores a julho/2026.

3. **Não dá para saber se um post foi impulsionado** pela API de conteúdo orgânico.

4. **Não dá para identificar Colab/parceria** — o campo `collaborators` não retorna nada.

5. **"Outras páginas que o público segue"** não existe na API (nem no CSV do Business Suite).

---

## 8. SEGURANÇA E LGPD

- Ambos os repositórios do GitHub são **privados**; conta com 2FA ativado e Dependabot ligado.
- Chaves e tokens (Supabase, Meta, GitHub, Gmail) ficam só no servidor, **nunca no navegador**. O token da Meta fica guardado no banco, não em variável de ambiente.
- Todas as tabelas com RLS (proteção de acesso) ligado — verificado automaticamente a cada 2 dias.
- Acesso ao app por senha única compartilhada (cookie assinado). Decisão consciente: só uma pessoa usa. Trocar por contas individuais é fácil quando o time crescer.
- **Avaliação LGPD:** risco baixo. O app não trata dado pessoal de terceiro identificável — só métricas agregadas da própria conta da empresa. Os dados de Público vêm da Meta já agregados em percentual (ex: "25-34 anos: 29%"), sem possibilidade de voltar a um indivíduo. Banco hospedado no Brasil.
- **Pontos de atenção futuros:** (a) não há prazo de retenção definido — hoje tudo fica guardado para sempre; (b) GitHub e Vercel ficam nos EUA — hoje sem problema porque o que está lá não tem dado pessoal de terceiro, mas isso mudaria se o app passasse a guardar dado de cliente; (c) se a marcação de parceria passar a incluir contato de influencer (e-mail, telefone), aí vira dado pessoal de verdade e precisa definir base legal antes.

---

## 9. COMO A ANÁLISE POR IA FUNCIONA HOJE

Na aba Estratégia existe uma seção "Recomendação para a próxima semana":
1. O app monta um prompt automaticamente, já preenchido com os posts marcados do período, as hipóteses escritas, os seguidores ganhos/perdidos, o melhor horário e as datas importantes cadastradas.
2. O botão "Copiar prompt" copia tudo.
3. Cola numa conversa do Claude.ai (assinatura Pro), copia a resposta.
4. Cola de volta no app, que guarda no histórico.

Isso evita pagar pela API da Anthropic separadamente.

---

## 10. CONCEITOS QUE O APP USA (para não interpretar errado)

- **Semana** = domingo a sábado. Semanas dentro de um mês são cortadas nas bordas do mês (ex: em agosto/2026, a "primeira semana" é só o dia 01, que caiu num sábado).
- **Média de referência por formato** = média orgânica real de views/alcance/curtidas/etc. por tipo de post (Reels, Carrossel, Imagem). Exclui posts impulsionados, posts de parceria/UGC/repost, e todo período com dado degradado. Tem seletor de janela: 3 meses, 12 meses ou todo o período confiável. **Serve para definir metas realistas** — foi criada porque a meta de remuneração estava baseada num chute de ~5.000 views por Reels.
- **Índice de equilíbrio** (usado nos relatórios) = cada post recebe uma nota de 0 a 100 em cada métrica, conforme a posição dele em relação aos outros, e a nota final é a média. Evita que um post que só viralizou em views apareça como "melhor" mesmo tendo gerado zero salvamento ou comentário.
- **Projeção de tendência** = média simples das últimas 4 semanas completas. Não é modelo estatístico — é deliberadamente simples e auditável.

---

## 11. O QUE ESTÁ PENDENTE

1. Revisar e substituir as listas de **Linha Editorial** e **Modo de Conteúdo** (as atuais vieram do protótipo e o Gustavo quer refazer).
2. Definir se há mais opções de **Origem** além de Interno, Parceria/Influencer, UGC/Cliente e Repost de terceiro.
3. Marcar os posts que tiveram **tráfego pago** na aba Feed (nenhum marcado ainda) — cada um marcado deixa a média de referência mais precisa.
4. Começar a **marcar conteúdo** na aba Estratégia (só 1 post marcado até agora) — é o que alimenta a recomendação por IA.
5. Confirmar que o **e-mail diário** está chegando (primeiro disparo automático de verdade seria hoje de manhã).
6. Eventual: definir política de retenção dos backups (hoje crescem para sempre; ~2 MB por dia não é problema no curto prazo).
