require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcrypt');
const fs = require('fs');
const db = require('./db');
const mailer = require('./mailer');
const { gerar_token, autenticar, exigir_dono_do_recurso } = require('./auth');
const {
    limitador_login_ip, limitador_login_email,
    limitador_cadastro_ip, limitador_cadastro_email,
    limitador_codigo_ip, limitador_codigo_email
} = require('./rate_limit');

const app = express();

// Railway (e provedores similares) colocam a aplicação atrás de 1 proxy reverso: sem isso,
// req.ip veria sempre o IP do proxy e o rate limiting por IP ficaria inútil.
app.set('trust proxy', 1);

// ---------- CORS: allowlist de origens (produção + Live Server local, quando não estiver em produção) ----------

const ORIGENS_PERMITIDAS_PRODUCAO = ['https://www.meuplanejamentofinanceiro.dev.br'];
const ORIGENS_PERMITIDAS_DESENVOLVIMENTO = ['http://127.0.0.1:5500', 'http://localhost:5500'];
const em_producao = process.env.NODE_ENV === 'production';
const origens_permitidas = em_producao
    ? ORIGENS_PERMITIDAS_PRODUCAO
    : [...ORIGENS_PERMITIDAS_PRODUCAO, ...ORIGENS_PERMITIDAS_DESENVOLVIMENTO];

app.use((req, res, next) => {
    // O navegador envia o header Origin mesmo em requisições same-origin (ex: POST feito a partir
    // de http://localhost:3000 direto no backend, sem Live Server). Nesses casos a origem da
    // requisição é o próprio host que está respondendo por ela, então ela nunca deve ser bloqueada
    // pelo CORS — não importa em qual porta/domínio o backend está servindo o frontend no momento.
    const origem_do_proprio_backend = `${req.protocol}://${req.get('host')}`;
    const origens_permitidas_nesta_requisicao = [...origens_permitidas, origem_do_proprio_backend];

    cors({
        origin(origem, callback){
            // Requisições sem header Origin (ex: curl, apps mobile) não passam por checagem de CORS
            if(!origem || origens_permitidas_nesta_requisicao.includes(origem)){
                return callback(null, true);
            }

            callback(new Error('Origem não permitida pelo CORS.'));
        }
    })(req, res, next);
});

// ---------- Headers de segurança HTTP ----------

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
            styleSrc: ["'self'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:'],
            connectSrc: ["'self'", ...(em_producao ? [] : ['http://localhost:3000'])],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"]
        }
    }
}));

app.use(express.json({ limit: '100kb' }));

const path = require('path');
app.use(express.static(path.join(__dirname, '..')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ---------- Códigos de verificação (confirmação de e-mail / redefinição de senha) ----------

const MINUTOS_EXPIRACAO_CODIGO = 15;
const LIMITE_TENTATIVAS_CODIGO = 5;

const TAMANHO_MINIMO_SENHA = 8;

function senha_atende_tamanho_minimo(senha){
    return typeof senha === 'string' && senha.length >= TAMANHO_MINIMO_SENHA;
}

// ---------- Validação de texto livre digitado pelo usuário (nome, descrição, etc.) ----------

// Campos de texto livre são só validados quanto a tipo/tamanho aqui: o valor sempre chega ao banco
// através de query parametrizada ($1, $2...), então não há risco de injeção de SQL nem de format
// string (Node não usa esse valor como especificador de formato em nenhum lugar) — o único risco real
// de entrada estranha (ex: "%1!s%2!s..." do ZAP, texto muito longo, etc.) é estourar o tamanho da
// coluna no Postgres e o erro do banco vazar como 500 em vez de virar um 400 claro.
function texto_livre_valido(valor, tamanho_maximo){
    return typeof valor === 'string' && valor.trim().length > 0 && valor.trim().length <= tamanho_maximo;
}

// ---------- Erros do Postgres causados por entrada mal formatada (nunca devem virar 500) ----------

// 22001 = valor maior que o tamanho da coluna | 22P02 = tipo incompatível com a coluna (ex: texto num
// campo numérico) | 23502 = campo obrigatório ausente | 23514 = violação de CHECK (ex: "tipo" fora da
// lista permitida). Nenhum desses é um bug do servidor: são sempre causados por entrada do usuário.
const CODIGOS_ERRO_ENTRADA_INVALIDA = new Set(['22001', '22P02', '23502', '23514']);

function tratar_erro_rota(res, error, contexto){
    console.error(contexto, error);

    if(CODIGOS_ERRO_ENTRADA_INVALIDA.has(error?.code)){
        return res.status(400).json({ erro: "Dados inválidos." });
    }

    res.status(500).json({ erro: "Erro interno no servidor." });
}

function gerar_codigo_verificacao(){
    return String(Math.floor(100000 + Math.random() * 900000));
}

function normalizar_identificador_tentativas(identificador){
    return String(identificador).trim().toLowerCase();
}

async function excedeu_limite_tentativas(identificador, tipo){
    const resultado = await db.query(
        'SELECT tentativas FROM tentativa_verificacao WHERE identificador = $1 AND tipo = $2',
        [normalizar_identificador_tentativas(identificador), tipo]
    );

    return (resultado.rows[0]?.tentativas || 0) >= LIMITE_TENTATIVAS_CODIGO;
}

async function registrar_tentativa_errada(identificador, tipo){
    await db.query(
        `INSERT INTO tentativa_verificacao (identificador, tipo, tentativas, atualizado_em)
         VALUES ($1, $2, 1, NOW())
         ON CONFLICT (identificador, tipo)
         DO UPDATE SET tentativas = tentativa_verificacao.tentativas + 1, atualizado_em = NOW()`,
        [normalizar_identificador_tentativas(identificador), tipo]
    );
}

async function limpar_tentativas(identificador, tipo){
    await db.query(
        'DELETE FROM tentativa_verificacao WHERE identificador = $1 AND tipo = $2',
        [normalizar_identificador_tentativas(identificador), tipo]
    );
}

async function gerar_e_enviar_codigo(usuario_id, tipo, email, assunto, montar_texto){
    const codigo = gerar_codigo_verificacao();
    const expira_em = new Date(Date.now() + MINUTOS_EXPIRACAO_CODIGO * 60 * 1000);

    await db.query(
        'UPDATE codigo_verificacao SET usado = true WHERE usuario_id = $1 AND tipo = $2 AND usado = false',
        [usuario_id, tipo]
    );

    await db.query(
        'INSERT INTO codigo_verificacao (usuario_id, codigo, tipo, expira_em) VALUES ($1, $2, $3, $4)',
        [usuario_id, codigo, tipo, expira_em]
    );

    await mailer.enviar_email(email, assunto, montar_texto(codigo));
}

async function buscar_codigo_valido(usuario_id, tipo, codigo){
    const resultado = await db.query(
        `SELECT id FROM codigo_verificacao
         WHERE usuario_id = $1 AND tipo = $2 AND codigo = $3 AND usado = false AND expira_em > NOW()`,
        [usuario_id, tipo, codigo]
    );

    return resultado.rows[0] || null;
}

// ---------- Cadastro pendente (conta só é criada em `usuario` após confirmar o e-mail) ----------

async function gerar_e_enviar_codigo_pendente(cadastro_pendente_id, email, assunto, montar_texto){
    const codigo = gerar_codigo_verificacao();
    const expira_em = new Date(Date.now() + MINUTOS_EXPIRACAO_CODIGO * 60 * 1000);

    await db.query(
        'UPDATE codigo_verificacao SET usado = true WHERE cadastro_pendente_id = $1 AND tipo = $2 AND usado = false',
        [cadastro_pendente_id, 'confirmacao_email']
    );

    await db.query(
        'INSERT INTO codigo_verificacao (cadastro_pendente_id, codigo, tipo, expira_em) VALUES ($1, $2, $3, $4)',
        [cadastro_pendente_id, codigo, 'confirmacao_email', expira_em]
    );

    await mailer.enviar_email(email, assunto, montar_texto(codigo));
}

async function buscar_codigo_pendente_valido(cadastro_pendente_id, codigo){
    const resultado = await db.query(
        `SELECT id FROM codigo_verificacao
         WHERE cadastro_pendente_id = $1 AND tipo = 'confirmacao_email' AND codigo = $2 AND usado = false AND expira_em > NOW()`,
        [cadastro_pendente_id, codigo]
    );

    return resultado.rows[0] || null;
}

// ---------- Contas de teste (pulam a confirmação de e-mail) ----------

function carregar_emails_de_teste(){
    const caminho = path.join(__dirname, 'usuario_teste.txt');

    if(!fs.existsSync(caminho)){
        return new Set();
    }

    const conteudo = fs.readFileSync(caminho, 'utf-8');

    const emails = conteudo
        .split('\n')
        .filter((linha) => linha.trim().toLowerCase().startsWith('email:'))
        .map((linha) => linha.split(':').slice(1).join(':').trim().toLowerCase())
        .filter((email) => email.length > 0);

    return new Set(emails);
}

function eh_conta_de_teste(email){
    return carregar_emails_de_teste().has(String(email).trim().toLowerCase());
}

function gerar_id_pendente_falso(){
    // Negativo de propósito: a sequência BIGSERIAL de cadastro_pendente só gera IDs positivos,
    // então isto nunca colide com um id real — só serve para a resposta ter o mesmo formato.
    return -Math.floor(Math.random() * 1_000_000_000) - 1;
}

app.post('/api/usuarios/cadastro', limitador_cadastro_ip, limitador_cadastro_email, async (req, res) => {
    const { nome, email, senha } = req.body;

    try {
        if(!texto_livre_valido(nome, 70)){
            return res.status(400).json({ erro: "Informe um nome válido (até 70 caracteres)." });
        }

        if(!senha_atende_tamanho_minimo(senha)){
            return res.status(400).json({ erro: `A senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.` });
        }

        // O e-mail já existe no banco de dados? Não revelamos isso na resposta (evita enumeração de
        // e-mail): seguimos o mesmo padrão anti-enumeração do fluxo de "esqueci minha senha".
        const usuario_existente = await db.query('SELECT id FROM usuario WHERE email = $1', [email]);
        const email_ja_cadastrado = usuario_existente.rows.length > 0;

        // Sempre executa o hash, mesmo quando o resultado será descartado logo abaixo: evita que o
        // tempo de resposta entregue via timing a mesma informação que a resposta já não revela.
        const senha_hash = await bcrypt.hash(senha, 10);

        if(email_ja_cadastrado){
            return res.status(201).json({
                mensagem: "Enviamos um código de confirmação para o seu e-mail.",
                cadastro_pendente_id: gerar_id_pendente_falso()
            });
        }

        // Contas de teste (backend/usuario_teste.txt, fora do Git) pulam a confirmação de e-mail
        if(eh_conta_de_teste(email)){
            const novo_usuario = await db.query(
                `INSERT INTO usuario (nome, email, senha, email_verificado)
                 VALUES ($1, $2, $3, true)
                 RETURNING id, nome, email, email_verificado`,
                [nome, email, senha_hash]
            );

            return res.status(201).json({
                mensagem: "Usuário criado com sucesso",
                usuario: novo_usuario.rows[0]
            });
        }

        // Uma nova tentativa de cadastro com o mesmo e-mail substitui a pendente anterior
        await db.query('DELETE FROM cadastro_pendente WHERE email = $1', [email]);

        const novo_pendente = await db.query(
            `INSERT INTO cadastro_pendente (nome, email, senha_hash)
             VALUES ($1, $2, $3)
             RETURNING id, nome, email`,
            [nome, email, senha_hash]
        );

        const pendente = novo_pendente.rows[0];

        // A conta só existirá depois da confirmação: se o e-mail não sair, não faz sentido manter a pendência
        try{
            await gerar_e_enviar_codigo_pendente(
                pendente.id,
                pendente.email,
                'Confirme seu e-mail - Meu Planejamento Financeiro',
                (codigo) => `Olá, ${pendente.nome}! Seu código de confirmação de e-mail é: ${codigo}. Ele expira em ${MINUTOS_EXPIRACAO_CODIGO} minutos.`
            );
        }

        catch(erro_email){
            console.error("Erro ao enviar e-mail de confirmação:", erro_email);
            await db.query('DELETE FROM cadastro_pendente WHERE id = $1', [pendente.id]);
            return res.status(500).json({ erro: "Não foi possível enviar o e-mail de confirmação. Tente novamente." });
        }

        res.status(201).json({
            mensagem: "Enviamos um código de confirmação para o seu e-mail.",
            cadastro_pendente_id: pendente.id
        });

    }

    catch(error){
        tratar_erro_rota(res, error, "Erro no cadastro:");
    }
});

app.post('/api/usuarios/login', limitador_login_ip, limitador_login_email, async (req, res) => {
    const { email, senha } = req.body;

    try {
        const usuario_existente = await db.query('SELECT id, nome, email, senha, email_verificado FROM usuario WHERE email = $1', [email]);

        if(usuario_existente.rows.length === 0){
            return res.status(401).json({ erro: "E-mail ou senha incorretos." });
        }

        const usuario = usuario_existente.rows[0];

        const senha_correta = await bcrypt.compare(senha, usuario.senha);

        if(!senha_correta){
            return res.status(401).json({ erro: "E-mail ou senha incorretos." });
        }

        res.status(200).json({
            mensagem: "Login realizado com sucesso",
            usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, email_verificado: usuario.email_verificado },
            token: gerar_token(usuario.id)
        });

    }

    catch(error){
        tratar_erro_rota(res, error, "Erro no login:");
    }
});

// ---------- Esqueci minha senha ----------

app.post('/api/usuarios/esqueci-senha/solicitar', limitador_codigo_ip, limitador_codigo_email, async (req, res) => {
    const { email } = req.body;

    try{
        const usuario_existente = await db.query('SELECT id, nome, email FROM usuario WHERE email = $1', [email]);

        if(usuario_existente.rows.length > 0){
            const usuario = usuario_existente.rows[0];

            await gerar_e_enviar_codigo(
                usuario.id,
                'redefinicao_senha',
                usuario.email,
                'Redefinição de senha - Meu Planejamento Financeiro',
                (codigo) => `Olá, ${usuario.nome}! Seu código para redefinir a senha é: ${codigo}. Ele expira em ${MINUTOS_EXPIRACAO_CODIGO} minutos. Se você não solicitou isso, ignore este e-mail.`
            );
        }

        // Resposta genérica: não revela se o e-mail está cadastrado
        res.status(200).json({ mensagem: "Se esse e-mail existir em nossa base, enviamos um código de verificação." });
    }

    catch(error){
        tratar_erro_rota(res, error, "Erro ao solicitar redefinição de senha:");
    }
});

app.post('/api/usuarios/esqueci-senha/verificar', limitador_codigo_ip, limitador_codigo_email, async (req, res) => {
    const { email, codigo } = req.body;

    try{
        if(await excedeu_limite_tentativas(email, 'redefinicao_senha')){
            return res.status(429).json({ erro: "Muitas tentativas erradas. Solicite um novo código." });
        }

        const usuario_existente = await db.query('SELECT id FROM usuario WHERE email = $1', [email]);
        const usuario = usuario_existente.rows[0];
        const codigo_valido = usuario && await buscar_codigo_valido(usuario.id, 'redefinicao_senha', codigo);

        if(!codigo_valido){
            await registrar_tentativa_errada(email, 'redefinicao_senha');
            return res.status(400).json({ erro: "Código inválido ou expirado." });
        }

        await limpar_tentativas(email, 'redefinicao_senha');
        res.status(200).json({ mensagem: "Código válido." });
    }

    catch(error){
        tratar_erro_rota(res, error, "Erro ao verificar código de redefinição de senha:");
    }
});

app.post('/api/usuarios/esqueci-senha/redefinir', limitador_codigo_ip, limitador_codigo_email, async (req, res) => {
    const { email, codigo, senha_nova } = req.body;

    try{
        if(await excedeu_limite_tentativas(email, 'redefinicao_senha')){
            return res.status(429).json({ erro: "Muitas tentativas erradas. Solicite um novo código." });
        }

        const usuario_existente = await db.query('SELECT id FROM usuario WHERE email = $1', [email]);
        const usuario = usuario_existente.rows[0];
        const codigo_valido = usuario && await buscar_codigo_valido(usuario.id, 'redefinicao_senha', codigo);

        if(!codigo_valido){
            await registrar_tentativa_errada(email, 'redefinicao_senha');
            return res.status(400).json({ erro: "Código inválido ou expirado." });
        }

        if(!senha_atende_tamanho_minimo(senha_nova)){
            return res.status(400).json({ erro: `A senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.` });
        }

        const senha_hash = await bcrypt.hash(senha_nova, 10);

        await db.query('UPDATE usuario SET senha = $1 WHERE id = $2', [senha_hash, usuario.id]);
        await db.query('UPDATE codigo_verificacao SET usado = true WHERE id = $1', [codigo_valido.id]);

        await limpar_tentativas(email, 'redefinicao_senha');
        res.status(200).json({ mensagem: "Senha redefinida com sucesso." });
    }

    catch(error){
        tratar_erro_rota(res, error, "Erro ao redefinir senha:");
    }
});

// ---------- Confirmação de e-mail ----------

app.post('/api/usuarios/confirmar-email/confirmar', limitador_codigo_ip, limitador_codigo_email, async (req, res) => {
    const { cadastro_pendente_id, codigo } = req.body;

    try{
        if(await excedeu_limite_tentativas(cadastro_pendente_id, 'confirmacao_email')){
            return res.status(429).json({ erro: "Muitas tentativas erradas. Solicite um novo código." });
        }

        const codigo_valido = await buscar_codigo_pendente_valido(cadastro_pendente_id, codigo);

        if(!codigo_valido){
            await registrar_tentativa_errada(cadastro_pendente_id, 'confirmacao_email');
            return res.status(400).json({ erro: "Código inválido ou expirado." });
        }

        const pendente_existente = await db.query('SELECT nome, email, senha_hash FROM cadastro_pendente WHERE id = $1', [cadastro_pendente_id]);

        if(pendente_existente.rows.length === 0){
            return res.status(404).json({ erro: "Cadastro pendente não encontrado. Refaça o cadastro." });
        }

        const pendente = pendente_existente.rows[0];

        const novo_usuario = await db.query(
            `INSERT INTO usuario (nome, email, senha, email_verificado)
             VALUES ($1, $2, $3, true)
             RETURNING id, nome, email, email_verificado`,
            [pendente.nome, pendente.email, pendente.senha_hash]
        );

        // Cascata em codigo_verificacao remove o código usado junto com a pendência
        await db.query('DELETE FROM cadastro_pendente WHERE id = $1', [cadastro_pendente_id]);

        await limpar_tentativas(cadastro_pendente_id, 'confirmacao_email');
        res.status(200).json({
            mensagem: "Conta criada e e-mail confirmado com sucesso!",
            usuario: novo_usuario.rows[0]
        });
    }

    catch(error){
        tratar_erro_rota(res, error, "Erro ao confirmar e-mail:");
    }
});

app.post('/api/usuarios/confirmar-email/reenviar', limitador_codigo_ip, limitador_codigo_email, async (req, res) => {
    const { cadastro_pendente_id } = req.body;

    try{
        const pendente_existente = await db.query('SELECT id, nome, email FROM cadastro_pendente WHERE id = $1', [cadastro_pendente_id]);

        if(pendente_existente.rows.length === 0){
            return res.status(404).json({ erro: "Cadastro pendente não encontrado. Refaça o cadastro." });
        }

        const pendente = pendente_existente.rows[0];

        await gerar_e_enviar_codigo_pendente(
            pendente.id,
            pendente.email,
            'Confirme seu e-mail - Meu Planejamento Financeiro',
            (codigo) => `Olá, ${pendente.nome}! Seu código de confirmação de e-mail é: ${codigo}. Ele expira em ${MINUTOS_EXPIRACAO_CODIGO} minutos.`
        );

        res.status(200).json({ mensagem: "Novo código enviado." });
    }

    catch(error){
        tratar_erro_rota(res, error, "Erro ao reenviar código de confirmação:");
    }
});

app.get('/api/modelos-orcamentarios', autenticar, async (req, res) => {
    try {
        const resultado = await db.query(
            'SELECT id, nome, descricao, porcent_necessidades, porcent_desejos, porcent_investimentos, usuario_id FROM modelos_orcamentarios WHERE usuario_id IS NULL OR usuario_id = $1 ORDER BY usuario_id NULLS FIRST, id',
            [req.usuario_id]
        );

        res.status(200).json({ modelos: resultado.rows });
    }

    catch(error){
        tratar_erro_rota(res, error, "Erro ao listar modelos orçamentários:");
    }
});

app.post('/api/modelos-orcamentarios', autenticar, async (req, res) => {
    const { nome, descricao, porcent_necessidades, porcent_desejos, porcent_investimentos } = req.body;

    try {
        if(!texto_livre_valido(nome, 100)){
            return res.status(400).json({ erro: "Informe um nome válido (até 100 caracteres)." });
        }

        if(descricao != null && typeof descricao !== 'string'){
            return res.status(400).json({ erro: "Descrição inválida." });
        }

        if((porcent_necessidades + porcent_desejos + porcent_investimentos) !== 100){
            return res.status(400).json({ erro: "A soma das porcentagens deve fechar exatamente em 100%." });
        }

        const query_insert = `
            INSERT INTO modelos_orcamentarios (nome, descricao, porcent_necessidades, porcent_desejos, porcent_investimentos, usuario_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, nome, descricao, porcent_necessidades, porcent_desejos, porcent_investimentos, usuario_id;
        `;
        const novo_modelo = await db.query(query_insert, [nome, descricao || null, porcent_necessidades, porcent_desejos, porcent_investimentos, req.usuario_id]);

        res.status(201).json({
            mensagem: "Planejamento criado com sucesso",
            modelo: novo_modelo.rows[0]
        });
    }

    catch(error){
        tratar_erro_rota(res, error, "Erro ao criar modelo orçamentário:");
    }
});

app.get('/api/usuarios/:id/modelo-ativo', autenticar, exigir_dono_do_recurso, async (req, res) => {
    const { id } = req.params;

    try {
        const resultado = await db.query(
            `SELECT m.id, m.nome, m.descricao, m.porcent_necessidades, m.porcent_desejos, m.porcent_investimentos
             FROM usuario u
             JOIN modelos_orcamentarios m ON m.id = u.modelo_ativo_id
             WHERE u.id = $1`,
            [id]
        );

        if(resultado.rows.length === 0){
            return res.status(404).json({ erro: "Este usuário ainda não tem um planejamento financeiro ativo." });
        }

        res.status(200).json({ modelo: resultado.rows[0] });
    }

    catch(error){
        tratar_erro_rota(res, error, "Erro ao buscar modelo ativo:");
    }
});

app.put('/api/usuarios/:id/modelo-ativo', autenticar, exigir_dono_do_recurso, async (req, res) => {
    const { id } = req.params;
    const { modelo_id } = req.body;

    try {
        const resultado = await db.query(
            'UPDATE usuario SET modelo_ativo_id = $1 WHERE id = $2 RETURNING id, modelo_ativo_id',
            [modelo_id, id]
        );

        if(resultado.rows.length === 0){
            return res.status(404).json({ erro: "Usuário não encontrado." });
        }

        res.status(200).json({ mensagem: "Planejamento aplicado ao orçamento com sucesso", usuario: resultado.rows[0] });
    }

    catch(error){
        tratar_erro_rota(res, error, "Erro ao aplicar modelo ativo:");
    }
});

function mes_anterior(ano, mes){
    return mes === 1 ? { ano: ano - 1, mes: 12 } : { ano, mes: mes - 1 };
}

async function obter_mes_editavel(usuario_id){
    const agora = new Date();
    const ano_atual = agora.getFullYear();
    const mes_atual = agora.getMonth() + 1;

    const existe_mes_atual = await db.query(
        'SELECT 1 FROM lancamento_mensal WHERE usuario_id = $1 AND ano = $2 AND mes = $3 LIMIT 1',
        [usuario_id, ano_atual, mes_atual]
    );

    if(existe_mes_atual.rows.length > 0){
        return { ano: ano_atual, mes: mes_atual };
    }

    return mes_anterior(ano_atual, mes_atual);
}

app.get('/api/usuarios/:id/lancamentos', autenticar, exigir_dono_do_recurso, async (req, res) => {
    const { id } = req.params;
    const { ano, mes } = req.query;

    try {
        const resultado = await db.query(
            'SELECT id, tipo, nome, valor, parcela_atual, parcela_total FROM lancamento_mensal WHERE usuario_id = $1 AND ano = $2 AND mes = $3 ORDER BY tipo, id',
            [id, ano, mes]
        );

        res.status(200).json({ lancamentos: resultado.rows });
    }

    catch(error){
        tratar_erro_rota(res, error, "Erro ao listar lançamentos:");
    }
});

app.get('/api/usuarios/:id/ultimo-mes', autenticar, exigir_dono_do_recurso, async (req, res) => {
    const { id } = req.params;

    try {
        const resultado = await db.query(
            'SELECT ano, mes FROM lancamento_mensal WHERE usuario_id = $1 ORDER BY ano DESC, mes DESC LIMIT 1',
            [id]
        );

        res.status(200).json({ ultimo_mes: resultado.rows[0] || null });
    }

    catch(error){
        tratar_erro_rota(res, error, "Erro ao buscar último mês informado:");
    }
});

app.get('/api/usuarios/:id/meses-com-lancamentos', autenticar, exigir_dono_do_recurso, async (req, res) => {
    const { id } = req.params;

    try {
        const resultado = await db.query(
            'SELECT DISTINCT ano, mes FROM lancamento_mensal WHERE usuario_id = $1 ORDER BY ano DESC, mes DESC',
            [id]
        );

        res.status(200).json({ meses: resultado.rows });
    }

    catch(error){
        tratar_erro_rota(res, error, "Erro ao listar meses com lançamentos:");
    }
});

app.get('/api/usuarios/:id/mes-editavel', autenticar, exigir_dono_do_recurso, async (req, res) => {
    const { id } = req.params;

    try {
        const mes_editavel = await obter_mes_editavel(id);
        res.status(200).json({ mes_editavel });
    }

    catch(error){
        tratar_erro_rota(res, error, "Erro ao calcular mês editável:");
    }
});

const TIPOS_LANCAMENTO_VALIDOS = ['renda', 'necessario', 'desejo', 'investimento'];

app.post('/api/usuarios/:id/lancamentos', autenticar, exigir_dono_do_recurso, async (req, res) => {
    const { id } = req.params;
    const { ano, mes, tipo, nome, valor, parcela_atual, parcela_total } = req.body;

    try {
        if(!texto_livre_valido(nome, 100)){
            return res.status(400).json({ erro: "Informe um nome válido (até 100 caracteres)." });
        }

        if(!TIPOS_LANCAMENTO_VALIDOS.includes(tipo)){
            return res.status(400).json({ erro: "Tipo de lançamento inválido." });
        }

        if(typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0){
            return res.status(400).json({ erro: "Informe um valor numérico válido, maior ou igual a zero." });
        }

        if(!Number.isInteger(ano) || ano < 2000 || !Number.isInteger(mes) || mes < 1 || mes > 12){
            return res.status(400).json({ erro: "Informe um ano e mês válidos." });
        }

        const agora = new Date();
        const ano_atual = agora.getFullYear();
        const mes_atual = agora.getMonth() + 1;

        // O mês futuro continua bloqueado. Meses passados podem receber lançamentos
        // (usado pela edição de planejamento de um mês específico já registrado).
        if(ano > ano_atual || (ano === ano_atual && mes > mes_atual)){
            return res.status(400).json({ erro: "Não é possível lançar informações de um mês que ainda não chegou." });
        }

        const tem_parcela = parcela_atual != null && parcela_total != null;

        if(tem_parcela){
            if(tipo !== 'necessario' && tipo !== 'desejo'){
                return res.status(400).json({ erro: "Parcelamento só se aplica a gastos necessários ou com desejos." });
            }

            if(parcela_atual < 1 || parcela_total < parcela_atual){
                return res.status(400).json({ erro: "Parcela informada é inválida." });
            }
        }

        const resultado = await db.query(
            `INSERT INTO lancamento_mensal (usuario_id, ano, mes, tipo, nome, valor, parcela_atual, parcela_total)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, tipo, nome, valor, parcela_atual, parcela_total`,
            [id, ano, mes, tipo, nome, valor, tem_parcela ? parcela_atual : null, tem_parcela ? parcela_total : null]
        );

        res.status(201).json({ lancamento: resultado.rows[0] });
    }

    catch(error){
        tratar_erro_rota(res, error, "Erro ao criar lançamento:");
    }
});

app.delete('/api/lancamentos/:id', autenticar, async (req, res) => {
    const { id } = req.params;

    try {
        const resultado = await db.query(
            'DELETE FROM lancamento_mensal WHERE id = $1 AND usuario_id = $2 RETURNING id',
            [id, req.usuario_id]
        );

        if(resultado.rows.length === 0){
            return res.status(403).json({ erro: "Você não tem permissão para remover este lançamento." });
        }

        res.status(200).json({ mensagem: "Lançamento removido com sucesso." });
    }

    catch(error){
        tratar_erro_rota(res, error, "Erro ao remover lançamento:");
    }
});

app.put('/api/usuarios/:id/senha', autenticar, exigir_dono_do_recurso, async (req, res) => {
    const { id } = req.params;
    const { senha_antiga, senha_nova } = req.body;

    try {
        const usuario_existente = await db.query('SELECT senha FROM usuario WHERE id = $1', [id]);

        if(usuario_existente.rows.length === 0){
            return res.status(404).json({ erro: "Usuário não encontrado." });
        }

        const usuario = usuario_existente.rows[0];

        const senha_correta = await bcrypt.compare(senha_antiga, usuario.senha);

        if(!senha_correta){
            return res.status(401).json({ erro: "Senha atual incorreta." });
        }

        if(!senha_atende_tamanho_minimo(senha_nova)){
            return res.status(400).json({ erro: `A nova senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.` });
        }

        const nova_senha_hash = await bcrypt.hash(senha_nova, 10);
        await db.query('UPDATE usuario SET senha = $1 WHERE id = $2', [nova_senha_hash, id]);

        res.status(200).json({ mensagem: "Senha alterada com sucesso." });
    }

    catch(error){
        tratar_erro_rota(res, error, "Erro ao alterar senha:");
    }
});

app.delete('/api/usuarios/:id', autenticar, exigir_dono_do_recurso, async (req, res) => {
    const { senha } = req.body;

    try {
        const usuario_existente = await db.query('SELECT senha FROM usuario WHERE id = $1', [req.usuario_id]);

        if(usuario_existente.rows.length === 0){
            return res.status(404).json({ erro: "Usuário não encontrado." });
        }

        const usuario = usuario_existente.rows[0];

        // Defensivo: toda conta hoje é criada com senha, mas se por algum motivo não houver
        // senha cadastrada, a posse do token JWT já comprova a autenticação nesse caso.
        if(usuario.senha){
            if(!senha){
                return res.status(400).json({ erro: "Informe sua senha atual para confirmar a exclusão." });
            }

            const senha_correta = await bcrypt.compare(senha, usuario.senha);

            if(!senha_correta){
                return res.status(401).json({ erro: "Senha atual incorreta." });
            }
        }

        const resultado = await db.query('DELETE FROM usuario WHERE id = $1 RETURNING id', [req.usuario_id]);

        if(resultado.rows.length === 0){
            return res.status(404).json({ erro: "Usuário não encontrado." });
        }

        res.status(200).json({ mensagem: "Perfil excluído com sucesso." });
    }

    catch(error){
        tratar_erro_rota(res, error, "Erro ao excluir usuário:");
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Handler de erro genérico: garante que nada (nem uma rejeição de CORS) vaze stack trace/HTML,
// já que esta é uma API que só deveria responder JSON.
app.use((err, req, res, next) => {
    if(err && err.message === 'Origem não permitida pelo CORS.'){
        return res.status(403).json({ erro: "Origem não permitida." });
    }

    console.error('Erro não tratado:', err);
    res.status(500).json({ erro: "Erro interno no servidor." });
});

const PORTA = process.env.PORT || 3000;

app.listen(PORTA, () => {
    console.log(`Servidor rodando em http://localhost:${PORTA}`);
});
