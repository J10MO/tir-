// Seeds categories, the launch products, and the first admin.
// Product photos live in db/seed-images and are served at /uploads/products/.
// Safe to re-run: it skips anything that already exists.
import bcrypt from 'bcryptjs';
import { pool, tx } from '../src/db.js';


const CATEGORIES = [
  ['sport', 'رياضي'],
  ['chunky', 'نعل عالي'],
  ['casual', 'كاجوال'],
  ['first-steps', 'أول خطوة'],
  ['dress', 'رسمي'],
];

// Kids' sizes 23–30, as on the brand's size card.
const KIDS = [23, 24, 25, 26, 27, 28, 29, 30];
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

// Prices and stock are starting values: set the real ones from the admin panel.
const PRODUCTS = [
  { slug: 'ziggurat', name: 'سنيكرز بنعل مدرّج', category: 'chunky', price: 42000, featured: true, sizes: KIDS,
    description: 'حذاء رياضي بنعل عالي مدرّج يمسك الأرض جيداً. شبك يتنفس من الأعلى، وجلد شمواه على الكعب ومقدمة الحذاء، وأربطة سميكة سهلة الربط.',
    colors: [['رمادي وأزرق', '#6B6E72', 'ziggurat-grey'], ['أبيض وبيج', '#E9E6DF', 'ziggurat-white']] },
  { slug: 'ishtar', name: 'سنيكرز الأربطة العريضة', category: 'chunky', price: 45000, featured: true, sizes: KIDS,
    description: 'نعل عالي منحوت ولمسات فضية لامعة، مع أربطة عريضة مزدوجة وشريط لاصق يسهّل اللبس. خفيف رغم شكله الضخم.',
    colors: [['كريمي وفضي', '#E8E0CC', 'ishtar-cream']] },
  { slug: 'nineveh', name: 'سنيكرز أسود متموّج', category: 'chunky', price: 48000, featured: true, sizes: KIDS,
    description: 'أسود بالكامل بنعل متموّج وأربطة حبل سميكة. يناسب كل الملابس ولا تظهر عليه الأوساخ بسرعة.',
    colors: [['أسود', '#1E1E1E', 'nineveh-black']] },
  { slug: 'dilmun', name: 'رياضي بشريط لاصق', category: 'sport', price: 35000, featured: false, sizes: KIDS,
    description: 'حذاء رياضي خفيف بشريط لاصق وأربطة مرنة، يلبسه الطفل وحده بسهولة. شبك يتنفس ونعل مرن للركض واللعب.',
    colors: [['بيج وزيتوني', '#A49C84', 'dilmun-olive']] },
  { slug: 'uruk', name: 'كاجوال برسوم الحيوانات', category: 'casual', price: 32000, featured: true, sizes: KIDS,
    description: 'حذاء كاجوال برسوم حيوانات مطبوعة على الجانبين، بجلد ناعم سهل التنظيف ونعل مطاطي سميك.',
    colors: [['كريمي برسوم', '#EFE7D6', 'uruk-cartoon']] },

  // Added from free-licence stock photos (Pexels). Confirm you stock them before going live.
  { slug: 'nippur', name: 'حذاء قماشي لأول خطوة', category: 'first-steps', price: 22000, featured: false, sizes: range(18, 22),
    stock: { 18: 4, 19: 6, 20: 2, 21: 0, 22: 3 },
    description: 'حذاء قماشي طري لأول خطوات طفلك. نعل مرن رقيق يحسّ معه الطفل بالأرض، وشريط لاصق سهل الإغلاق.',
    colors: [['أصفر بنجوم', '#E8D46A', 'nippur-yellow']] },
  { slug: 'akkad', name: 'حذاء جلد برباط', category: 'first-steps', price: 28000, featured: false, sizes: range(18, 23),
    stock: { 18: 2, 19: 5, 20: 5, 21: 3, 22: 1, 23: 0 },
    description: 'جلد طبيعي ناعم بلون عسلي وأربطة قطنية طويلة. خفيف ومريح للأطفال في أول سنة مشي.',
    colors: [['بني عسلي', '#B7793A', 'akkad-brown']] },
  { slug: 'lagash', name: 'سنيكرز جينز', category: 'sport', price: 30000, featured: false, sizes: range(20, 25),
    stock: { 20: 3, 21: 4, 22: 0, 23: 6, 24: 2, 25: 4 },
    description: 'قماش جينز مع شريط لاصق وأربطة بيضاء، ومقدمة مطاطية تحمي أصابع القدم أثناء اللعب.',
    colors: [['جينز', '#2E3B5C', 'lagash-denim']] },
  { slug: 'mari', name: 'رياضي بشريطين لاصقين', category: 'sport', price: 34000, featured: true, sizes: range(22, 28),
    stock: { 22: 5, 23: 5, 24: 1, 25: 4, 26: 6, 27: 0, 28: 3 },
    description: 'حذاء رياضي بشريطين لاصقين بدل الأربطة، يلبسه الطفل وحده. شمواه رمادي وجلد أبيض ونعل مطاطي مرن.',
    colors: [['رمادي وأبيض', '#B9BCC0', 'mari-grey']] },
  { slug: 'sumer', name: 'حذاء بناتي بفيونكة', category: 'dress', price: 36000, featured: true, sizes: range(24, 30),
    stock: { 24: 3, 25: 5, 26: 2, 27: 4, 28: 0, 29: 3, 30: 2 },
    description: 'حذاء بناتي رسمي بجلد أسود لامع وفيونكة، مع حزام لاصق فوق القدم. للمناسبات والمدرسة.',
    colors: [['أسود بفيونكة', '#1E1E1E', 'sumer-black']] },
];

const STOCK = 5;

await tx(async client => {
  for (const [i, [slug, name]] of CATEGORIES.entries()) {
    await client.query('INSERT INTO categories (slug, name, sort) VALUES ($1, $2, $3) ON CONFLICT (slug) DO NOTHING', [slug, name, i]);
  }
  const { rows: catRows } = await client.query('SELECT id, slug FROM categories');
  const catId = Object.fromEntries(catRows.map(r => [r.slug, r.id]));

  for (const [i, p] of PRODUCTS.entries()) {
    const exists = await client.query('SELECT 1 FROM products WHERE slug = $1', [p.slug]);
    if (exists.rowCount) continue;

    const { rows: [prod] } = await client.query(
      `INSERT INTO products (slug, name, description, price, compare_at_price, category_id, is_featured, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now() - ($8 || ' hours')::interval) RETURNING id`,
      [p.slug, p.name, p.description, p.price, p.compare ?? null, catId[p.category], p.featured, i]);

    for (const [j, [colorName, hex, photo]] of p.colors.entries()) {
      const { rows: [color] } = await client.query(
        'INSERT INTO product_colors (product_id, name, hex, images, sort) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [prod.id, colorName, hex, [`/uploads/products/${photo}.webp`], j]);
      for (const size of p.sizes) {
        await client.query('INSERT INTO variants (product_id, color_id, size, stock) VALUES ($1, $2, $3, $4)',
          [prod.id, color.id, size, p.stock?.[size] ?? STOCK]);
      }
    }
    console.log(`Added ${p.name}`);
  }

  const { ADMIN_NAME = 'مدير تير', ADMIN_PHONE, ADMIN_PASSWORD } = process.env;
  if (ADMIN_PHONE && ADMIN_PASSWORD) {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const r = await client.query(
      `INSERT INTO users (name, phone, password_hash, role) VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (phone) DO UPDATE SET role = 'admin' RETURNING (xmax = 0) AS inserted`,
      [ADMIN_NAME, ADMIN_PHONE, hash]);
    console.log(r.rows[0].inserted ? `Created admin ${ADMIN_PHONE}` : `${ADMIN_PHONE} is an admin`);
  } else {
    console.log('Set ADMIN_PHONE and ADMIN_PASSWORD in .env to create the admin account.');
  }
});

await pool.end();
console.log('Seed complete.');
