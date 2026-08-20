---
name: Bázico Métricas
description: Painel privado de métricas orgânicas do Instagram da Bázico
colors:
  preto: "#232323"
  branco: "#FFFFFF"
  canvas: "#FAFAFA"
  roxo: "#754EA9"
  roxo-escuro: "#24174A"
  roxo-tint: "#F1ECF8"
  creme: "#F2D2B4"
  cinza: "#6B6B6B"
  linha: "#E7E3EE"
  erro: "#B3261E"
  aviso: "#F0B429"
  aviso-fundo: "#FFF4E5"
  aviso-texto: "#7A4A00"
typography:
  display:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1
  stat:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: "22px"
    fontWeight: 700
  stat-small:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: "16px"
    fontWeight: 700
  headline:
    fontFamily: "'Montserrat', sans-serif"
    fontSize: "17px"
    fontWeight: 700
    letterSpacing: "-0.01em"
  subhead:
    fontFamily: "'Montserrat', sans-serif"
    fontSize: "13px"
    fontWeight: 700
  title:
    fontFamily: "'Montserrat', sans-serif"
    fontSize: "13px"
    fontWeight: 700
  body:
    fontFamily: "'Montserrat', sans-serif"
    fontSize: "12px"
    fontWeight: 400
  label:
    fontFamily: "'Montserrat', sans-serif"
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: "0.05em"
  micro:
    fontFamily: "'Montserrat', sans-serif"
    fontSize: "10px"
    fontWeight: 700
    letterSpacing: "0.05em"
rounded:
  sm: "3px"
  md: "4px"
  lg: "6px"
  pill: "20px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "24px"
  page: "28px"
  section: "32px"
  major-section: "40px"
components:
  button-primary:
    backgroundColor: "{colors.preto}"
    textColor: "{colors.branco}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.roxo-escuro}"
    textColor: "{colors.branco}"
    rounded: "{rounded.sm}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.preto}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  chip-active:
    backgroundColor: "{colors.preto}"
    textColor: "{colors.branco}"
    rounded: "{rounded.pill}"
    padding: "5px 12px"
  chip-inactive:
    backgroundColor: "transparent"
    textColor: "{colors.preto}"
    rounded: "{rounded.pill}"
    padding: "5px 12px"
  pill-select:
    backgroundColor: "{colors.branco}"
    textColor: "{colors.preto}"
    rounded: "{rounded.pill}"
    padding: "7px 10px"
  kpi-card:
    backgroundColor: "{colors.branco}"
    rounded: "{rounded.lg}"
    padding: "20px 24px"
---

# Design System: Bázico Métricas

## Overview

**Creative North Star: "A Marca Diferente" (The Diff Mark)**

O sistema parte do próprio símbolo da marca Bázico, o "≠" (diferente) — já usado como marca d'água discreta no cabeçalho e como glifo ao lado dos títulos de seção. Esse símbolo é o fio condutor: um dashboard que se recusa a ser "mais um" painel de métricas genérico. A superfície é neutra e disciplinada (preto, branco, cinza, linhas finas) e o roxo aparece raro, só para marcar o que é distinto — exatamente como a marca usa o "≠" para dizer que a Bázico não é básica no sentido pejorativo, é essencial e diferente.

O clima é discreto e editorial: pouca cor, muito espaço em branco, hierarquia por peso tipográfico em vez de decoração. Números — a matéria-prima de um app de métricas — ganham voz própria numa fonte monoespaçada (JetBrains Mono), separada do texto de interface (Montserrat), para que dado e rótulo nunca se confundam visualmente. Não há sombra em repouso; a superfície é plana e só reage ao toque (hover, foco), como uma folha de papel bem impressa, não uma interface "de app".

> **Revisão "bolder" (20/08/2026):** a pedido do Gustavo, a escala de tipografia e espaçamento foi ampliada pra dar mais peso aos números e títulos principais, mais respiro entre blocos empilhados, e mais reação ao passar o mouse — mantendo fonte, cor e as regras nomeadas abaixo intocadas (não é uma repaginação, é a mesma identidade "mais confiante"). A escala formal agora vive em código como `TYPE`/`SPACING` em `src/lib/designTokens.ts`, importada nos componentes em vez de tamanhos soltos repetidos à mão.

> **Passada de artifícios (20/08/2026):** a pedido do Gustavo, inspirada num site institucional de referência (Hirael), mas traduzida pro nosso sistema em vez de copiada — nada de fundo preto, hero de tela cheia ou animação a cada carregamento, que brigariam com "A Marca Diferente". Quatro pontos adotados: (1) o glifo "≠" ganhou um par no rodapé do dashboard (`.baz-dashboard-footer`) — a mesma marca d'água do cabeçalho, em escala grande, formando um par cabeçalho/rodapé, não um terceiro uso decorativo; (2) o grão do cabeçalho (`::after` com `feTurbulence`) virou esse mesmo par — cabeçalho e rodapé, nunca em cards/tabelas; (3) os cards de formato em "Média de referência" (`BaselineSection`) ganharam um ícone traçado de 1 peso por formato (`FormatIcon.tsx`), sem numeração — a ordem dos formatos não carrega informação real; (4) os 3 passos de "Recomendação para a próxima semana" (`RecomendacaoSection`) viraram uma lista com índice mono `01/02/03` em vez de `<ol>` simples — aqui a numeração é legítima, porque a ordem (copiar → colar no Claude → colar de volta) importa de verdade. O valor do KpiCard também ganhou uma segunda entrada (`.baz-kpi-value`), levemente atrasada em relação ao fade do card, pro número "assentar" depois do card em vez de chegar junto — ainda um único gesto de entrada por carregamento, não decoração contínua.

**Key Characteristics:**
- Neutro por padrão, roxo por exceção — a cor de destaque é rara e por isso significa algo quando aparece.
- Números sempre em fonte monoespaçada; texto de interface sempre em Montserrat.
- Plano em repouso; profundidade só aparece como resposta a interação (hover/foco), nunca como decoração fixa.
- O símbolo "≠" da marca é a assinatura visual recorrente — marca d'água e glifo inline, nunca usado como enfeite genérico.
- Duas famílias de forma coexistindo por papel: controles interativos (seletores, chips, filtros) são pílulas; contêineres (cards, tabelas) são retângulos de canto suave.

## Colors

Paleta quase monocromática (preto/branco/cinza/linha) com um único acento roxo usado com raridade deliberada, mais um creme quente reservado para um papel específico (Stories) e um vermelho semântico só para alerta.

### Primary
- **Roxo Bázico** (`#754EA9`): o único acento de marca. Usado em estados ativos/selecionados, links de destaque, a linha de "diferencial" nos KpiCards, e como cor categórica para posts do tipo Reels. Aparece em detalhes finos (risco de 3px, borda de 1px, sublinhado de 2px) — nunca como preenchimento grande.
- **Roxo Escuro** (`#24174A`): a versão profunda do acento. Usado no hover dos botões primários (que em repouso são pretos) e como cor categórica para posts do tipo Carrossel.

### Neutral
- **Tinta** (`#232323`): a cor de texto e superfície de ação primária — títulos, valores em destaque, fundo dos botões primários. Funciona como o "preto" do sistema, nunca `#000000` puro.
- **Papel** (`#FFFFFF`): fundo de cards, tabelas e do formulário de login — a superfície onde o conteúdo "descansa".
- **Tela** (`#FAFAFA`): fundo da página por trás dos cards — um cinza quase imperceptível que separa o "papel" do "vazio" ao redor.
- **Cinza Rótulo** (`#6B6B6B`): texto secundário, rótulos em caixa alta, abas inativas, números de apoio nas tabelas. Escurecido a partir do `#8A8A8A` original (contraste 3.45:1, abaixo do mínimo AA) para passar de 4.5:1 contra o branco/tela — a leitura visual muda pouco, mas o texto pequeno fica legível para todo mundo.
- **Linha** (`#E7E3EE`): todas as bordas e divisórias finas de 1px — cards, campos de texto, linhas de tabela.
- **Creme** (`#F2D2B4`): papel reservado — cor categórica exclusiva de Stories nos gráficos, e cor do texto de rótulo dentro do tooltip escuro dos gráficos.
- **Roxo Claro** (`#F1ECF8`): fundo de estado ativo/selecionado em botões de filtro e no hover das linhas de tabela — a versão "sussurrada" do roxo, para quando o roxo sólido seria forte demais.

### Semantic
- **Alerta** (`#B3261E`): reservado para avisos de qualidade de dado que exigem atenção forte (ex.: período com métricas degradadas pela Meta, comparação inválida) e mensagens de erro (login, formulários, falha de sincronização/upload). Usado sólido no texto/borda e a ~7–8% de opacidade como fundo do banner — nunca em botões ou navegação.
- **Aviso** (`#F0B429`, fundo `#FFF4E5`, texto `#7A4A00`): reservado para heads-up informativos que não são um erro — hoje só a nota de "períodos com quantidade de dias diferente" no Comparar. Sempre as três cores juntas (borda âmbar sólida, fundo âmbar pálido, texto marrom escuro para contraste); nunca misturado com o vermelho de Alerta, que continua reservado para problemas de qualidade de dado e erro real.

### Named Rules
**The Rare Signal Rule.** O roxo (`#754EA9` e seus tons) ocupa uma fração pequena de qualquer tela. Ele marca o que é ativo, selecionado ou digno de destaque — se aparecesse em toda parte, deixaria de significar alguma coisa. Confirmado deliberadamente: não expandir o uso do roxo em telas futuras sem decisão explícita.

## Typography

**Body/Interface Font:** Montserrat (com fallback `sans-serif`)
**Data Font:** JetBrains Mono (com fallback `monospace`)

**Character:** Montserrat carrega toda a voz de interface — leve nos pesos 300/400, assertiva no 700 — enquanto JetBrains Mono é reservado exclusivamente para números que representam dado real (métricas, datas, contagens). A dupla existe para que o olho nunca confunda "isto é um rótulo" com "isto é um número que importa".

### Hierarchy
- **Display** (700, 32px, monoespaçada, line-height 1): o valor grande de um KpiCard — o número que a tela quer que você veja primeiro. Subiu de 26px na revisão "bolder" pra abrir mais distância do resto da escala.
- **Stat** (700, 22px, monoespaçada): o número "de apoio" — menor que o Display mas ainda em destaque. Usado em saldo de seguidores, taxa de perda, projeção de tendência, resumo de testes.
- **Stat Small** (700, 16px, monoespaçada): um degrau abaixo do Stat, pra números secundários dentro de um card já aninhado (ex.: melhor/pior post dentro do acordeão da Visão Geral, média por formato na Estratégia) — evita empilhar um card com destaque total dentro de outro card.
- **Headline** (700, 17px, -0.01em, Montserrat): título de seção, sempre acompanhado do glifo "≠" à esquerda. Subiu de 15px pra marcar mais claramente onde cada tela/seção começa.
- **Subhead** (700, 13px, Montserrat): título de bloco dentro de um card (ex. "Tendência diária da conta", contadores de lista na tela de Testes) — mesmo tamanho da aba de navegação ativa, mas com papel diferente (título de conteúdo, não controle).
- **Title** (700/400, 13px, Montserrat): abas de navegação — 700 quando ativa, 400 quando inativa.
- **Body** (300/400, 12px, Montserrat): texto corrido, células de tabela, descrições de post. Deixado do tamanho que estava de propósito — o contraste da revisão "bolder" vem de esticar o topo da escala, não de mexer no meio.
- **Label** (700, 11px, letter-spacing 0.05em, caixa alta, cinza): rótulos acima de KPIs e de blocos — unificado em peso 700 (antes misturava 300/700 conforme o arquivo).
- **Micro** (700, 10px, letter-spacing 0.05em, caixa alta, cinza): cabeçalhos de coluna de tabela — o piso da escala; nenhum texto no app deve ficar abaixo de 10px.

### Named Rules
**The Digit Voice Rule.** Todo número que representa um dado (métrica, data, valor de gráfico) usa JetBrains Mono. Todo texto de interface (rótulo, botão, navegação, prosa) usa Montserrat. Nunca misturar as duas dentro da mesma função.

## Layout

Grade simples baseada em flexbox/CSS grid, sem sistema de colunas rígido. Padding de página: 28px 24px no desktop, reduzindo para 16px 12px abaixo de 760px (único breakpoint do sistema). Padrão de duas colunas recorrente (`1.2fr/1fr` ou `1fr/1fr`, gap de 20px) que colapsa para uma coluna única no mobile. Cabeçalho do dashboard é flexível: logo + navegação à esquerda/centro, seletor de período e ações à direita, empilhando verticalmente em telas estreitas. Tabelas têm rolagem horizontal própria (`overflow-x: auto`) em vez de quebrar o layout da página. Densidade moderada: espaçamento apertado dentro de um bloco (8–16px), generoso entre cards de um mesmo bloco (20–24px).

**Camada "section" (32px) e "major-section" (40px):** novas na revisão "bolder", usadas com moderação (1-2 vezes por tela) só pra separar blocos grandes já empilhados um do outro — ex. entre os acordeões da Estratégia, ou entre o bloco de KPIs e o acordeão de detalhamento na Visão Geral. Não substituem o espaçamento de 20-24px que já existia entre cards de um mesmo grupo; é uma camada acima, não uma inflação geral — o pedido era "mais respiro entre blocos", não "tudo mais espaçado".

## Elevation & Depth

Sistema plano em repouso — nenhum card, tabela ou botão tem sombra por padrão. Profundidade existe apenas como resposta a interação: um card sobe 2px e ganha uma sombra difusa suave ao passar o mouse, e sua borda esquenta para um tom de roxo. Fora isso, a separação de camadas é feita só por cor de fundo (papel branco sobre tela cinza-claro) e por borda fina de 1px — não por sombra.

### Shadow Vocabulary
- **Elevação de hover** (`box-shadow: 0 8px 24px rgba(35,35,35,0.07)`): único uso de sombra no sistema, disparado só no `:hover` de cards (classe `.baz-card`).

### Hover além de sombra (revisão "bolder")
Nem toda reação a hover precisa de sombra — a maioria dos elementos novos usa só cor/movimento, continuando "flat": linha de tabela em hover realça os números (classe `.baz-num`, fica `roxo-escuro`) além do tint de fundo que já existia; dia do calendário sem nota ganha tint `roxo-tint`, dia já marcado (preenchido roxo sólido) usa `scale(1.08)` em vez de mais cor, já que não dá pra escurecer mais sem virar uma área grande de roxo (ver Rare Signal Rule).

### Named Rules
**The Flat-At-Rest Rule.** Nenhum elemento tem sombra em seu estado padrão. Sombra é sempre uma resposta a uma ação do usuário (hover), nunca uma propriedade decorativa fixa.

## Shapes

Duas linguagens de forma coexistem, cada uma com um papel fixo:
- **Retângulos de canto suave** (`border-radius: 3–6px`) para contêineres e ações diretas: botões, campos de texto, cards, tabelas, o banner de aviso.
- **Pílulas** (`border-radius: 20px`) para controles de seleção: seletores de período, chips de filtro, o alternador Mês/Semana, badges de tipo de post.

Bordas são sempre finas (1px) exceto duas exceções deliberadas: a régua de 2px preta sob o cabeçalho de tabela (âncora visual mais forte que uma divisória comum) e a borda lateral de 3px colorida no KpiCard (funciona como indicador, não como moldura). Banners de aviso/erro (AvisoQualidade, notas de qualidade no Comparar/Testes/Baseline) usam borda fina de 1px na cor semântica ao redor de todo o card, nunca uma barra grossa de um lado só — a barra lateral grossa foi removida deliberadamente por ser um tique visual reconhecível de interface "gerada por IA", que não precisa pra comunicar o alerta (o fundo tintado já cumpre esse papel). O glifo "≠" da marca aparece em duas escalas: como marca d'água grande (130×130px, opacidade 3.5%, canto superior direito do cabeçalho — e, desde a "passada de artifícios", seu par no rodapé do dashboard, maior e um pouco mais opaco por ocupar mais área), e como glifo inline pequeno (13–22px) ao lado de títulos.

### Named Rules
**The Pill-Or-Rectangle Rule.** Se o elemento é algo em que o usuário clica para escolher/filtrar, é pílula. Se é algo que contém conteúdo, é retângulo de canto suave. Nunca misturar os dois papéis.

## Components

### Buttons
- **Shape:** retângulo de canto suave (3px).
- **Primary:** fundo `preto` (#232323), texto branco, padding 10px 16px, peso 700. Hover troca o fundo para `roxo-escuro` (#24174A); clique aplica `scale(0.97)`.
- **Secondary:** fundo transparente, borda de 1px `preto`, texto `preto`, peso 300. Hover preenche com `preto` e texto vira branco (inversão total).
- **Ghost (ação secundária de navegação, ex. "Sair"):** sem borda, texto `cinza`, peso 400 — a opção mais discreta do sistema. Duas variantes de hover, adicionadas na revisão "bolder" pra nenhuma ação secundária ficar sem resposta ao passar o mouse: `.baz-btn-ghost` escurece pra `roxo` (ação leve, ex. links de navegação); `.baz-btn-ghost-muted` escurece pra `preto` com sublinhado (ações de saída/edição/remoção — "Sair", "Editar", "Excluir", remover nota — nunca vermelho, que continua reservado só a erro/qualidade de dado).
- **Ícone sem texto (ex. setas do calendário anual):** classe `.baz-icon-btn` — fundo circular `roxo-tint` e texto `roxo` no hover, mesmo raciocínio do Ghost mas com uma área de toque redonda em vez de sublinhado.

### Chips / Badges
- **Filtro/segmentado (pílula, 20px):** inativo = transparente com borda `preto`; ativo = preenchido `preto` com texto branco, ou (em contexto de gráfico) preenchido `roxo-tint` com texto e borda `roxo`.
- **Badge de tipo de post:** texto e borda na cor categórica do tipo (Reels=roxo, Carrossel=roxo-escuro, Imagem=roxo claro `#B79ACB`, Story=creme), fundo transparente, pílula pequena (padding 2px 8px, fonte 10px peso 700).

### Cards / Containers
- **Corner Style:** 4px (cards de dado/gráfico/tabela) ou 6px (KpiCard, formulário de login) — o KpiCard é ligeiramente mais arredondado por ser a unidade "mais premium" da tela.
- **Background:** branco (`#FFFFFF`) sobre fundo de tela `#FAFAFA`.
- **Shadow Strategy:** nenhuma em repouso; ver Elevation & Depth.
- **Border:** 1px `linha`, exceto a barra lateral de 3px do KpiCard (cor do indicador, padrão roxo). Banners de alerta/aviso: 1px na cor semântica ao redor de todo o card (nunca só à esquerda).
- **Internal Padding:** 20px pros cards de apoio (tabela, gráfico); 20px 24px pro KpiCard — desde a revisão "bolder", o card mais importante da tela ganha um pouco mais de respiro que os cards de apoio, em vez de todos usarem o mesmo padding.

### Inputs / Fields
- **Style:** fundo branco, borda 1px `linha`, canto de 3px (texto) ou 20px (select/pílula).
- **Focus:** contorno de 2px `roxo` com 1px de offset — aplicado a inputs, selects, textareas e botões com `:focus-visible`.
- **Error:** texto em `erro` (#B3261E) abaixo do campo, sem alterar a borda do campo em si.

### Navigation
- **Estilo:** abas horizontais em tira com rolagem própria no mobile (sem quebra de linha). Aba ativa: peso 700, cor `preto`, sublinhado de 2px `roxo` que desliza da esquerda pra direita via `scaleX`. Aba inativa: peso 400, cor `cinza`, ganha cor `roxo` no hover.

### O Glifo "≠" (assinatura da marca)
Componente de marca recorrente, não decorativo: aparece como marca d'água grande e semi-invisível atrás do cabeçalho, e como glifo inline junto a `SectionTitle` e ao nome "BÁZICO" no topo. Sempre na cor `roxo`, nunca redesenhado ou substituído por outro símbolo.

### Accordion (seção recolhível)
Baseado em `<details>/<summary>` nativo — sem JavaScript extra, funciona com teclado (Tab + Enter/Espaço) por padrão. Visualmente é o mesmo cartão do resto do sistema (branco, borda de 1px, canto de 4px); o `SectionTitle` (ou um título equivalente) vira o gatilho clicável, com um glifo "›" à direita que gira 90° quando aberto. Usado para separar o que precisa de atenção imediata (fica sempre aberto/plano) do que é consulta ocasional (começa fechado). Exemplos: Média de referência, Projeção e tendências, Recomendação semanal por IA e os cartões de Seguidores/Horário/Contexto na Estratégia; cada teste no Calendário de testes. Dentro de um `<summary>`, use `<SectionTitle tight>` — a variante sem a margem inferior de 14px que o título carrega fora de um accordion (essa margem é inline e nenhuma classe CSS consegue sobrescrever; por isso existe a prop).

### Named Rules
**The One Section Open Rule.** Numa tela com várias seções empilhadas, no máximo uma fica aberta por padrão — a que representa a tarefa principal daquela tela (ex.: "Marcar conteúdo" na Estratégia). O resto começa fechado; um clique no título abre. Evita telas com informação demais visível de uma vez, sem esconder nenhuma função — tudo continua a um clique de distância.

## Do's and Don'ts

### Do:
- **Do** usar o Accordion (`<details>/<summary>`, classe `.baz-accordion`) pra seções de consulta ocasional; manter só a seção mais usada da tela aberta por padrão (The One Section Open Rule).
- **Do** manter o roxo raro — é o sinal em meio ao silêncio visual do resto da paleta (The Rare Signal Rule).
- **Do** usar JetBrains Mono para qualquer número que seja dado real, e Montserrat para tudo que é interface (The Digit Voice Rule).
- **Do** manter cards e superfícies planas em repouso; sombra só como resposta a hover (The Flat-At-Rest Rule).
- **Do** usar pílula (20px) só em controles de seleção/filtro, e retângulo (3–6px) só em contêineres e ações diretas (The Pill-Or-Rectangle Rule).
- **Do** tratar o glifo "≠" como assinatura de marca — reaproveitar nas mesmas duas escalas (marca d'água grande, glifo inline pequeno), nunca inventar um terceiro uso decorativo pra ele.

### Don't:
- **Don't** adicionar sombra em repouso a cards, botões ou tabelas — quebra a regra de "plano por padrão".
- **Don't** introduzir uma terceira família tipográfica; Montserrat e JetBrains Mono cobrem toda a interface.
- **Don't** usar o vermelho de alerta (`#B3261E`) fora de avisos de qualidade de dado e mensagens de erro — ele não é uma cor de ação. Use o âmbar de Aviso para heads-up que não são erro.
- **Don't** escrever a cor de alerta/aviso como literal hex no componente — sempre `C.erro` / `C.aviso` / `C.avisoFundo` / `C.avisoTexto` de `designTokens.ts`, para não voltar a ter cor solta fora do sistema.
- **Don't** expandir o uso do roxo para preenchimentos grandes de fundo ou botões — decisão explícita do Gustavo de manter o roxo raro.
