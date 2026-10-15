import { Router } from 'express';
import multer from 'multer';
import { query, tx } from '../db.js';
import { handle, HttpError, requireFields, slugify } from '../lib/http.js';
import { requireAdmin } from '../lib/auth.js';
import { listProducts, getProduct } from '../lib/catalog.js';
import { withItems } from './orders.js';

const router = Router();
router.use(requireAdmin);

/* ---------- Dashboard ---------- */

router.get('/stats', handle(async (_req, res) => {
  const { rows: [totals] } = await query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'new')::int AS new_orders,
      COUNT(*) FILTER (WHERE status IN ('confirmed', 'shipped'))::int AS in_progress,
      COALESCE(SUM(total) FILTER (WHERE status = 'delivered' AND created_at >= date_trunc('month', now())), 0)::int AS month_revenue,
      COUNT(*) FILTER (WHERE created_at >= date_trunc('month', now()) AND status <> 'cancelled')::int AS month_orders
    FROM orders`);
  const { rows: lowStock } = await query(`
    SELECT p.id AS product_id, p.name, pc.name AS color_name, v.size, v.stock
    FROM variants v JOIN products p ON p.id = v.product_id JOIN product_colors pc ON pc.id = v.color_id
    WHERE p.is_active AND v.stock <= 2
    ORDER BY v.stock, p.name, v.size LIMIT 12`);
  const { rows: recent } = await query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 6');
  res.json({ ...totals, lowStock, recent });
}));

/* ---------- Orders ---------- */

const NEXT_STATUS = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

router.get('/orders', handle(async (req, res) => {
  const params = [];
  const where = [];
  if (req.query.status) { params.push(req.query.status); where.push(`status = $${params.length}`); }
  if (req.query.q) {
    params.push(`%${req.query.q}%`);
    where.push(`(code ILIKE $${params.length} OR phone ILIKE $${params.length} OR customer_name ILIKE $${params.length})`);
  }
  const { rows } = await query(
    `SELECT o.*, (SELECT SUM(qty) FROM order_items i WHERE i.order_id = o.id)::int AS pairs
     FROM orders o ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY created_at DESC LIMIT 200`,
    params,
  );
  res.json(rows);
}));

router.get('/orders/:id', handle(async (req, res) => {
  const { rows } = await query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  if (!rows[0]) throw new HttpError(404, 'الطلب غير موجود');
  const [order] = await withItems(rows);
  res.json({ ...order, next: NEXT_STATUS[order.status] });
}));

router.patch('/orders/:id', handle(async (req, res) => {
  const { status } = req.body ?? {};
  const order = await tx(async client => {
    const { rows } = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [req.params.id]);
    const current = rows[0];
    if (!current) throw new HttpError(404, 'الطلب غير موجود');
    if (!NEXT_STATUS[current.status].includes(status)) {
      throw new HttpError(400, 'لا يمكن نقل الطلب إلى هذه الحالة');
    }
    if (status === 'cancelled') {
      // Put the pairs back on the shelf.
      await client.query(
        `UPDATE variants v SET stock = v.stock + i.qty
         FROM order_items i WHERE i.order_id = $1 AND i.variant_id = v.id`,
        [current.id],
      );
    }
    const { rows: [updated] } = await client.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, current.id]);
    return updated;
  });
  const [full] = await withItems([order]);
  res.json({ ...full, next: NEXT_STATUS[full.status] });
}));

/* ---------- Products ---------- */

router.get('/products', handle(async (req, res) => {
  res.json(await listProducts({ q: req.query.q, includeInactive: true }));
}));

router.get('/products/:id', handle(async (req, res) => {
  const product = await getProduct({ id: req.params.id, includeInactive: true });
  if (!product) throw new HttpError(404, 'المنتج غير موجود');
  res.json(product);
}));

function validateProduct(body) {
  requireFields(body, { name: 'اسم المنتج', price: 'السعر' });
  const price = Number(body.price);
  if (!Number.isInteger(price) || price < 0) throw new HttpError(400, 'السعر يجب أن يكون رقماً صحيحاً بالدينار');
  const compare = body.compareAtPrice ? Number(body.compareAtPrice) : null;
  if (compare !== null && (!Number.isInteger(compare) || compare <= price)) {
    throw new HttpError(400, 'السعر قبل الخصم يجب أن يكون أعلى من السعر الحالي');
  }
  const colors = Array.isArray(body.colors) ? body.colors : [];
  if (!colors.length) throw new HttpError(400, 'أضف لوناً واحداً على الأقل');
  for (const c of colors) {
    if (!String(c.name ?? '').trim()) throw new HttpError(400, 'كل لون يحتاج اسماً');
    const sizes = new Set();
    for (const v of c.variants ?? []) {
      const size = Number(v.size);
      const stock = Number(v.stock);
      if (!Number.isInteger(size) || size < 15 || size > 50) throw new HttpError(400, `مقاس غير صحيح في لون ${c.name}`);
      if (!Number.isInteger(stock) || stock < 0) throw new HttpError(400, `كمية غير صحيحة لمقاس ${size} في لون ${c.name}`);
      if (sizes.has(size)) throw new HttpError(400, `المقاس ${size} مكرر في لون ${c.name}`);
      sizes.add(size);
    }
  }
  return { price, compare, colors };
}

async function saveColors(client, productId, colors) {
  const keep = colors.filter(c => c.id).map(c => Number(c.id));
  await client.query(
    'DELETE FROM product_colors WHERE product_id = $1 AND NOT (id = ANY($2))', [productId, keep]);

  for (const [i, c] of colors.entries()) {
    let colorId = c.id ? Number(c.id) : null;
    const images = (c.images ?? []).filter(Boolean);
    if (colorId) {
      const r = await client.query(
        'UPDATE product_colors SET name = $1, hex = $2, images = $3, sort = $4 WHERE id = $5 AND product_id = $6',
        [c.name.trim(), c.hex || '#888888', images, i, colorId, productId]);
      if (!r.rowCount) colorId = null;
    }
    if (!colorId) {
      const { rows } = await client.query(
        'INSERT INTO product_colors (product_id, name, hex, images, sort) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [productId, c.name.trim(), c.hex || '#888888', images, i]);
      colorId = rows[0].id;
    }
    const sizes = (c.variants ?? []).map(v => Number(v.size));
    await client.query('DELETE FROM variants WHERE color_id = $1 AND NOT (size = ANY($2))', [colorId, sizes]);
    for (const v of c.variants ?? []) {
      await client.query(
        `INSERT INTO variants (product_id, color_id, size, stock) VALUES ($1, $2, $3, $4)
         ON CONFLICT (color_id, size) DO UPDATE SET stock = EXCLUDED.stock`,
        [productId, colorId, Number(v.size), Number(v.stock)]);
    }
  }
}

async function uniqueSlug(client, base, exceptId = null) {
  let slug = base;
  for (let n = 2; ; n++) {
    const { rowCount } = await client.query(
      'SELECT 1 FROM products WHERE slug = $1 AND id IS DISTINCT FROM $2', [slug, exceptId]);
    if (!rowCount) return slug;
    slug = `${base}-${n}`;
  }
}

router.post('/products', handle(async (req, res) => {
  const { price, compare, colors } = validateProduct(req.body);
  const b = req.body;
  const id = await tx(async client => {
    const slug = await uniqueSlug(client, slugify(b.slug || b.name));
    const { rows } = await client.query(
      `INSERT INTO products (slug, name, description, price, compare_at_price, category_id, is_active, is_featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [slug, b.name.trim(), b.description ?? '', price, compare, b.categoryId || null, b.isActive !== false, !!b.isFeatured]);
    await saveColors(client, rows[0].id, colors);
    return rows[0].id;
  });
  res.status(201).json(await getProduct({ id, includeInactive: true }));
}));

router.put('/products/:id', handle(async (req, res) => {
  const { price, compare, colors } = validateProduct(req.body);
  const b = req.body;
  const id = Number(req.params.id);
  await tx(async client => {
    const slug = await uniqueSlug(client, slugify(b.slug || b.name), id);
    const r = await client.query(
      `UPDATE products SET slug = $1, name = $2, description = $3, price = $4, compare_at_price = $5,
              category_id = $6, is_active = $7, is_featured = $8
       WHERE id = $9`,
      [slug, b.name.trim(), b.description ?? '', price, compare, b.categoryId || null, b.isActive !== false, !!b.isFeatured, id]);
    if (!r.rowCount) throw new HttpError(404, 'المنتج غير موجود');
    await saveColors(client, id, colors);
  });
  res.json(await getProduct({ id, includeInactive: true }));
}));

// Products that appear in orders are hidden rather than deleted, so order history stays intact.
router.delete('/products/:id', handle(async (req, res) => {
  const { rowCount: ordered } = await query('SELECT 1 FROM order_items WHERE product_id = $1 LIMIT 1', [req.params.id]);
  if (ordered) {
    await query('UPDATE products SET is_active = false WHERE id = $1', [req.params.id]);
    return res.json({ hidden: true });
  }
  await query('DELETE FROM products WHERE id = $1', [req.params.id]);
  res.json({ deleted: true });
}));

/* ---------- Categories ---------- */

router.post('/categories', handle(async (req, res) => {
  requireFields(req.body, { name: 'اسم القسم' });
  const { rows } = await query(
    'INSERT INTO categories (slug, name, sort) VALUES ($1, $2, (SELECT COALESCE(MAX(sort), 0) + 1 FROM categories)) RETURNING *',
    [slugify(req.body.slug || req.body.name), req.body.name.trim()]);
  res.status(201).json(rows[0]);
}));

/* ---------- Image uploads ---------- */

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    cb(/^image\/(jpeg|png|webp)$/.test(file.mimetype) ? null : new HttpError(400, 'ارفع صورة بصيغة JPG أو PNG أو WEBP'), true),
});

router.post('/uploads', upload.single('image'), handle(async (req, res) => {
  if (!req.file) throw new HttpError(400, 'اختر صورة لرفعها');
  const { rows } = await query('INSERT INTO images (mime, data) VALUES ($1, $2) RETURNING id', [req.file.mimetype, req.file.buffer]);
  res.status(201).json({ url: `/api/images/${rows[0].id}` });
}));

export default router;
