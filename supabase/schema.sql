-- PawShop Admin — Supabase Schema
-- Run this in your Supabase project SQL editor

CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional — disable if no auth)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow all access for public (no login for v1)
CREATE POLICY "Allow all for public" ON products
  FOR ALL USING (true) WITH CHECK (true);

-- Grant table access to anon and authenticated roles
GRANT ALL ON public.products TO anon;
GRANT ALL ON public.products TO authenticated;

-- Seed data: example products
INSERT INTO products (name, category, price, stock, status, description) VALUES
  ('Golden Retriever Shampoo', 'Shampoo & Grooming', 14.99, 120, 'active', 'Gentle formula for golden coats. Leaves fur silky and shiny.'),
  ('Premium Dog Kibble', 'Food & Treats', 39.99, 85, 'active', 'High-protein kibble with real chicken. No artificial preservatives.'),
  ('Paw Balm', 'Health & Wellness', 9.99, 200, 'active', 'Moisturizing balm for dry and cracked paw pads.'),
  ('Chew Toy', 'Toys', 7.49, 300, 'active', 'Durable rubber toy for aggressive chewers. Cleans teeth as they play.'),
  ('Dog Grooming Brush', 'Shampoo & Grooming', 19.99, 60, 'active', 'Double-sided brush for detangling and finishing. Works on all coat types.'),
  ('Pet Carrier Bag', 'Carriers & Travel', 54.99, 8, 'inactive', 'Airline-approved soft-sided carrier for dogs up to 15 lbs.');
