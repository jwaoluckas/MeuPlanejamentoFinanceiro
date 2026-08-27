CREATE TABLE IF NOT EXISTS usuario(
	id BIGSERIAL,
	nome VARCHAR(70) NOT NULL,
	idade int,
	email VARCHAR(255) NOT NULL UNIQUE,
	senha VARCHAR(255),

	CHECK (idade >= 0),
	CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),

	PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS modelos_orcamentarios(
	id BIGSERIAL,
	nome VARCHAR(100) NOT NULL,
	descricao TEXT,
	porcent_necessidades INT NOT NULL,
	porcent_desejos INT NOT NULL,
	porcent_investimentos INT NOT NULL,
	usuario_id BIGINT,

	CHECK (porcent_necessidades >= 0),
    CHECK (porcent_desejos >= 0),
    CHECK (porcent_investimentos >= 0),
	CHECK (porcent_necessidades + porcent_desejos + porcent_investimentos = 100),

	PRIMARY KEY(id),
	FOREIGN KEY(usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
);

INSERT INTO modelos_orcamentarios (nome, descricao, porcent_necessidades, porcent_desejos, porcent_investimentos, usuario_id)
SELECT * FROM (VALUES
	('Padrão 50-30-20', 'Regra clássica: 50% Necessidades, 30% Desejos e 20% Investimentos/Poupança.', 50, 30, 20, NULL::BIGINT),
	('Conservador 60-30-10', 'Focado em estabilidade: 60% Necessidades, 30% Desejos e 10% Investimentos.', 60, 30, 10, NULL::BIGINT),
	('Agressivo 40-30-30', 'Focado em aportar: 40% Necessidades, 30% Desejos e 30% Investimentos.', 40, 30, 30, NULL::BIGINT)
) AS modelos_padrao(nome, descricao, porcent_necessidades, porcent_desejos, porcent_investimentos, usuario_id)
WHERE NOT EXISTS (SELECT 1 FROM modelos_orcamentarios WHERE usuario_id IS NULL);

ALTER TABLE usuario ADD COLUMN IF NOT EXISTS modelo_ativo_id BIGINT REFERENCES modelos_orcamentarios(id);

CREATE TABLE IF NOT EXISTS lancamento_mensal(
	id BIGSERIAL,
	usuario_id BIGINT NOT NULL,
	ano INT NOT NULL,
	mes INT NOT NULL,
	tipo VARCHAR(20) NOT NULL,
	nome VARCHAR(100) NOT NULL,
	valor NUMERIC(12,2) NOT NULL,
	parcela_atual INT,
	parcela_total INT,

	CHECK (mes BETWEEN 1 AND 12),
	CHECK (valor >= 0),
	CHECK (tipo IN ('renda', 'necessario', 'desejo', 'investimento')),
	CHECK (
		(parcela_atual IS NULL AND parcela_total IS NULL)
		OR (parcela_atual IS NOT NULL AND parcela_total IS NOT NULL AND parcela_atual >= 1 AND parcela_total >= parcela_atual)
	),

	PRIMARY KEY(id),
	FOREIGN KEY(usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
);

ALTER TABLE usuario ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS codigo_verificacao(
	id BIGSERIAL,
	usuario_id BIGINT,
	codigo VARCHAR(6) NOT NULL,
	tipo VARCHAR(30) NOT NULL,
	criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
	expira_em TIMESTAMP NOT NULL,
	usado BOOLEAN NOT NULL DEFAULT false,

	CHECK (tipo IN ('confirmacao_email', 'redefinicao_senha')),

	PRIMARY KEY(id),
	FOREIGN KEY(usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cadastro_pendente(
	id BIGSERIAL,
	nome VARCHAR(70) NOT NULL,
	email VARCHAR(255) NOT NULL UNIQUE,
	senha_hash VARCHAR(255) NOT NULL,
	criado_em TIMESTAMP NOT NULL DEFAULT NOW(),

	CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),

	PRIMARY KEY(id)
);

-- A conta só é criada em `usuario` depois que o código de confirmacao_email é validado;
-- até lá, o código fica vinculado ao cadastro_pendente, não a um usuario_id.
ALTER TABLE codigo_verificacao ALTER COLUMN usuario_id DROP NOT NULL;
ALTER TABLE codigo_verificacao ADD COLUMN IF NOT EXISTS cadastro_pendente_id BIGINT REFERENCES cadastro_pendente(id) ON DELETE CASCADE;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'codigo_verificacao_referencia_valida'
	) THEN
		ALTER TABLE codigo_verificacao ADD CONSTRAINT codigo_verificacao_referencia_valida CHECK (
			(tipo = 'redefinicao_senha' AND usuario_id IS NOT NULL AND cadastro_pendente_id IS NULL)
			OR (tipo = 'confirmacao_email' AND cadastro_pendente_id IS NOT NULL AND usuario_id IS NULL)
		);
	END IF;
END $$;

-- Substitui o limitador de tentativas de código que antes vivia em memória (Map): agora persiste
-- no banco, sobrevivendo a reinícios do processo e funcionando com múltiplas instâncias.
CREATE TABLE IF NOT EXISTS tentativa_verificacao(
	identificador VARCHAR(255) NOT NULL,
	tipo VARCHAR(30) NOT NULL,
	tentativas INT NOT NULL DEFAULT 0,
	atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),

	CHECK (tipo IN ('confirmacao_email', 'redefinicao_senha')),

	PRIMARY KEY(identificador, tipo)
);
