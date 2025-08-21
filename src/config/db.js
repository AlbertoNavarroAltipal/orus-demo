const { Pool } = require("pg");

let pool;

function getPool() {
  if (!pool) {
    const ssl =
      process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false;
    pool = new Pool({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT || 5432),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl,
      max: Number(process.env.PGPOOL_MAX || 5),
      // Fail fast if connection cannot be established
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

async function withClient(fn) {
  const client = await getPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

module.exports = { getPool, withClient };
