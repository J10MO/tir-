CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  phone         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id    SERIAL PRIMARY KEY,
  slug  TEXT NOT NULL UNIQUE,
  name  TEXT NOT NULL,
  sort  INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id               SERIAL PRIMARY KEY,
  slug             TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  price            INT NOT NULL CHECK (price >= 0),           -- Iraqi dinar
  compare_at_price INT CHECK (compare_at_price IS NULL OR compare_at_price > price),
  category_id      INT REFERENCES categories(id) ON DELETE SET NULL,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  is_featured      BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_colors (
  id         SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  hex        TEXT NOT NULL DEFAULT '#888888',
  images     TEXT[] NOT NULL DEFAULT '{}',
  sort       INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS variants (
  id         SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color_id   INT NOT NULL REFERENCES product_colors(id) ON DELETE CASCADE,
  size       INT NOT NULL,
  stock      INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  UNIQUE (color_id, size)
);

CREATE TABLE IF NOT EXISTS orders (
  id            SERIAL PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  user_id       INT REFERENCES users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone         TEXT NOT NULL,
  governorate   TEXT NOT NULL,
  address       TEXT NOT NULL,
  notes         TEXT NOT NULL DEFAULT '',
  subtotal      INT NOT NULL,
  delivery_fee  INT NOT NULL,
  total         INT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'new'
                CHECK (status IN ('new', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id           SERIAL PRIMARY KEY,
  order_id     INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id   INT REFERENCES variants(id) ON DELETE SET NULL,
  product_id   INT REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  color_name   TEXT NOT NULL,
  size         INT NOT NULL,
  image        TEXT,
  unit_price   INT NOT NULL,
  qty          INT NOT NULL CHECK (qty > 0)
);

-- Admin-uploaded photos live in the database so they survive restarts on hosts
-- with temporary disks (Render free tier).
CREATE TABLE IF NOT EXISTS images (
  id         SERIAL PRIMARY KEY,
  mime       TEXT NOT NULL,
  data       BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_variants_product ON variants(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);
