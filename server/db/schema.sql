-- created using supabase, just establishing it here for reference schema
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_no        INTEGER     NOT NULL, -- per-user number shown in the app, filled in by the set_order_no trigger below
  user_id         UUID        NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  proxy_name      TEXT        NOT NULL,
  platform        TEXT        NOT NULL,
  recipient       TEXT        NOT NULL DEFAULT 'Me',
  order_date      DATE,
  tracking_number TEXT,
  tracking_carrier INTEGER,                          -- 17TRACK courier code
  tracking_events JSONB       NOT NULL DEFAULT '[]', -- latest tracking events from 17TRACK
  status          TEXT        NOT NULL DEFAULT 'ordered'
                  CHECK (status IN ('ordered', 'shipped', 'in_transit', 'delivered')),
  notes           TEXT
);

-- always on newest first
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders (user_id);

-- a user can never have the same order number twice
CREATE UNIQUE INDEX IF NOT EXISTS orders_user_order_no_idx ON orders (user_id, order_no);

-- new orders get that user's highest number + 1. Counts only that user's orders,
-- and a deleted latest order's number is reused.
CREATE OR REPLACE FUNCTION set_order_no() RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.order_no IS NULL THEN
    -- one insert at a time per user, so two quick saves can't get the same number
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::text, 0));
    SELECT COALESCE(MAX(order_no), 0) + 1 INTO NEW.order_no FROM orders WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS orders_set_order_no ON orders;
CREATE TRIGGER orders_set_order_no
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION set_order_no();

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

-- this is for the balance. to prevent out of sync, its calculation instead of storing the value
CREATE OR REPLACE VIEW order_totals WITH (security_invoker = true) AS
SELECT
  o.id AS order_id,
  COALESCE((SELECT SUM(price * quantity) FROM items WHERE order_id = o.id), 0) AS total,
  COALESCE((SELECT SUM(amount) FROM payments WHERE order_id = o.id), 0) AS paid,
  COALESCE((SELECT SUM(price * quantity) FROM items WHERE order_id = o.id), 0)
  - COALESCE((SELECT SUM(amount) FROM payments WHERE order_id = o.id), 0) AS balance
FROM orders o;

-- rls so its safe for multi users
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

-- for new users, create a profile row for them automatically
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
