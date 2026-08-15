require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');
const db = require('./db');
const mailer = require('./mailer');

const app = express();
app.use(cors());
app.use(express.json());

const path = require('path');
app.use(express.static(path.join(__dirname, '..')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

const google_client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ---------- Códigos de verificação (confirmação de e-mail / redefinição de senha) ----------

const MINUTOS_EXPIRACAO_CODIGO = 15;
const LIMITE_TENTATIVAS_CODIGO = 5;

const tentativas_codigo_por_chave = new Map();

function gerar_codigo_verificacao(){
    return String(Math.floor(100000 + Math.random() * 900000));
}

function chave_tentativas(identificador, tipo){
    return `${tipo}:${identificador}`;
}

function excedeu_limite_tentativas(identificador, tipo){
    return (tentativas_codigo_por_chave.get(chave_tentativas(identificador, tipo)) || 0) >= LIMITE_TENTATIVAS_CODIGO;
}

function registrar_tentativa_errada(identificador, tipo){
    const chave = chave_tentativas(identificador, tipo);
    tentativas_codigo_por_chave.set(chave, (tentativas_codigo_por_chave.get(chave) || 0) + 1);
}

function limpar_tentativas(identificador, tipo){
    tentativas_codigo_por_chave.delete(chave_tentativas(identificador, tipo));
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

app.post('/api/usuarios/cadastro', async (req, res) => {
    const { nome, email, senha } = req.body;

    try {
        // Validação: O e-mail já existe no banco de dados?
        // (Isso evita aquele erro fatal do UNIQUE no PostgreSQL)
        const usuario_existente = await db.query('SELECT id FROM usuario WHERE email = $1', [email]);

        if(usuario_existente.rows.length > 0){
            return res.status(400).json({ erro: "Este e-mail já está cadastrado no sistema." });
        }

        // Criptografando a senha (NUNCA salve a senha pura!)
        const senha_hash = await bcrypt.hash(senha, 10);

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
        console.error("Erro no cadastro:", error);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
});

app.post('/api/usuarios/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        const usuario_existente = await db.query('SELECT id, nome, email, senha, email_verificado FROM usuario WHERE email = $1', [email]);

        if(usuario_existente.rows.length === 0){
            return res.status(401).json({ erro: "E-mail ou senha incorretos." });
        }

        const usuario = usuario_existente.rows[0];

        if(!usuario.senha){
            return res.status(401).json({ erro: "Esta conta só pode entrar pelo login com Google." });
        }

        const senha_correta = await bcrypt.compare(senha, usuario.senha);

        if(!senha_correta){
            return res.status(401).json({ erro: "E-mail ou senha incorretos." });
        }

        res.status(200).json({
            mensagem: "Login realizado com sucesso",
            usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, email_verificado: usuario.email_verificado }
        });

    }

    catch(error){
        console.error("Erro no login:", error);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
});

app.post('/api/usuarios/login-google', async (req, res) => {
    const { token } = req.body;

    try {
        const ticket = await google_client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { name: nome, email } = payload;

        const usuario_existente = await db.query('SELECT id, nome, email, email_verificado FROM usuario WHERE email = $1', [email]);

        if(usuario_existente.rows.length > 0){
            return res.status(200).json({
                mensagem: "Login realizado com sucesso",
                usuario: usuario_existente.rows[0]
            });
        }

        const query_insert = `
            INSERT INTO usuario (nome, email, email_verificado)
            VALUES ($1, $2, true)
            RETURNING id, nome, email, email_verificado;
        `;
        const novo_usuario = await db.query(query_insert, [nome, email]);

        res.status(201).json({
            mensagem: "Usuário criado com sucesso",
            usuario: novo_usuario.rows[0]
        });

    }

    catch(error){
        console.error("Erro no login com Google:", error);
        res.status(401).json({ erro: "Token do Google inválido." });
    }
});

// ---------- Esqueci minha senha ----------

app.post('/api/usuarios/esqueci-senha/solicitar', async (req, res) => {
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
        console.error("Erro ao solicitar redefinição de senha:", error);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
});

app.post('/api/usuarios/esqueci-senha/verificar', async (req, res) => {
    const { email, codigo } = req.body;

    try{
        if(excedeu_limite_tentativas(email, 'redefinicao_senha')){
            return res.status(429).json({ erro: "Muitas tentativas erradas. Solicite um novo código." });
        }

        const usuario_existente = await db.query('SELECT id FROM usuario WHERE email = $1', [email]);
        const usuario = usuario_existente.rows[0];
        const codigo_valido = usuario && await buscar_codigo_valido(usuario.id, 'redefinicao_senha', codigo);

        if(!codigo_valido){
            registrar_tentativa_errada(email, 'redefinicao_senha');
            return res.status(400).json({ erro: "Código inválido ou expirado." });
        }

        limpar_tentativas(email, 'redefinicao_senha');
        res.status(200).json({ mensagem: "Código válido." });
    }

    catch(error){
        console.error("Erro ao verificar código de redefinição de senha:", error);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
});

app.post('/api/usuarios/esqueci-senha/redefinir', async (req, res) => {
    const { email, codigo, senha_nova } = req.body;

    try{
        if(excedeu_limite_tentativas(email, 'redefinicao_senha')){
            return res.status(429).json({ erro: "Muitas tentativas erradas. Solicite um novo código." });
        }

        const usuario_existente = await db.query('SELECT id FROM usuario WHERE email = $1', [email]);
        const usuario = usuario_existente.rows[0];
        const codigo_valido = usuario && await buscar_codigo_valido(usuario.id, 'redefinicao_senha', codigo);

        if(!codigo_valido){
            registrar_tentativa_errada(email, 'redefinicao_senha');
            return res.status(400).json({ erro: "Código inválido ou expirado." });
        }

        const senha_hash = await bcrypt.hash(senha_nova, 10);

        await db.query('UPDATE usuario SET senha = $1 WHERE id = $2', [senha_hash, usuario.id]);
        await db.query('UPDATE codigo_verificacao SET usado = true WHERE id = $1', [codigo_valido.id]);

        limpar_tentativas(email, 'redefinicao_senha');
        res.status(200).json({ mensagem: "Senha redefinida com sucesso." });
    }

    catch(error){
        console.error("Erro ao redefinir senha:", error);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
});

// ---------- Confirmação de e-mail ----------

app.post('/api/usuarios/confirmar-email/confirmar', async (req, res) => {
    const { cadastro_pendente_id, codigo } = req.body;

    try{
        if(excedeu_limite_tentativas(cadastro_pendente_id, 'confirmacao_email')){
            return res.status(429).json({ erro: "Muitas tentativas erradas. Solicite um novo código." });
        }

        const codigo_valido = await buscar_codigo_pendente_valido(cadastro_pendente_id, codigo);

        if(!codigo_valido){
            registrar_tentativa_errada(cadastro_pendente_id, 'confirmacao_email');
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

        limpar_tentativas(cadastro_pendente_id, 'confirmacao_email');
        res.status(200).json({
            mensagem: "Conta criada e e-mail confirmado com sucesso!",
            usuario: novo_usuario.rows[0]
        });
    }

    catch(error){
        console.error("Erro ao confirmar e-mail:", error);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
});

app.post('/api/usuarios/confirmar-email/reenviar', async (req, res) => {
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
        console.error("Erro ao reenviar código de confirmação:", error);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
});

app.get('/api/modelos-orcamentarios', async (req, res) => {
    const { usuario_id } = req.query;

    try {
        const resultado = await db.query(
            'SELECT id, nome, descricao, porcent_necessidades, porcent_desejos, porcent_investimentos, usuario_id FROM modelos_orcamentarios WHERE usuario_id IS NULL OR usuario_id = $1 ORDER BY usuario_id NULLS FIRST, id',
            [usuario_id || null]
        );

        res.status(200).json({ modelos: resultado.rows });
    }

    catch(error){
        console.error("Erro ao listar modelos orçamentários:", error);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
});

app.post('/api/modelos-orcamentarios', async (req, res) => {
    const { nome, descricao, porcent_necessidades, porcent_desejos, porcent_investimentos, usuario_id } = req.body;

    try {
        if((porcent_necessidades + porcent_desejos + porcent_investimentos) !== 100){
            return res.status(400).json({ erro: "A soma das porcentagens deve fechar exatamente em 100%." });
        }

        const query_insert = `
            INSERT INTO modelos_orcamentarios (nome, descricao, porcent_necessidades, porcent_desejos, porcent_investimentos, usuario_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, nome, descricao, porcent_necessidades, porcent_desejos, porcent_investimentos, usuario_id;
        `;
        const novo_modelo = await db.query(query_insert, [nome, descricao || null, porcent_necessidades, porcent_desejos, porcent_investimentos, usuario_id]);

        res.status(201).json({
            mensagem: "Planejamento criado com sucesso",
            modelo: novo_modelo.rows[0]
        });
    }

    catch(error){
        console.error("Erro ao criar modelo orçamentário:", error);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
});

app.get('/api/usuarios/:id/modelo-ativo', async (req, res) => {
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
        console.error("Erro ao buscar modelo ativo:", error);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
});

app.put('/api/usuarios/:id/modelo-ativo', async (req, res) => {
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
        console.error("Erro ao aplicar modelo ativo:", error);
        res.status(500).json({ erro: "Erro interno no servidor." });
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

app.get('/api/usuarios/:id/lancamentos', async (req, res) => {
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
        console.error("Erro ao listar lançamentos:", error);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
});

app.get('/api/usuarios/:id/ultimo-mes', async (req, res) => {
    const { id } = req.params;

    try {
        const resultado = await db.query(
            'SELECT ano, mes FROM lancamento_mensal WHERE usuario_id = $1 ORDER BY ano DESC, mes DESC LIMIT 1',
            [id]
        );

        res.status(200).json({ ultimo_mes: resultado.rows[0] || null });
    }

    catch(error){
        console.error("Erro ao buscar último mês informado:", error);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
});

app.get('/api/usuarios/:id/mes-editavel', async (req, res) => {
    const { id } = req.params;

    try {
        const mes_editavel = await obter_mes_editavel(id);
        res.status(200).json({ mes_editavel });
    }

    catch(error){
        console.error("Erro ao calcular mês editável:", error);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
});

app.post('/api/usuarios/:id/lancamentos', async (req, res) => {
    const { id } = req.params;
    const { ano, mes, tipo, nome, valor, parcela_atual, parcela_total } = req.body;

    try {
        const agora = new Date();
        const ano_atual = agora.getFullYear();
        const mes_atual = agora.getMonth() + 1;

        if(ano > ano_atual || (ano === ano_atual && mes > mes_atual)){
            return res.status(400).json({ erro: "Não é possível lançar informações de um mês que ainda não chegou." });
        }

        const mes_editavel = await obter_mes_editavel(id);

        if(ano !== mes_editavel.ano || mes !== mes_editavel.mes){
            return res.status(400).json({
                erro: `No momento só é possível lançar informações de ${String(mes_editavel.mes).padStart(2, '0')}/${mes_editavel.ano}.`
            });
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
        console.error("Erro ao criar lançamento:", error);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
});

app.delete('/api/lancamentos/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await db.query('DELETE FROM lancamento_mensal WHERE id = $1', [id]);
        res.status(200).json({ mensagem: "Lançamento removido com sucesso." });
    }

    catch(error){
        console.error("Erro ao remover lançamento:", error);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
});

app.put('/api/usuarios/:id/senha', async (req, res) => {
    const { id } = req.params;
    const { senha_antiga, senha_nova } = req.body;

    try {
        const usuario_existente = await db.query('SELECT senha FROM usuario WHERE id = $1', [id]);

        if(usuario_existente.rows.length === 0){
            return res.status(404).json({ erro: "Usuário não encontrado." });
        }

        const usuario = usuario_existente.rows[0];

        if(!usuario.senha){
            return res.status(400).json({ erro: "Esta conta usa login com Google e não tem senha cadastrada." });
        }

        const senha_correta = await bcrypt.compare(senha_antiga, usuario.senha);

        if(!senha_correta){
            return res.status(401).json({ erro: "Senha atual incorreta." });
        }

        const nova_senha_hash = await bcrypt.hash(senha_nova, 10);
        await db.query('UPDATE usuario SET senha = $1 WHERE id = $2', [nova_senha_hash, id]);

        res.status(200).json({ mensagem: "Senha alterada com sucesso." });
    }

    catch(error){
        console.error("Erro ao alterar senha:", error);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
});

app.delete('/api/usuarios/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const resultado = await db.query('DELETE FROM usuario WHERE id = $1 RETURNING id', [id]);

        if(resultado.rows.length === 0){
            return res.status(404).json({ erro: "Usuário não encontrado." });
        }

        res.status(200).json({ mensagem: "Perfil excluído com sucesso." });
    }

    catch(error){
        console.error("Erro ao excluir usuário:", error);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

const PORTA = process.env.PORT || 3000;

app.listen(PORTA, () => {
    console.log(`Servidor rodando em http://localhost:${PORTA}`);
});
