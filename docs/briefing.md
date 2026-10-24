# App Enxoval Montessori — briefing para desenvolvimento

> Documento de decisões do projeto "Especialista Montessori". Este briefing vai para o chat do Claude Code que vai programar o app.
> A carga inicial dos itens está em `enxoval_seed.json`, que acompanha este arquivo.

## 1. Objetivo
Um site/app para Filipe e Ana acompanharem tudo o que falta **comprar, fazer em casa (DIY), ajustar na casa e resolver** antes e depois da chegada da bebê. As escolhas seguem a abordagem Montessori, baseada principalmente em *O Bebê Montessori* (Simone Davies e Junnifa Uzodike).

## 2. Funcionalidades decididas
1. **Lista de itens** com status: `Pendente` → `Em andamento` → `Feito` (mais `Decidido` para os itens de "Não comprar") (check rápido para marcar como feito).
2. **Links de compra**: vários links por item, cada um com rótulo opcional (loja) e preço.
3. **Preço**: campo de preço estimado ou real, mais a faixa de investimento (`$`, `$$`, `$$$`).
4. **Filtros** combináveis por categoria, tipo, status, faixa de investimento, fase e prioridade.
5. **Ordenação** por preço (crescente e decrescente), prioridade e fase.
6. **Criar, editar e excluir itens** livremente. Isso inclui ajustes da casa que vão sendo adicionados (pintar parede, montar prateleiras etc.).
7. **Progresso**: percentual concluído no geral e por categoria, e total gasto vs. total estimado.
8. **Fonte/nota**: cada item mostra a citação da fonte Montessori e uma observação.

## 3. Modelo de dados (item)
| Campo | Tipo | Valores |
|---|---|---|
| id | número | — |
| nome | texto | — |
| categoria | lista editável | Roupas · Troca e higiene · Banho · Saúde e cuidados · Sono · Amamentação e alimentação · Área de movimento e materiais · Passeio e transporte · Maternidade · Casa – segurança · Casa – ajustes · Não comprar |
| tipo | lista | Comprar · Fazer em casa · Ajuste da casa · Tarefa · Não comprar |
| fase | lista | Antes do nascimento · 0–3 meses · 3–6 meses · 6–12 meses · 12+ meses |
| prioridade | lista | Essencial · Recomendado · Opcional |
| faixa_investimento | lista | `$` (até ~R$100) · `$$` (~R$100–500) · `$$$` (acima de ~R$500) · `—` (sem custo) |
| quantidade | texto | ex.: "6–8 (RN e P)" |
| preco_estimado | número (R$) | preenchido pelo usuário |
| links | lista de {url, loja, preco} | — |
| status | lista | Pendente · Em andamento · Feito · Decidido |
| fonte | texto | citação (livro + página) ou "Básico" |
| nota | texto | — |

As faixas de investimento do seed são **estimativas iniciais**. Os preços reais entram via campo `preco_estimado` e links.

## 4. Decisões de arquitetura
- **Uso compartilhado:** Filipe e Ana usam o app cada um no seu celular, com os mesmos dados sincronizados. Precisa de banco de dados, login para duas pessoas e boa experiência no celular.
- **Hospedagem:** o front-end fica no **GitHub Pages** (repositório na conta FiSeveroo). Como o GitHub Pages só serve arquivos estáticos, os dados compartilhados e o login precisam de um serviço externo com plano gratuito. Sugestão: **Supabase** (Postgres + autenticação, acessado direto do navegador). A escolha final da stack fica com o chat de desenvolvimento, respeitando: app web responsivo, dados sincronizados entre os dois, custo zero ou baixo, e nenhuma chave secreta exposta no repositório público.
- Registrar em cada item quem o marcou como feito e quando (útil para duas pessoas).

## 5. Seção "Não comprar"
Os itens que as fontes desaconselham ficam **dentro do app**, com tipo e categoria `Não comprar` e status `Decidido`. Eles servem de referência para responder a presentes e sugestões. O casal pode **adicionar, editar ou remover** itens dessa lista e **mover um item entre "Não comprar" e a lista ativa**, caso mude de ideia. Esses itens ficam fora do cálculo de progresso e de gastos. O seed já traz 10 itens nessa seção (berço com grades, cercadinho, andador, cadeirão com bandeja etc.).

## 6. Catálogo inicial (100 itens: 90 ativos + 10 "Não comprar")

### Roupas

| Item | Tipo | Fase | Prioridade | Faixa | Qtd | Fonte | Nota |
|---|---|---|---|---|---|---|---|
| Body manga longa com abertura frontal (transpassado), algodão | Comprar | Antes do nascimento | Essencial | $$ | 6–8 (RN e P) | O Bebê Montessori, p. 60 | Fibra natural, sem passar pela cabeça, sem colchetes duros |
| Body manga curta com abertura frontal, algodão | Comprar | Antes do nascimento | Essencial | $ | 4–6 | O Bebê Montessori, p. 60 |  |
| Macacão com abertura frontal, algodão | Comprar | Antes do nascimento | Essencial | $$ | 4–6 | O Bebê Montessori, p. 60 e 135 | Nem justo nem largo; checar posição de botões/zíper (bebê passa muito tempo deitado) |
| Calça/mijão de algodão | Comprar | Antes do nascimento | Recomendado | $ | 4 | Básico |  |
| Casaquinho com abertura frontal | Comprar | Antes do nascimento | Recomendado | $ | 2–3 | O Bebê Montessori, p. 60 |  |
| Meias de algodão | Comprar | Antes do nascimento | Recomendado | $ | 4 pares | Básico | Tirar sempre que possível — pés livres (p. 135) |
| Touca de algodão | Comprar | Antes do nascimento | Recomendado | $ | 1–2 | Básico | Para os primeiros dias / maternidade |
| Mantas de algodão macias | Comprar | Antes do nascimento | Essencial | $ | 3 | O Bebê Montessori, p. 60 e 78 | Para o bebê ficar sem fralda deitado e para passeios |
| Cueiro leve (opcional, sempre frouxo) | Comprar | Antes do nascimento | Opcional | $ | 1–2 | O Bebê Montessori, p. 135 | Cueiros restringem movimentos e reflexos; se usar, deixar frouxo |
| Shorts e roupas que deixem joelhos livres | Comprar | 6–12 meses | Recomendado | $ | — | O Bebê Montessori, p. 135 | Para a fase de arrastar/engatinhar |
| Meias antiderrapantes | Comprar | 6–12 meses | Opcional | $ | 2–3 pares | O Bebê Montessori, p. 135 | Preferir descalço |
| Cesto de roupa suja baixo | Comprar | 3–6 meses | Opcional | $ | 1 | O Bebê Montessori, p. 94 | A criança aprende a pôr a roupa suja no cesto |
| Lavar todas as roupas do bebê antes do nascimento | Tarefa | Antes do nascimento | Essencial | — | — | O Bebê Montessori, p. 53 |  |

### Troca e higiene

| Item | Tipo | Fase | Prioridade | Faixa | Qtd | Fonte | Nota |
|---|---|---|---|---|---|---|---|
| Fraldas de pano (kit) ou fraldas descartáveis RN/P | Comprar | Antes do nascimento | Essencial | $$ | — | O Bebê Montessori, p. 60 | Livro prefere pano (macias, bebê sente a umidade, ajuda no desfralde). Se descartável, deixar o bebê sem fralda bastante tempo |
| Trocador (almofada/colchonete) | Comprar | Antes do nascimento | Essencial | $$ | 1 | O Bebê Montessori, p. 77 | Pode ficar no chão ou sobre cômoda na altura do quadril |
| Cesta organizadora para itens de troca | Comprar | Antes do nascimento | Recomendado | $ | 1 | O Bebê Montessori, p. 77 | Tudo à mão: fraldas, panos, lencinhos, pomada |
| Panos/fraldinhas de boca de algodão | Comprar | Antes do nascimento | Essencial | $ | 8–10 | O Bebê Montessori, p. 77 |  |
| Lenços umedecidos / algodão | Comprar | Antes do nascimento | Essencial | $ | — | O Bebê Montessori, p. 77 |  |
| Pomada para assaduras | Comprar | Antes do nascimento | Essencial | $ | 1 | O Bebê Montessori, p. 77 | Confirmar marca com a pediatra |
| Lixeira com tampa para fraldas sujas | Comprar | Antes do nascimento | Essencial | $ | 1 | O Bebê Montessori, p. 77 |  |
| Banquinho baixo de madeira (troca de roupa sentado) | Comprar | 6–12 meses | Recomendado | $ | 1 | O Bebê Montessori, p. 77 | A partir de ~9 meses |
| Penico | Comprar | 12+ meses | Opcional | $ | 1 | O Bebê Montessori, p. 77 | Seguir o ritmo da criança |

### Banho

| Item | Tipo | Fase | Prioridade | Faixa | Qtd | Fonte | Nota |
|---|---|---|---|---|---|---|---|
| Banheira (ou alternativa simples) | Comprar | Antes do nascimento | Recomendado | $$ | 1 | Básico — ver O Bebê Montessori, p. 68 | Livro lista banheira entre itens de consumo; decidir modelo simples |
| Toalhas macias com capuz | Comprar | Antes do nascimento | Essencial | $ | 3 | Básico |  |
| Sabonete líquido neutro infantil | Comprar | Antes do nascimento | Essencial | $ | 1 | Básico | Confirmar com a pediatra |
| Escova de cabelo macia | Comprar | Antes do nascimento | Opcional | $ | 1 | Básico |  |

### Saúde e cuidados

| Item | Tipo | Fase | Prioridade | Faixa | Qtd | Fonte | Nota |
|---|---|---|---|---|---|---|---|
| Termômetro digital | Comprar | Antes do nascimento | Essencial | $ | 1 | Básico |  |
| Cortador/tesoura de unha infantil ou lixa | Comprar | Antes do nascimento | Essencial | $ | 1 | Básico |  |
| Aspirador nasal + soro fisiológico | Comprar | Antes do nascimento | Essencial | $ | 1 | Básico |  |
| Itens para cuidado do coto umbilical | Comprar | Antes do nascimento | Essencial | $ | — | Básico | Seguir orientação da maternidade/pediatra |
| Kit de primeiros socorros | Comprar | Antes do nascimento | Recomendado | $ | 1 | Básico |  |
| Definir pediatra e salvar contatos | Tarefa | Antes do nascimento | Essencial | — | — | Básico |  |

### Sono

| Item | Tipo | Fase | Prioridade | Faixa | Qtd | Fonte | Nota |
|---|---|---|---|---|---|---|---|
| Moisés/cestinho | Comprar | Antes do nascimento | Essencial | $$ | 1 | O Bebê Montessori, p. 76 e 81 | No quarto dos pais por pelo menos 6 meses (diretriz SMSI); pode ir sobre o colchão do chão |
| Colchão da cama no chão (~15 cm) | Comprar | 0–3 meses | Essencial | $$ | 1 | O Bebê Montessori, p. 76 e 156 | Alternativa montessoriana ao berço; desde o nascimento ou a partir dos 3 meses |
| Armação baixa/estrado para a cama no chão | Comprar | 3–6 meses | Opcional | $$ | 1 | O Bebê Montessori, p. 76 |  |
| Lençóis com elástico para o moisés | Comprar | Antes do nascimento | Essencial | $ | 3 | Básico |  |
| Lençóis com elástico para o colchão do chão | Comprar | 0–3 meses | Essencial | $ | 3 | Básico |  |
| Superfície macia ao lado da cama no chão | Comprar | 3–6 meses | Recomendado | $ | 1 | O Bebê Montessori, p. 76 | Caso ela role para fora |
| Cortina blackout no quarto | Comprar | Antes do nascimento | Recomendado | $$ | 1 | Básico |  |
| Luz noturna suave | Comprar | Antes do nascimento | Recomendado | $ | 1 | O Bebê Montessori, p. 57 | Iluminação suave nos primeiros dias |
| Chupeta (decidir se usar) | Comprar | Antes do nascimento | Opcional | $ | 1–2 | O Bebê Montessori, p. 81 e 141 | Pode reduzir risco de SMSI no sono, mas atrapalha a linguagem se usada sempre |
| Babá eletrônica | Comprar | 3–6 meses | Opcional | $$ | 1 | Básico |  |

### Amamentação e alimentação

| Item | Tipo | Fase | Prioridade | Faixa | Qtd | Fonte | Nota |
|---|---|---|---|---|---|---|---|
| Poltrona ou cadeira confortável para amamentar | Comprar | Antes do nascimento | Recomendado | $$$ | 1 | O Bebê Montessori, p. 78 | Uma cadeira comum já serve |
| Mesinha de apoio (água, lencinhos) | Comprar | Antes do nascimento | Recomendado | $ | 1 | O Bebê Montessori, p. 78 |  |
| Sutiãs de amamentação e absorventes de seio | Comprar | Antes do nascimento | Essencial | $$ | — | Básico | Para a Ana |
| Almofada de amamentação (simples) | Comprar | Antes do nascimento | Opcional | $$ | 1 | O Bebê Montessori, p. 68 | Livro critica as 'luxuosas' |
| Bomba tira-leite | Comprar | 0–3 meses | Opcional | $$ | 1 | Básico |  |
| Deixar refeições congeladas prontas | Tarefa | Antes do nascimento | Recomendado | — | — | O Bebê Montessori, p. 58 |  |
| Mesa e cadeira baixas (pés no chão) | Comprar | 6–12 meses | Recomendado | $$ | 1 conjunto | O Bebê Montessori, p. 75 | Também serve de apoio para levantar |
| Cadeira alta sem bandeja, com cinto | Comprar | 6–12 meses | Opcional | $$$ | 1 | O Bebê Montessori, p. 75–76 | Para comer à mesa com a família |
| Pratos, tigela, copo pequeno e talheres | Comprar | 6–12 meses | Recomendado | $ | — | O Bebê Montessori, p. 75 | Guardar em gaveta/armário baixo |

### Área de movimento e materiais

| Item | Tipo | Fase | Prioridade | Faixa | Qtd | Fonte | Nota |
|---|---|---|---|---|---|---|---|
| Topponcino | Fazer em casa | Antes do nascimento | Essencial | $ | 1–2 | O Bebê Montessori, p. 57 | Moldes em workman.com/montessori. Usar para colo/transferência, não deixar no sono |
| Tapete/colchonete fino para movimentos | Comprar | 0–3 meses | Essencial | $$ | 1 | O Bebê Montessori, p. 60 e 74 | Sem travesseiros em cima |
| Espelho baixo horizontal (seguro/acrílico) | Comprar | 0–3 meses | Essencial | $$ | 1 | O Bebê Montessori, p. 75 |  |
| Estrutura de madeira ou gancho para móbile | Comprar | 0–3 meses | Essencial | $$ | 1 | O Bebê Montessori, p. 75 | Nunca acima da cama (p. 76) |
| Móbile Munari (preto e branco) | Fazer em casa | 0–3 meses | Essencial | $ | 1 | O Bebê Montessori, p. 159 | Primeiro móbile |
| Móbile de octaedros | Fazer em casa | 0–3 meses | Recomendado | $ | 1 | O Bebê Montessori, p. 161 |  |
| Móbile Gobbi | Fazer em casa | 0–3 meses | Recomendado | $ | 1 | O Bebê Montessori, p. 161 |  |
| Móbile dos dançarinos | Fazer em casa | 0–3 meses | Recomendado | $ | 1 | O Bebê Montessori, p. 161 |  |
| Ganchos de parede para guardar móbiles | Comprar | 0–3 meses | Opcional | $ | 3–4 | O Bebê Montessori, p. 74 |  |
| Caixinha de música | Comprar | 0–3 meses | Opcional | $ | 1 | O Bebê Montessori, p. 60 |  |
| Chocalhos leves (pequenos, materiais variados) | Comprar | 0–3 meses | Recomendado | $ | 2–3 | O Bebê Montessori, p. 158 |  |
| Prateleira baixa para atividades (até 6 itens) | Comprar | 3–6 meses | Essencial | $$ | 1 | O Bebê Montessori, p. 71 e 77 |  |
| Cesta com 5–6 livros de papelão | Comprar | 3–6 meses | Recomendado | $$ | 1 | O Bebê Montessori, p. 75 |  |
| Quadros com imagens realistas na altura do bebê | Comprar | 0–3 meses | Recomendado | $ | 2–4 | O Bebê Montessori, p. 75 e 78 | Animais, natureza, fotos da família |
| Barra horizontal de apoio com espelho | Comprar | 6–12 meses | Opcional | $$ | 1 | O Bebê Montessori, p. 75 |  |

### Passeio e transporte

| Item | Tipo | Fase | Prioridade | Faixa | Qtd | Fonte | Nota |
|---|---|---|---|---|---|---|---|
| Bebê conforto | Comprar | Antes do nascimento | Essencial | $$$ | 1 | Básico | Obrigatório para sair da maternidade de carro |
| Instalar e testar o bebê conforto no carro | Tarefa | Antes do nascimento | Essencial | — | — | Básico |  |
| Carrinho | Comprar | 0–3 meses | Recomendado | $$$ | 1 | Básico — ver O Bebê Montessori, p. 68 e 155 | Um só; evitar longos períodos no carrinho |
| Sling/carregador ergonômico | Comprar | Antes do nascimento | Recomendado | $$ | 1 | O Bebê Montessori, p. 78 | Até 3 meses virado para os pais |
| Bolsa de bebê/troca | Comprar | Antes do nascimento | Essencial | $$ | 1 | Básico |  |
| Manta de piquenique para passeios | Comprar | 0–3 meses | Opcional | $ | 1 | O Bebê Montessori, p. 78 |  |

### Maternidade

| Item | Tipo | Fase | Prioridade | Faixa | Qtd | Fonte | Nota |
|---|---|---|---|---|---|---|---|
| Mala da bebê para a maternidade | Tarefa | Antes do nascimento | Essencial | — | 1 | Básico | Conferir lista da maternidade |
| Mala da Ana para a maternidade | Tarefa | Antes do nascimento | Essencial | — | 1 | Básico |  |
| Separar documentos para a maternidade | Tarefa | Antes do nascimento | Essencial | — | — | Básico |  |

### Casa – segurança

| Item | Tipo | Fase | Prioridade | Faixa | Qtd | Fonte | Nota |
|---|---|---|---|---|---|---|---|
| Trancar produtos de limpeza / travas de armário | Ajuste da casa | 3–6 meses | Essencial | $ | — | O Bebê Montessori, p. 71 |  |
| Prender cordões de cortina fora do alcance | Ajuste da casa | 3–6 meses | Essencial | $ | — | O Bebê Montessori, p. 71 |  |
| Canaletas para cabos elétricos | Ajuste da casa | 3–6 meses | Essencial | $ | — | O Bebê Montessori, p. 71 |  |
| Fixar prateleiras e móveis na parede | Ajuste da casa | 3–6 meses | Essencial | $ | — | O Bebê Montessori, p. 71 |  |
| Travas/redes de proteção nas janelas | Ajuste da casa | 3–6 meses | Essencial | $$ | — | O Bebê Montessori, p. 71 |  |
| Protetores de tomada | Ajuste da casa | 3–6 meses | Essencial | $ | — | Básico |  |
| Portão de escada (se houver) | Ajuste da casa | 6–12 meses | Opcional | $$ | — | O Bebê Montessori, p. 71 |  |
| Montar um 'espaço liberado' seguro na sala | Ajuste da casa | 3–6 meses | Essencial | — | — | O Bebê Montessori, p. 70–71 |  |

### Casa – ajustes

| Item | Tipo | Fase | Prioridade | Faixa | Qtd | Fonte | Nota |
|---|---|---|---|---|---|---|---|
| Montar prateleira baixa com roupas visíveis no quarto | Ajuste da casa | Antes do nascimento | Recomendado | $$ | — | O Bebê Montessori, p. 100 |  |
| Instalar ganchos baixos na entrada | Ajuste da casa | 6–12 meses | Opcional | $ | — | O Bebê Montessori, p. 74 |  |
| Fixar espelho baixo na área de movimento | Ajuste da casa | 0–3 meses | Essencial | — | — | O Bebê Montessori, p. 75 |  |
| Instalar gancho/estrutura do móbile | Ajuste da casa | 0–3 meses | Essencial | — | — | O Bebê Montessori, p. 75 |  |
| Montar a cama no chão no quarto | Ajuste da casa | 0–3 meses | Essencial | — | — | O Bebê Montessori, p. 76 |  |
| Organizar cantinho de amamentação | Ajuste da casa | Antes do nascimento | Recomendado | — | — | O Bebê Montessori, p. 78 |  |
| Pendurar quadros na altura do bebê | Ajuste da casa | 0–3 meses | Recomendado | — | — | O Bebê Montessori, p. 78 |  |

### Não comprar

| Item | Tipo | Fase | Prioridade | Faixa | Qtd | Fonte | Nota |
|---|---|---|---|---|---|---|---|
| Berço com grades | Não comprar | — | — | — | — | O Bebê Montessori, p. 71 | Grades restringem movimentos e a visão do espaço; alternativa: cama no chão |
| Cercadinho | Não comprar | — | — | — | — | O Bebê Montessori, p. 71 | Preferir um 'espaço liberado' seguro |
| Cadeirinha de balanço | Não comprar | — | — | — | — | O Bebê Montessori, p. 74 | Restringe a livre movimentação; preferir o tapete de movimento |
| Andador, jumper ou exersaucer | Não comprar | — | — | — | — | O Bebê Montessori, p. 155 | Pressionam os quadris e atrapalham o controle dos movimentos |
| Cadeirão tradicional com bandeja | Não comprar | — | — | — | — | O Bebê Montessori, p. 75 | Preferir cadeira alta sem bandeja ou mesa e cadeira baixas |
| Tapete de EVA colorido | Não comprar | — | — | — | — | O Bebê Montessori, p. 75 | Faz tropeçar e aumenta o ruído visual |
| Sapatos/tênis para bebê engatinhar | Não comprar | — | — | — | — | O Bebê Montessori, p. 135 | Preferir descalço ou meia antiderrapante |
| Móbile com pilha, música ou personagens | Não comprar | — | — | — | — | O Bebê Montessori, p. 161 | Móbiles leves, movidos pelo ar, sem personagens |
| Segundo/terceiro carrinho e itens 'luxuosos' | Não comprar | — | — | — | — | O Bebê Montessori, p. 68 | Menos é mais |
| Luvinhas | Não comprar | — | — | — | — | O Bebê Montessori, p. 60 | Mãos descobertas para levá-las à boca |