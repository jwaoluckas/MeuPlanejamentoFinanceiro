# Meu Planejamento Financeiro

🔗 Acesse o site: [meuplanejamentofinanceiro.dev.br](https://www.meuplanejamentofinanceiro.dev.br)

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

O sistema é dividido em cinco telas principais:

**Tela inicial** (`index.html`): autenticação por e-mail e senha, com acesso ao fluxo de recuperação de senha.

**Tela de cadastro** (`frontend/tela_cadastro`): criação de uma nova conta de usuário.

**Tela de confirmação de e-mail** (`frontend/tela_confirmar_email`): exibida após o cadastro para que o usuário informe o código de confirmação enviado por e-mail; só depois disso a conta é efetivamente criada.

**Tela de esqueci minha senha** (`frontend/tela_esqueci_minha_senha`): solicitação do código de redefinição de senha e definição de uma nova senha a partir desse código.

**Tela principal** (`frontend/tela_principal`): painel financeiro do usuário autenticado, onde é possível lançar rendas e gastos do mês corrente, escolher ou criar um modelo de planejamento orçamentário, visualizar um gráfico de gastos ao longo do tempo, alternar entre tema claro e escuro, gerenciar o perfil (troca de senha, exclusão de conta) e exportar um relatório em PDF de um mês específico ou de um intervalo de meses.

O backend expõe uma API REST em Node.js/Express que valida regras de negócio (por exemplo: a soma dos percentuais de um modelo deve fechar em 100%, e só é possível lançar informações do mês vigente ou do mês anterior, caso este ainda não tenha sido lançado) e persiste os dados em PostgreSQL.

## Tecnologias utilizadas

**Backend**: Node.js, Express, PostgreSQL (via `pg`), bcrypt (hash de senha), nodemailer (envio de e-mails de confirmação de cadastro e redefinição de senha), dotenv, cors.

**Frontend**: HTML, CSS e JavaScript puros (sem framework) e jsPDF (geração de PDF no navegador).

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
│   ├── migrate.js             Aplica db/database.sql no banco (roda automaticamente no npm start)
│   ├── mailer.js              Configuração do nodemailer e envio de e-mails (Gmail)
│   ├── package.json
│   └── .env                   Variáveis de ambiente (não versionado)
├── db/
│   └── database.sql           Script de criação do schema do banco
└── frontend/
    ├── root.css                     Variáveis e estilos globais (temas claro/escuro)
    ├── tela_cadastro/                Tela de cadastro de usuário
    ├── tela_confirmar_email/         Tela de confirmação do código enviado por e-mail após o cadastro
    ├── tela_esqueci_minha_senha/     Tela de recuperação de senha via código enviado por e-mail
    ├── tela_inicial/                 Tela de login (usada por index.html)
    └── tela_principal/               Painel financeiro do usuário
```

## Pré-requisitos

- Node.js (versão 18 ou superior recomendada)
- PostgreSQL instalado e em execução
- Uma conta Gmail com verificação em duas etapas ativada e uma senha de app gerada, caso deseje testar localmente os fluxos de confirmação de e-mail e recuperação de senha

## Configuração do ambiente

**1. Instalar as dependências do backend**

```
cd backend
npm install
```

**2. Criar o banco de dados**

Crie um banco no PostgreSQL com o nome que você definirá em `DB_NAME`.

O script `db/database.sql` é idempotente (usa `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, etc.) e é aplicado automaticamente pelo script `migrate` (`backend/migrate.js`) toda vez que o backend é iniciado via `npm start` — inclusive em produção, a cada deploy no Railway. Não é necessário rodá-lo manualmente ao iniciar via `npm start`.

Se você quiser rodar apenas localmente sem passar por `npm start` (por exemplo, para inspecionar o schema antes de subir o backend), ainda é possível executá-lo manualmente:

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

EMAIL_USER=<seu_email_do_gmail>
EMAIL_PASSWORD=<senha_de_app_do_gmail>
```

`EMAIL_USER` e `EMAIL_PASSWORD` são as credenciais de uma conta Gmail usada pelo `nodemailer` (`backend/mailer.js`) para enviar os e-mails de confirmação de cadastro e de recuperação de senha. `EMAIL_PASSWORD` não é a senha normal da conta Google: é uma senha de app, gerada em uma conta com verificação em duas etapas ativada.

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
| POST | `/usuarios/cadastro` | Recebe nome, e-mail e senha e cria um cadastro pendente, enviando um código de confirmação para o e-mail informado; o usuário só é criado em `usuario` depois que o e-mail é confirmado |
| POST | `/usuarios/login` | Autentica por e-mail e senha |
| POST | `/usuarios/confirmar-email/confirmar` | Valida o código de confirmação de um cadastro pendente e cria o usuário definitivo |
| POST | `/usuarios/confirmar-email/reenviar` | Reenvia o código de confirmação de e-mail para um cadastro pendente |
| POST | `/usuarios/esqueci-senha/solicitar` | Envia um código de verificação para o e-mail do usuário, caso ele exista |
| POST | `/usuarios/esqueci-senha/verificar` | Valida o código de verificação de redefinição de senha |
| POST | `/usuarios/esqueci-senha/redefinir` | Redefine a senha do usuário a partir de um código de verificação válido |
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

**usuario**: dados de login, o modelo de planejamento ativo (`modelo_ativo_id`) e se o e-mail já foi confirmado (`email_verificado`).

**modelos_orcamentarios**: modelos de divisão percentual do orçamento (necessidades, desejos, investimentos), podendo ser globais (`usuario_id` nulo, como os modelos 50-30-20, 60-30-10 e 40-30-30 pré-cadastrados) ou específicos de um usuário.

**lancamento_mensal**: rendas e gastos de um usuário em um determinado mês/ano, com suporte a lançamentos parcelados (`parcela_atual` / `parcela_total`).

**cadastro_pendente**: nome, e-mail e senha (já com hash) de um cadastro ainda não confirmado; vira uma linha em `usuario` somente quando o código de confirmação de e-mail é validado.

**codigo_verificacao**: códigos numéricos de uso único usados nos fluxos de confirmação de e-mail e redefinição de senha (`tipo`), com prazo de expiração (`expira_em`). Está vinculado a um `usuario_id` (redefinição de senha) ou a um `cadastro_pendente_id` (confirmação de e-mail), nunca aos dois ao mesmo tempo.

## Documentação complementar

Para a lista completa de requisitos funcionais, requisitos não funcionais e os fluxos detalhados de cada caso de uso (autenticação, cadastro de transação, configuração de planejamento, visualização de gastos e exportação em PDF), consulte o arquivo **CLAUDE.md**.

## Colaboradores

- **David Soares** — Redes & Infra
- **Arthur Fellype** — Segurança
