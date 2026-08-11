const { Pool } = require('pg');

const local_connection_string = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
const connection_string = process.env.DATABASE_URL || local_connection_string;

const pool = new Pool({
    connectionString: connection_string,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

module.exports = {
    query: (texto, parametros) => pool.query(texto, parametros),
};
