import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pool from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  const schema = await readFile(path.join(__dirname, '../sql/schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('Database initialized: tables ready.');
} catch (err) {
  console.error('Failed to initialize database:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}