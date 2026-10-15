import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const SERVER_ROOT = path.resolve(here, '..');
export const UPLOAD_DIR = path.join(SERVER_ROOT, 'uploads');
export const SEED_IMAGES = path.join(SERVER_ROOT, 'db', 'seed-images');
export const SCHEMA_FILE = path.join(SERVER_ROOT, 'db', 'schema.sql');
export const CLIENT_DIST = path.resolve(SERVER_ROOT, '..', 'client', 'dist');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
