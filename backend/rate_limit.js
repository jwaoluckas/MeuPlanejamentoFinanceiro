const rateLimit = require('express-rate-limit');

// Identifica a tentativa pelo e-mail (ou cadastro_pendente_id, nos fluxos de confirmação de e-mail)
// em vez do IP, para barrar também ataques distribuídos contra uma mesma conta.
function chave_por_identidade(req){
    const identidade = (req.body && (req.body.email || req.body.cadastro_pendente_id)) || 'sem-identificador';
    return String(identidade).trim().toLowerCase();
}

function criar_limitador({ janela_minutos, limite, mensagem, por_identidade = false }){
    return rateLimit({
        windowMs: janela_minutos * 60 * 1000,
        max: limite,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: por_identidade ? chave_por_identidade : undefined,
        handler: (req, res) => {
            res.status(429).json({ erro: mensagem });
        }
    });
}

module.exports = {
    limitador_login_ip: criar_limitador({
        janela_minutos: 15,
        limite: 20,
        mensagem: "Muitas tentativas de login a partir deste endereço. Aguarde alguns minutos e tente novamente."
    }),

    limitador_login_email: criar_limitador({
        janela_minutos: 15,
        limite: 8,
        mensagem: "Muitas tentativas de login para esta conta. Aguarde alguns minutos e tente novamente.",
        por_identidade: true
    }),

    limitador_cadastro_ip: criar_limitador({
        janela_minutos: 60,
        limite: 10,
        mensagem: "Muitas tentativas de cadastro a partir deste endereço. Tente novamente mais tarde."
    }),

    limitador_cadastro_email: criar_limitador({
        janela_minutos: 60,
        limite: 3,
        mensagem: "Muitas tentativas de cadastro para este e-mail. Tente novamente mais tarde.",
        por_identidade: true
    }),

    limitador_codigo_ip: criar_limitador({
        janela_minutos: 15,
        limite: 20,
        mensagem: "Muitas tentativas a partir deste endereço. Aguarde alguns minutos e tente novamente."
    }),

    limitador_codigo_email: criar_limitador({
        janela_minutos: 15,
        limite: 8,
        mensagem: "Muitas tentativas para esta conta. Aguarde alguns minutos e tente novamente.",
        por_identidade: true
    })
};
