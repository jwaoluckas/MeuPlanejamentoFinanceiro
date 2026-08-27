const jwt = require('jsonwebtoken');

const EXPIRACAO_TOKEN = '7d';

function gerar_token(usuario_id){
    return jwt.sign({ usuario_id }, process.env.JWT_SECRET, { expiresIn: EXPIRACAO_TOKEN });
}

function autenticar(req, res, next){
    const cabecalho = req.headers.authorization || '';
    const [tipo, token] = cabecalho.split(' ');

    if(tipo !== 'Bearer' || !token){
        return res.status(401).json({ erro: "Não autenticado." });
    }

    try{
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario_id = payload.usuario_id;
        next();
    }

    catch(erro){
        return res.status(401).json({ erro: "Sessão inválida ou expirada. Faça login novamente." });
    }
}

function exigir_dono_do_recurso(req, res, next){
    // usuario.id vem do Postgres como BIGINT e chega como string após ida e volta pelo JWT;
    // comparar como string evita falso-negativo de dono legítimo por causa do tipo.
    if(String(req.params.id) !== String(req.usuario_id)){
        return res.status(403).json({ erro: "Você não tem permissão para acessar este recurso." });
    }

    next();
}

module.exports = { gerar_token, autenticar, exigir_dono_do_recurso };
