const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

const caminho_schema = path.join(__dirname, '..', 'db', 'database.sql');

async function migrar() {
    const sql_schema = fs.readFileSync(caminho_schema, 'utf8');
    const cliente = await pool.connect();

    try {
        await cliente.query('BEGIN');
        await cliente.query(sql_schema);
        await cliente.query('COMMIT');
        console.log('[migrate] Schema aplicado com sucesso a partir de db/database.sql.');
    } catch (erro) {
        await cliente.query('ROLLBACK');
        console.error('[migrate] Falha ao aplicar o schema, transação revertida:', erro);
        throw erro;
    } finally {
        cliente.release();
    }
}

migrar()
    .then(() => pool.end())
    .then(() => process.exit(0))
    .catch(() => {
        pool.end().finally(() => {
            process.exit(1);
        });
    });
