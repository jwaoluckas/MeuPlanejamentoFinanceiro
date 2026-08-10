# Meu Planejamento Financeiro — Documentação

## Requisitos Funcionais

| Prioridade | ID | Nome | Descrição |
|---|---|---|---|
| ALTA | RF01 | Login do Usuário | O sistema deve permitir que o usuário faça autenticação através de e-mail e senha. |
| MÉDIA | RF02 | Login com Google | O sistema deve permitir que o usuário faça autenticação através da sua conta Google. |
| ALTA | RF03 | Identificar Renda | O sistema deve permitir que o usuário cadastre, edite e remova fontes de renda (ex: salário, trabalhos freelancer, investimentos, etc.). |
| ALTA | RF04 | Identificar Gastos | O sistema deve permitir que o usuário cadastre, edite e remova despesas diárias/recorrentes associadas a categorias. |
| ALTA | RF05 | Dividir e Planejar Gastos | O sistema deve permitir que o usuário selecione modelos pré-definidos de distribuição orçamentária (ex: 50-30-20, 60-30-10). |
| MÉDIA | RF06 | Criar Novos Planejamentos Financeiros | O sistema deve permitir que o usuário crie e personalize regras customizadas de divisão percentual do orçamento. |
| MÉDIA | RF07 | Visualização de Gastos em Tabela | O sistema deve exibir os gastos do usuário em formato de tabela, permitindo a filtragem por períodos de tempo (semanal, mensal, semestral, anual ou intervalo personalizado). |
| BAIXA | RF08 | Exportar em PDF | O sistema deve permitir que o usuário exporte o relatório consolidado do seu planejamento e histórico de gastos em formato PDF. |

## Requisitos Não Funcionais

| Prioridade | ID | Nome | Descrição |
|---|---|---|---|
| MÉDIA | RNF01 | Modo Dark e Light | O sistema deve suportar alternância entre temas visuais claro (Light) e escuro (Dark). |
| BAIXA | RNF02 | Implementação de Temas | O sistema poderá permitir que o usuário escolha temas de cores secundários para a interface. |
| ALTA | RNF03 | Responsividade Desktop/Mobile | A interface do sistema deve ser adaptável e otimizada para uso tanto em navegadores Desktop quanto em telas de dispositivos móveis. |
| MÉDIA | RNF04 | Acessibilidade | O sistema deve seguir boas práticas de acessibilidade (como contraste adequado de cores e suporte a leitores de tela). |

## Casos de Uso

### UC01 — Autenticação de Usuário

**Ator:** Usuário

**Descrição**
O usuário realiza o acesso ao sistema utilizando e-mail e senha cadastrados ou autenticação via conta Google.

**Pré-condições**
1. O usuário deve estar na tela inicial/login do sistema.

**Fluxo Principal**
1. O usuário escolhe a forma de login: inserindo e-mail e senha ou clicando em "Entrar com o Google".
2. Caso opte por e-mail e senha, o usuário preenche os campos e clica em "Entrar".
3. O sistema valida as credenciais informadas (ou valida o token retornado pelo Google).
4. O sistema gera a sessão do usuário e redireciona para o dashboard principal.

**Fluxo Alternativo**
[Passo 3 — Credenciais ou Tokens inválidos]
1. O sistema identifica que a senha está incorreta ou o e-mail não existe (ou falha no login Google).
2. O sistema exibe uma mensagem de erro: "E-mail ou senha inválidos".
3. O usuário permanece na tela de login para tentar novamente.

**Pós-condições**
1. O usuário obtém acesso autenticado e sua sessão é mantida ativa via token.

### UC02 — Cadastrar Transação

**Ator:** Usuário

**Descrição**
O usuário cadastra uma nova fonte de renda (receita) ou um novo gasto (despesa) indicando valor, categoria e data.

**Pré-condições**
1. O usuário deve estar autenticado no sistema.

**Fluxo Principal**
1. O usuário clica no botão "Criar planejamento".
2. O sistema exibe o formulário de cadastro e solicita a origem da receita, as despesas, valor, categoria, descrição e data.
3. O usuário preenche os dados solicitados e clica em "Salvar".
4. O sistema valida se os campos obrigatórios foram preenchidos corretamente.
5. O sistema registra a transação no banco de dados e atualiza o saldo total do usuário.

**Fluxo Alternativo**
[Passo 4 — Campo obrigatório em branco ou valor inválido]
1. O sistema identifica que o campo "Valor" está zerado/negativo ou a "Categoria" não foi selecionada.
2. O sistema exibe um alerta nos campos pendentes.
3. O usuário corrige a informação e clica em "Salvar" novamente.

**Pós-condições**
1. A renda ou despesa é contabilizada no banco de dados e passa a compor os resumos financeiros do usuário.

### UC03 — Configurar e Aplicar Planejamento Financeiro

**Ator:** Usuário

**Descrição**
O usuário seleciona uma regra de divisão financeira pré-definida (ex: 50-30-20) ou cria um novo modelo personalizado de divisão percentual.

**Pré-condições**
1. O usuário deve estar autenticado no sistema.

**Fluxo Principal**
1. O usuário acessa a seção "Planejamento Financeiro".
2. O sistema exibe os modelos cadastrados (ex: 50-30-20, 60-30-10) e a opção de "Criar Novo Planejamento".
3. O usuário seleciona um modelo pré-definido da lista.
4. O usuário clica em "Aplicar ao meu Orçamento".
5. O sistema calcula a distribuição do orçamento com base no total de rendas cadastradas no UC02 e salva a regra como ativa.

**Fluxo Alternativo**
[Passo 3 — Criar modelo personalizado de planejamento]
1. O usuário clica em "Criar Novo Planejamento".
2. O sistema exibe campos para nomear a regra e definir as porcentagens de distribuição (ex: Necessidades, Investimentos, Lazer).
3. O usuário preenche os percentuais desejados e clica em "Salvar e Aplicar".
4. O sistema verifica se a soma dos percentuais é igual a 100%.
5. O sistema salva o novo modelo e o fluxo retorna ao passo 5 do Fluxo Principal (isto é, ao passo "O usuário clica em 'Aplicar ao meu Orçamento'").

[Passo 4 — Soma das porcentagens diferente de 100%]
1. O sistema identifica que a soma das porcentagens difere de 100% (ex: 40 + 40 + 30 = 110%).
2. O sistema avisa o usuário que a soma das categorias deve fechar exatamente em 100%.
3. O usuário ajusta os valores e tenta salvar novamente.

**Pós-condições**
1. O plano financeiro do usuário fica atualizado com as metas percentuais estabelecidas.

### UC04 — Visualizar Tabela de Gastos por Período

**Ator:** Usuário

**Descrição**
O usuário consulta as suas transações de gastos organizadas em formato de tabela, podendo filtrar o histórico por prazos específicos.

**Pré-condições**
1. O usuário deve estar autenticado no sistema.

**Fluxo Principal**
1. O usuário navega até a aba "Histórico / Tabela de Gastos".
2. O sistema carrega e exibe a tabela com as transações referentes ao mês atual por padrão.
3. O usuário escolhe um filtro de tempo desejado (semanal, mensal, semestral, anual ou intervalo de datas customizado).
4. O sistema busca no banco de dados apenas os lançamentos que correspondem ao período selecionado.
5. O sistema atualiza a tabela e exibe o somatório total de gastos daquele intervalo.

**Fluxo Alternativo**
[Passo 4 — Sem registro no período selecionado]
1. O sistema identifica que não há lançamentos para o intervalo de datas filtrado.
2. O sistema exibe uma mensagem indicando: "Nenhum gasto encontrado para este período".
3. A tabela permanece vazia aguardando uma nova seleção de filtro pelo usuário.

**Pós-condições**
1. O usuário obtém a visão detalhada e o somatório dos seus gastos no período especificado.

### UC05 — Exportar Planejamento Financeiro em PDF

**Ator:** Usuário

**Descrição**
O usuário exporta um relatório consolidado contendo as rendas, o planejamento financeiro ativo e a lista de gastos em formato PDF.

**Pré-condições**
1. O usuário deve estar autenticado no sistema.
2. O usuário deve ter ao menos uma transação ou planejamento configurado no sistema.

**Fluxo Principal**
1. O usuário acessa a tela de visualização do planejamento ou relatórios.
2. O usuário clica no botão "Exportar em PDF".
3. O sistema compila os dados do orçamento ativo, total de rendas e o detalhamento de gastos.
4. O sistema renderiza o layout da documentação e gera o arquivo PDF no lado do cliente.
5. O sistema dispara o download do arquivo PDF para a pasta padrão do dispositivo do usuário.

**Fluxo Alternativo**
[Passo 2 — Ausência de dados para exportação]
1. O usuário clica em "Exportar em PDF", mas não possui nenhuma renda ou gasto cadastrado.
2. O sistema exibe um aviso informando que é necessário ter lançamentos cadastrados antes de exportar o documento.
3. O download é interrompido.

**Pós-condições**
1. O arquivo PDF é baixado e salvo localmente no dispositivo do usuário.
