// test_connection.js
import mysql from 'mysql2/promise';

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'gruporogerio.mysql.dbaas.com.br',
      user: 'gruporogerio',
      password: 'senhaAqui',
      database: 'gruporogerio'
    });
    const [rows] = await conn.query('SELECT 1+1 AS resultado');
    console.log('Conexão OK — resultado:', rows);
    await conn.end();
  } catch (err) {
    console.error('Erro de conexão ao MySQL:', err);
    process.exit(1);
  }
})();
