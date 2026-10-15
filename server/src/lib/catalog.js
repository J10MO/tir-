import { query } from '../db.js';

// Shared SELECT for product cards: colours with their first image, and sizes in stock.
const CARD_SELECT = `
  SELECT p.id, p.slug, p.name, p.price, p.compare_at_price, p.is_featured, p.is_active, p.created_at,
         c.slug AS category_slug, c.name AS category_name,
         COALESCE((
           SELECT json_agg(json_build_object('id', pc.id, 'name', pc.name, 'hex', pc.hex, 'image', pc.images[1]) ORDER BY pc.sort, pc.id)
           FROM product_colors pc WHERE pc.product_id = p.id
         ), '[]') AS colors,
         COALESCE((
           SELECT array_agg(DISTINCT v.size ORDER BY v.size) FROM variants v WHERE v.product_id = p.id AND v.stock > 0
         ), '{}') AS sizes,
         COALESCE((SELECT SUM(v.stock) FROM variants v WHERE v.product_id = p.id), 0)::int AS total_stock
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id`;

const SORTS = {
  new: 'p.created_at DESC, p.id DESC',
  price_asc: 'p.price ASC, p.id',
  price_desc: 'p.price DESC, p.id',
};

export async function listProducts({ category, size, q, sort, featured, includeInactive = false, limit } = {}) {
  const where = [];
  const params = [];
  const add = v => { params.push(v); return `$${params.length}`; };

  if (!includeInactive) where.push('p.is_active');
  if (category) where.push(`c.slug = ${add(category)}`);
  if (featured) where.push('p.is_featured');
  if (q) {
    const term = add(`%${q}%`);
    where.push(`(p.name ILIKE ${term} OR p.description ILIKE ${term} OR c.name ILIKE ${term}
      OR EXISTS (SELECT 1 FROM product_colors pc WHERE pc.product_id = p.id AND pc.name ILIKE ${term}))`);
  }
  if (size) where.push(`EXISTS (SELECT 1 FROM variants v WHERE v.product_id = p.id AND v.size = ${add(Number(size))} AND v.stock > 0)`);

  const sql = `${CARD_SELECT}
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY ${SORTS[sort] || SORTS.new}
    ${limit ? `LIMIT ${add(Number(limit))}` : ''}`;
  const { rows } = await query(sql, params);
  return rows;
}

export async function getProduct({ slug, id, includeInactive = false }) {
  const { rows } = await query(
    `SELECT p.*, c.slug AS category_slug, c.name AS category_name
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE ${slug ? 'p.slug = $1' : 'p.id = $1'} ${includeInactive ? '' : 'AND p.is_active'}`,
    [slug ?? id],
  );
  const product = rows[0];
  if (!product) return null;

  const colors = await query(
    `SELECT pc.id, pc.name, pc.hex, pc.images,
            COALESCE(json_agg(json_build_object('id', v.id, 'size', v.size, 'stock', v.stock) ORDER BY v.size)
                     FILTER (WHERE v.id IS NOT NULL), '[]') AS variants
     FROM product_colors pc LEFT JOIN variants v ON v.color_id = pc.id
     WHERE pc.product_id = $1
     GROUP BY pc.id ORDER BY pc.sort, pc.id`,
    [product.id],
  );
  product.colors = colors.rows;
  return product;
}
