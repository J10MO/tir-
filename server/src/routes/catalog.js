import { Router } from 'express';
import { query } from '../db.js';
import { handle, HttpError } from '../lib/http.js';
import { listProducts, getProduct } from '../lib/catalog.js';
import { GOVERNORATES, BAGHDAD_FEE, OTHER_FEE } from '../lib/shipping.js';

const router = Router();

router.get('/categories', handle(async (_req, res) => {
  const { rows } = await query(
    `SELECT c.id, c.slug, c.name,
            (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active)::int AS product_count
     FROM categories c ORDER BY c.sort, c.id`,
  );
  res.json(rows);
}));

router.get('/products', handle(async (req, res) => {
  const { category, size, q, sort, featured, limit } = req.query;
  res.json(await listProducts({ category, size, q, sort, featured: featured === '1', limit }));
}));

router.get('/products/:slug', handle(async (req, res) => {
  const product = await getProduct({ slug: req.params.slug });
  if (!product) throw new HttpError(404, 'هذا المنتج غير موجود أو لم يعد متوفراً');
  res.json(product);
}));

router.get('/images/:id', handle(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new HttpError(404, 'الصورة غير موجودة');
  const { rows } = await query('SELECT mime, data FROM images WHERE id = $1', [id]);
  if (!rows[0]) throw new HttpError(404, 'الصورة غير موجودة');
  res.set('Content-Type', rows[0].mime);
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.send(rows[0].data);
}));

router.get('/shipping', (_req, res) => {
  res.json({ governorates: GOVERNORATES, baghdadFee: BAGHDAD_FEE, otherFee: OTHER_FEE });
});

export default router;
