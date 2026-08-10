# Meu Planejamento Financeiro

Aplicação web para controle financeiro pessoal. Permite cadastrar rendas e gastos, aplicar modelos de divisão orçamentária (como o clássico 50-30-20), acompanhar a evolução dos gastos em um gráfico e exportar um relatório consolidado em PDF.

A documentação completa de requisitos funcionais, requisitos não funcionais e casos de uso está no arquivo **CLAUDE.md**, na raiz do repositório. Este README foca em como o projeto está organizado, como configurá-lo e como executá-lo.

## Sumário

- Sobre o projeto
- Tecnologias utilizadas
- Estrutura do projeto
- Pré-requisitos
- Configuração do ambiente
- Como executar
- Endpoints da API
- Modelo de dados
- Documentação complementar

## Sobre o projeto

O sistema é dividido em três telas principais:

**Tela inicial** (`index.html`): autenticação por e-mail e senha ou login com conta Google.

**Tela de cadastro** (`frontend/tela_cadastro`): criação de uma nova conta de usuário.

**Tela principal** (`frontend/tela_principal`): painel financeiro do usuário autenticado, onde é possível lançar rendas e gastos do mês corrente, escolher ou criar um modelo de planejamento orçamentário, visualizar um gráfico de gastos ao longo do tempo, alternar entre tema claro e escuro, gerenciar o perfil (troca de senha, exclusão de conta) e exportar um relatório em PDF de um mês específico ou de um intervalo de meses.

O backend expõe uma API REST em Node.js/Express que valida regras de negócio (por exemplo: a soma dos percentuais de um modelo deve fechar em 100%, e só é possível lançar informações do mês vigente ou do mês anterior, caso este ainda não tenha sido lançado) e persiste os dados em PostgreSQL.

## Tecnologias utilizadas

**Backend**: Node.js, Express, PostgreSQL (via `pg`), bcrypt (hash de senha), google-auth-library (validação do token do Google), dotenv, cors.

**Frontend**: HTML, CSS e JavaScript puros (sem framework), Google Identity Services (login com Google) e jsPDF (geração de PDF no navegador).

**Banco de dados**: PostgreSQL.

## Estrutura do projeto

```
.
├── CLAUDE.md                  Documentação de requisitos e casos de uso
├── README.md
├── index.html                 Tela inicial (login)
├── assets/                    Imagens e logo
├── backend/
│   ├── Node.js                Ponto de entrada da API Express
│   ├── db.js                  Configuração do pool de conexão com o PostgreSQL
│   ├── package.json
│   └── .env                   Variáveis de ambiente (não versionado)
├── db/
│   └── database.sql           Script de criação do schema do banco
└── frontend/
    ├── root.css                Variáveis e estilos globais (temas claro/escuro)
    ├── tela_cadastro/          Tela de cadastro de usuário
    ├── tela_inicial/           Tela de login (usada por index.html)
    └── tela_principal/         Painel financeiro do usuário
```

## Pré-requisitos

- Node.js (versão 18 ou superior recomendada)
- PostgreSQL instalado e em execução
- Uma credencial OAuth de Cliente Web no Google Cloud Console, caso deseje testar o login com Google

## Configuração do ambiente

**1. Instalar as dependências do backend**

```
cd backend
npm install
```

**2. Criar o banco de dados**

Crie um banco no PostgreSQL com o nome que você definirá em `DB_NAME` e execute o script de schema:

```
psql -U <seu_usuario> -d <nome_do_banco> -f db/database.sql
```

**3. Criar o arquivo `.env` dentro de `backend/`**

O `.env` não é versionado (está no `.gitignore`) porque contém credenciais. Crie o arquivo com as seguintes variáveis:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=<seu_usuario_postgres>
DB_PASSWORD=<sua_senha_postgres>
DB_NAME=<nome_do_banco>

PORT=3000

GOOGLE_CLIENT_ID=<client_id_do_google_oauth>
```

O `GOOGLE_CLIENT_ID` também precisa ser atualizado em `frontend/tela_inicial/botao_google.js`, já que o Google Identity Services roda no navegador e não tem acesso às variáveis de ambiente do servidor.

## Como executar

O Express serve tanto a API quanto os arquivos estáticos do frontend a partir da mesma porta. Basta iniciar o backend:

```
cd backend
npm start
```

Em seguida, acesse `http://localhost:3000` no navegador (ou a porta definida em `PORT`).

## Endpoints da API

Todas as rotas abaixo têm prefixo `/api`.

| Método | Rota | Descrição |
|---|---|---|
| POST | `/usuarios/cadastro` | Cria um novo usuário (nome, e-mail, senha) |
| POST | `/usuarios/login` | Autentica por e-mail e senha |
| POST | `/usuarios/login-google` | Autentica ou cadastra um usuário via token do Google |
| GET | `/modelos-orcamentarios?usuario_id=` | Lista os modelos padrão e os modelos personalizados do usuário |
| POST | `/modelos-orcamentarios` | Cria um novo modelo de planejamento orçamentário |
| GET | `/usuarios/:id/modelo-ativo` | Retorna o modelo de planejamento ativo do usuário |
| PUT | `/usuarios/:id/modelo-ativo` | Define o modelo de planejamento ativo do usuário |
| GET | `/usuarios/:id/lancamentos?ano=&mes=` | Lista as rendas e gastos lançados em um mês |
| GET | `/usuarios/:id/ultimo-mes` | Retorna o último mês em que houve lançamentos |
| GET | `/usuarios/:id/mes-editavel` | Retorna qual mês ainda pode receber novos lançamentos |
| POST | `/usuarios/:id/lancamentos` | Cria um lançamento (renda, gasto necessário, desejo ou investimento) |
| DELETE | `/lancamentos/:id` | Remove um lançamento |
| PUT | `/usuarios/:id/senha` | Altera a senha do usuário |
| DELETE | `/usuarios/:id` | Exclui a conta do usuário |

## Modelo de dados

**usuario**: dados de login e o modelo de planejamento ativo (`modelo_ativo_id`).

**modelos_orcamentarios**: modelos de divisão percentual do orçamento (necessidades, desejos, investimentos), podendo ser globais (`usuario_id` nulo, como os modelos 50-30-20, 60-30-10 e 40-30-30 pré-cadastrados) ou específicos de um usuário.

**lancamento_mensal**: rendas e gastos de um usuário em um determinado mês/ano, com suporte a lançamentos parcelados (`parcela_atual` / `parcela_total`).

## Documentação complementar

Para a lista completa de requisitos funcionais, requisitos não funcionais e os fluxos detalhados de cada caso de uso (autenticação, cadastro de transação, configuração de planejamento, visualização de gastos e exportação em PDF), consulte o arquivo **CLAUDE.md**.
