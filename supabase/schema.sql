-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Devices table (track registered devices)
CREATE TABLE devices (
  id TEXT PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items table
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  sku TEXT,
  barcode TEXT,
  initial_stock INTEGER DEFAULT 0,
  category TEXT,
  mode TEXT CHECK(mode IN ('fastfood', 'spaza', 'both')) DEFAULT 'both',
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_items_barcode ON items(barcode);
CREATE INDEX idx_items_mode ON items(mode);
CREATE INDEX idx_items_updated ON items(updated_at);

-- Sales table
CREATE TABLE sales (
  id TEXT PRIMARY KEY,
  items_json JSONB NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL,
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_date ON sales(date);
CREATE INDEX idx_sales_device ON sales(device_id);
CREATE INDEX idx_sales_created ON sales(created_at);

-- Stock movements table
CREATE TABLE stock_movements (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES items(id),
  quantity INTEGER NOT NULL,
  type TEXT CHECK(type IN ('adjustment', 'delivery', 'return')) DEFAULT 'adjustment',
  notes TEXT,
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_item ON stock_movements(item_id);
CREATE INDEX idx_stock_movements_created ON stock_movements(created_at);

-- Sync operations log (server-side record of all ops)
CREATE TABLE sync_ops (
  id TEXT PRIMARY KEY,
  op_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  device_id TEXT NOT NULL,
  device_seq INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  applied BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMPTZ
);

CREATE INDEX idx_sync_ops_applied ON sync_ops(applied);
CREATE INDEX idx_sync_ops_device ON sync_ops(device_id, device_seq);

-- Row Level Security Policies (basic MVP - all authenticated users can read/write)
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_ops ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for MVP (tighten in production)
CREATE POLICY "Allow all access" ON devices FOR ALL USING (true);
CREATE POLICY "Allow all access" ON items FOR ALL USING (true);
CREATE POLICY "Allow all access" ON sales FOR ALL USING (true);
CREATE POLICY "Allow all access" ON stock_movements FOR ALL USING (true);
CREATE POLICY "Allow all access" ON sync_ops FOR ALL USING (true);
