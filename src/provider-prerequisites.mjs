import { createServer, createConnection } from 'node:net';
import mysql from 'mysql2/promise';

export async function portAvailable(port) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', error => error.code === 'EADDRINUSE' ? resolve(false) : reject(error));
    server.listen({ host: '127.0.0.1', port: Number(port), exclusive: true }, () => server.close(() => resolve(true)));
  });
}
export async function listenerPresent(port) {
  return new Promise(resolve => {
    const socket = createConnection({ host: '127.0.0.1', port: Number(port) });
    const finish = value => { socket.destroy(); resolve(value); };
    socket.once('connect', () => finish(true)); socket.once('error', () => finish(false));
    socket.setTimeout(1000, () => finish(true)); // A timed-out port is not proven free.
  });
}
export async function checkProviderDatabase(env) {
  let connection;
  try {
    connection = await mysql.createConnection({ host: env.AGENT_PROVIDER_DB_HOST, port: Number(env.AGENT_PROVIDER_DB_PORT),
      user: env.AGENT_PROVIDER_DB_USER, password: env.AGENT_PROVIDER_DB_PASSWORD || '', database: env.AGENT_PROVIDER_DB_NAME, connectTimeout: 5000 });
    await connection.query('SELECT 1');
    return { ok: true };
  } catch (error) {
    const instructions = { ECONNREFUSED: 'Check your MySQL host/port and that your database server is running.',
      ER_ACCESS_DENIED_ERROR: 'Ask your database administrator to check your database username/password and allowed client host.',
      ER_BAD_DB_ERROR: 'Ask your database administrator to create the configured Provider execution database.',
      ER_DBACCESS_DENIED_ERROR: 'Ask your database administrator to grant access to your Provider execution database.' };
    return { ok: false, code: error.code || 'DB_CONNECTION_FAILED',
      message: instructions[error.code] || 'Check the connection details with your own database administrator.',
      note: 'This read-only check does not prove table-creation or execution-write permissions.' };
  } finally { if (connection) await connection.end().catch(() => {}); }
}
