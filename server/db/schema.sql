-- The complete shape of the database. Safe to run against an empty database,
-- and safe to run twice.
--
-- This file is committed on purpose. Your schema is a fact about your
-- application, not a runtime concern: it should be readable by opening a file
-- rather than by connecting to a server. It is also what lets you move to a
-- hosted database in one command.
--
-- Users and passwords are handled entirely by Supabase Auth (the auth.users
-- table), which already exists on a Supabase project and is not created here.

CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id         UUID        NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  proxy_name      TEXT        NOT NULL,
  platform        TEXT        NOT NULL,
  recipient       TEXT        NOT NULL DEFAULT 'Me',
  order_date      DATE,
  tracking_number TEXT,
  status          TEXT        NOT NULL DEFAULT 'ordered'
                  CHECK (status IN ('ordered', 'shipped', 'in_transit', 'delivered')),
  notes           TEXT
);

-- The Orders list always sorts newest first. Without this the database reads
-- every row and sorts it on each request.
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders (user_id);

CREATE TABLE IF NOT EXISTS items (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id  BIGINT         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  name      TEXT           NOT NULL,
  price     NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  quantity  INTEGER        NOT NULL DEFAULT 1 CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS items_order_id_idx ON items (order_id);

CREATE TABLE IF NOT EXISTS payments (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id  BIGINT         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount    NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  paid_on   DATE           NOT NULL DEFAULT CURRENT_DATE,
  method    TEXT,
  note      TEXT
);

CREATE INDEX IF NOT EXISTS payments_order_id_idx ON payments (order_id);

-- The balance is always derived here, never stored, so it cannot go stale
-- when an item or payment changes elsewhere.
CREATE OR REPLACE VIEW order_totals WITH (security_invoker = true) AS
SELECT
  o.id AS order_id,
  COALESCE((SELECT SUM(price * quantity) FROM items WHERE order_id = o.id), 0) AS total,
  COALESCE((SELECT SUM(amount) FROM payments WHERE order_id = o.id), 0) AS paid,
  COALESCE((SELECT SUM(price * quantity) FROM items WHERE order_id = o.id), 0)
  - COALESCE((SELECT SUM(amount) FROM payments WHERE order_id = o.id), 0) AS balance
FROM orders o;

-- Row Level Security: a belt-and-suspenders layer alongside the ownership
-- checks the Express routes do themselves. Even if a query forgot its
-- WHERE user_id = $1, Postgres still would not hand back someone else's rows.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read own profile" ON profiles;
CREATE POLICY "read own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "update own profile" ON profiles;
CREATE POLICY "update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "own orders" ON orders;
CREATE POLICY "own orders" ON orders
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "own items" ON items;
CREATE POLICY "own items" ON items
  FOR ALL USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

DROP POLICY IF EXISTS "own payments" ON payments;
CREATE POLICY "own payments" ON payments
  FOR ALL USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- Auto-create a profile row whenever someone signs up through Supabase Auth.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Drop the template's leftover table. Safe to run even if it was never created.
DROP TABLE IF EXISTS sightings;