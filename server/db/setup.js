// Creates the database named in DATABASE_URL (if missing) and applies schema.sql.
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const url = new URL(process.env.DATABASE_URL);
const dbName = url.pathname.slice(1);

const adminUrl = new URL(url);
adminUrl.pathname = '/postgres';
try {
  const admin = new pg.Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (!exists.rowCount) {
    await admin.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
    console.log(`Created database ${dbName}`);
  }
  await admin.end();
} catch (err) {
  // Hosted Postgres (Neon, Render) gives you the database already; carry on.
  console.log(`Skipping database creation: ${err.message}`);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const schema = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'schema.sql'), 'utf8');
await client.query(schema);
await client.end();
console.log('Schema is up to date.');
