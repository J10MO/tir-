import { Router } from 'express';
import crypto from 'node:crypto';
import { query, tx } from '../db.js';
import { handle, HttpError, requireFields, normalizePhone } from '../lib/http.js';
import { requireUser } from '../lib/auth.js';
import { GOVERNORATES, deliveryFee } from '../lib/shipping.js';

const router = Router();

const MAX_QTY = 5;

// Short, unambiguous order code customers can read over the phone, e.g. TIR-7KQ4M2
function orderCode() {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = crypto.randomBytes(6);
  return 'TIR-' + Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
}

async function loadItems(orderIds) {
  const { rows } = await query(
    `SELECT order_id, product_id, product_name, color_name, size, image, unit_price, qty
     FROM order_items WHERE order_id = ANY($1) ORDER BY id`,
    [orderIds],
  );
  return rows;
}

export async function withItems(orders) {
  if (!orders.length) return orders;
  const items = await loadItems(orders.map(o => o.id));
  return orders.map(o => ({ ...o, items: items.filter(i => i.order_id === o.id) }));
}

router.post('/', handle(async (req, res) => {
  const { customer = {}, items } = req.body ?? {};
  requireFields(customer, { name: 'الاسم', phone: 'رقم الهاتف', governorate: 'المحافظة', address: 'العنوان' });
  const phone = normalizePhone(customer.phone);
  if (!GOVERNORATES.includes(customer.governorate)) throw new HttpError(400, 'اختر محافظة من القائمة');
  if (!Array.isArray(items) || !items.length) throw new HttpError(400, 'سلتك فارغة');

  // Merge duplicate lines and validate quantities.
  const wanted = new Map();
  for (const { variantId, qty } of items) {
    const id = Number(variantId);
    const n = Number(qty);
    if (!Number.isInteger(id) || !Number.isInteger(n) || n < 1) throw new HttpError(400, 'كمية غير صحيحة في السلة');
    wanted.set(id, (wanted.get(id) || 0) + n);
  }
  for (const n of wanted.values()) {
    if (n > MAX_QTY) throw new HttpError(400, `الحد الأقصى ${MAX_QTY} أزواج من نفس المقاس`);
  }

  const order = await tx(async client => {
    // Lock the rows so two customers can't buy the last pair at once.
    const { rows: variants } = await client.query(
      `SELECT v.id, v.size, v.stock, p.id AS product_id, p.name AS product_name, p.price, p.is_active,
              pc.name AS color_name, pc.images[1] AS image
       FROM variants v
       JOIN products p ON p.id = v.product_id
       JOIN product_colors pc ON pc.id = v.color_id
       WHERE v.id = ANY($1) FOR UPDATE OF v`,
      [[...wanted.keys()]],
    );

    if (variants.length !== wanted.size || variants.some(v => !v.is_active)) {
      throw new HttpError(409, 'أحد المنتجات في سلتك لم يعد متوفراً. احذفه من السلة وحاول مجدداً');
    }
    for (const v of variants) {
      const n = wanted.get(v.id);
      if (v.stock < n) {
        throw new HttpError(409, v.stock === 0
          ? `نفد مقاس ${v.size} من ${v.product_name} (${v.color_name})`
          : `بقي ${v.stock} فقط من ${v.product_name} مقاس ${v.size}. عدّل الكمية في السلة`);
      }
    }

    const subtotal = variants.reduce((sum, v) => sum + v.price * wanted.get(v.id), 0);
    const fee = deliveryFee(customer.governorate);

    const { rows: [created] } = await client.query(
      `INSERT INTO orders (code, user_id, customer_name, phone, governorate, address, notes, subtotal, delivery_fee, total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [orderCode(), req.user?.id ?? null, customer.name.trim(), phone, customer.governorate,
        customer.address.trim(), String(customer.notes ?? '').trim(), subtotal, fee, subtotal + fee],
    );

    for (const v of variants) {
      const n = wanted.get(v.id);
      await client.query('UPDATE variants SET stock = stock - $1 WHERE id = $2', [n, v.id]);
      await client.query(
        `INSERT INTO order_items (order_id, variant_id, product_id, product_name, color_name, size, image, unit_price, qty)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [created.id, v.id, v.product_id, v.product_name, v.color_name, v.size, v.image, v.price, n],
      );
    }
    return created;
  });

  const [full] = await withItems([order]);
  res.status(201).json(full);
}));

// Guests track an order with its code plus the phone number used.
router.get('/track', handle(async (req, res) => {
  requireFields(req.query, { code: 'رقم الطلب', phone: 'رقم الهاتف' });
  const phone = normalizePhone(req.query.phone);
  const { rows } = await query(
    'SELECT * FROM orders WHERE code = $1 AND phone = $2',
    [String(req.query.code).trim().toUpperCase(), phone],
  );
  if (!rows[0]) throw new HttpError(404, 'لم نجد طلباً بهذا الرقم وهذا الهاتف. تأكد منهما وحاول مجدداً');
  const [full] = await withItems(rows);
  res.json(full);
}));

router.get('/mine', requireUser, handle(async (req, res) => {
  const { rows } = await query(
    `SELECT o.* FROM orders o
     WHERE o.user_id = $1 OR o.phone = (SELECT phone FROM users WHERE id = $1)
     ORDER BY o.created_at DESC`,
    [req.user.id],
  );
  res.json(await withItems(rows));
}));

export default router;
