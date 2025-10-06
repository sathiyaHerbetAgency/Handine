-- make sure the uuid extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id            UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID      NOT NULL REFERENCES users(id),
  name          TEXT      NOT NULL,
  slug          TEXT      NOT NULL UNIQUE,              -- for public URL lookup
  description   TEXT,
  banner_image  TEXT,
  logo_image    TEXT,
  primary_color TEXT      DEFAULT '#f97316',
  font_family   TEXT      DEFAULT 'Inter',
  is_published  BOOLEAN   DEFAULT FALSE,                -- control RLS visibility
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- trigger function to auto‑update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- attach trigger to restaurants
DROP TRIGGER IF EXISTS trg_set_updated_at_restaurants ON restaurants;
CREATE TRIGGER trg_set_updated_at_restaurants
  BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Create menu_sections table
CREATE TABLE IF NOT EXISTS menu_sections (
  id            UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID      NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          TEXT      NOT NULL,
  description   TEXT,
  display_order INTEGER   NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_set_updated_at_menu_sections ON menu_sections;
CREATE TRIGGER trg_set_updated_at_menu_sections
  BEFORE UPDATE ON menu_sections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id            UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id    UUID      NOT NULL REFERENCES menu_sections(id) ON DELETE CASCADE,
  name          TEXT      NOT NULL,
  description   TEXT,
  price         NUMERIC(10,2) NOT NULL,
  image_url     TEXT,
  is_available  BOOLEAN   DEFAULT TRUE,
  display_order INTEGER   NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_set_updated_at_menu_items ON menu_items;
CREATE TRIGGER trg_set_updated_at_menu_items
  BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
alter table menu_items add column image_url text;

-- Create qr_codes table
CREATE TABLE IF NOT EXISTS qr_codes (
  id            UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID      NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          TEXT      NOT NULL,
  description   TEXT,
  access_url    TEXT      NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_set_updated_at_qr_codes ON qr_codes;
CREATE TRIGGER trg_set_updated_at_qr_codes
  BEFORE UPDATE ON qr_codes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Create menu_views table for analytics
CREATE TABLE IF NOT EXISTS menu_views (
  id            UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID      NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  qr_code_id    UUID      REFERENCES qr_codes(id) ON DELETE SET NULL,
  viewed_at     TIMESTAMPTZ DEFAULT NOW(),
  user_agent    TEXT,
  ip_address    TEXT
);

-- Enable RLS on restaurants and allow only published rows to be read publicly
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY public_read_restaurants
  ON restaurants
  FOR SELECT
  USING (true);

  ALTER TABLE public.restaurants
  ENABLE ROW LEVEL SECURITY;

-- 2. Create a policy that lets everyone SELECT
CREATE POLICY "Allow public SELECT on restaurants"
  ON public.restaurants
  FOR SELECT
  TO public
  USING ( true );

  alter table public.restaurants
  add column if not exists status text default 'inactive';

-- index for quick lookups
create index if not exists restaurants_user_id_idx on public.restaurants(user_id);


-- (Optional) If you want only the owner to INSERT/UPDATE their own rows:
CREATE POLICY owner_modify_restaurants
  ON restaurants
  FOR ALL
  USING ( auth.role() = 'authenticated' AND auth.uid() = user_id )
  WITH CHECK ( auth.uid() = user_id );


-- Enable RLS on all tables
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_views ENABLE ROW LEVEL SECURITY;

-- Create policies for restaurants
DROP POLICY IF EXISTS "Users can view their own restaurants" ON restaurants;
CREATE POLICY "Users can view their own restaurants"
  ON restaurants FOR SELECT
 TO public
USING ( true );

DROP POLICY IF EXISTS "Users can insert their own restaurants" ON restaurants;
CREATE POLICY "Users can insert their own restaurants"
  ON restaurants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own restaurants" ON restaurants;
CREATE POLICY "Users can update their own restaurants"
  ON restaurants FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own restaurants" ON restaurants;
CREATE POLICY "Users can delete their own restaurants"
  ON restaurants FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for menu_sections
DROP POLICY IF EXISTS "Users can view their own menu sections" ON menu_sections;
CREATE POLICY "Users can view their own menu sections"
  ON menu_sections FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = menu_sections.restaurant_id
    AND restaurants.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert their own menu sections" ON menu_sections;
CREATE POLICY "Users can insert their own menu sections"
  ON menu_sections FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = menu_sections.restaurant_id
    AND restaurants.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can update their own menu sections" ON menu_sections;
CREATE POLICY "Users can update their own menu sections"
  ON menu_sections FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = menu_sections.restaurant_id
    AND restaurants.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can delete their own menu sections" ON menu_sections;
CREATE POLICY "Users can delete their own menu sections"
  ON menu_sections FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = menu_sections.restaurant_id
    AND restaurants.user_id = auth.uid()
  ));



-- Create policies for menu_items
DROP POLICY IF EXISTS "Users can view their own menu items" ON menu_items;
CREATE POLICY "Users can view their own menu items"
  ON menu_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM menu_sections
    JOIN restaurants ON restaurants.id = menu_sections.restaurant_id
    WHERE menu_sections.id = menu_items.section_id
    AND restaurants.user_id = auth.uid()
  ));
ALTER TABLE public.menu_items
  ENABLE ROW LEVEL SECURITY;


  DROP POLICY IF EXISTS "Users can view their own menu items" ON public.menu_items;

-- 3) Create a new public-read policy
CREATE POLICY "Allow public read on menu_items"
  ON public.menu_items
  FOR SELECT
  USING ( true );

  
DROP POLICY IF EXISTS "Users can insert their own menu items" ON menu_items;
CREATE POLICY "Users can insert their own menu items"
  ON menu_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM menu_sections
    JOIN restaurants ON restaurants.id = menu_sections.restaurant_id
    WHERE menu_sections.id = menu_items.section_id
    AND restaurants.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can update their own menu items" ON menu_items;
CREATE POLICY "Users can update their own menu items"
  ON menu_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM menu_sections
    JOIN restaurants ON restaurants.id = menu_sections.restaurant_id
    WHERE menu_sections.id = menu_items.section_id
    AND restaurants.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can delete their own menu items" ON menu_items;
CREATE POLICY "Users can delete their own menu items"
  ON menu_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM menu_sections
    JOIN restaurants ON restaurants.id = menu_sections.restaurant_id
    WHERE menu_sections.id = menu_items.section_id
    AND restaurants.user_id = auth.uid()
  ));

-- Create policies for qr_codes
DROP POLICY IF EXISTS "Users can view their own QR codes" ON qr_codes;
CREATE POLICY "Users can view their own QR codes"
  ON qr_codes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = qr_codes.restaurant_id
    AND restaurants.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert their own QR codes" ON qr_codes;
CREATE POLICY "Users can insert their own QR codes"
  ON qr_codes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = qr_codes.restaurant_id
    AND restaurants.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can update their own QR codes" ON qr_codes;
CREATE POLICY "Users can update their own QR codes"
  ON qr_codes FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = qr_codes.restaurant_id
    AND restaurants.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can delete their own QR codes" ON qr_codes;
CREATE POLICY "Users can delete their own QR codes"
  ON qr_codes FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = qr_codes.restaurant_id
    AND restaurants.user_id = auth.uid()
  ));

-- Create policies for menu_views
DROP POLICY IF EXISTS "Users can view their own menu views" ON menu_views;
CREATE POLICY "Users can view their own menu views"
  ON menu_views FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = menu_views.restaurant_id
    AND restaurants.user_id = auth.uid()
  ));

-- Enable realtime for all tables
alter publication supabase_realtime add table restaurants;
alter publication supabase_realtime add table menu_sections;
alter publication supabase_realtime add table menu_items;
alter publication supabase_realtime add table qr_codes;
alter publication supabase_realtime add table menu_views;