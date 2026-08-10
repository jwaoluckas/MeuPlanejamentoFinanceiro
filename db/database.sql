CREATE TABLE usuario(
	id BIGSERIAL,
	nome VARCHAR(70) NOT NULL,
	idade int,
	email VARCHAR(255) NOT NULL UNIQUE,
	senha VARCHAR(255),

	CHECK (idade >= 0),
	CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),

	PRIMARY KEY(id)
);

CREATE TABLE modelos_orcamentarios(
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
VALUES 
('Padrão 50-30-20', 'Regra clássica: 50% Necessidades, 30% Desejos e 20% Investimentos/Poupança.', 50, 30, 20, NULL),
('Conservador 60-30-10', 'Focado em estabilidade: 60% Necessidades, 30% Desejos e 10% Investimentos.', 60, 30, 10, NULL),
('Agressivo 40-30-30', 'Focado em aportar: 40% Necessidades, 30% Desejos e 30% Investimentos.', 40, 30, 30, NULL);

ALTER TABLE usuario ADD COLUMN modelo_ativo_id BIGINT REFERENCES modelos_orcamentarios(id);

CREATE TABLE lancamento_mensal(
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