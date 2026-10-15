import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { readUser } from './lib/auth.js';
import { UPLOAD_DIR, CLIENT_DIST, SEED_IMAGES, SCHEMA_FILE } from './paths.js';
import { query } from './db.js';
import catalog from './routes/catalog.js';
import auth from './routes/auth.js';
import orders from './routes/orders.js';
import admin from './routes/admin.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(readUser);

// Launch product photos ship with the code; older local uploads are still served too.
app.use('/uploads/products', express.static(SEED_IMAGES, { maxAge: '7d' }));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

app.use('/api', catalog);
app.use('/api/auth', auth);
app.use('/api/orders', orders);
app.use('/api/admin', admin);

app.use('/api', (_req, res) => res.status(404).json({ error: 'المسار غير موجود' }));

// In production, serve the built React app.
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (_req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
}

app.use((err, _req, res, _next) => {
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 400 : 500);
  if (status === 500) console.error(err);
  const message = err.code === 'LIMIT_FILE_SIZE'
    ? 'حجم الصورة أكبر من 5 ميغابايت'
    : status === 500 ? 'حدث خطأ في الخادم. حاول مجدداً بعد قليل' : err.message;
  res.status(status).json({ error: message });
});

// Tables are created with IF NOT EXISTS, so applying the schema on every boot is safe.
await query(fs.readFileSync(SCHEMA_FILE, 'utf8'));

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`tir API on http://localhost:${port}`));
