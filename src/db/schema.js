export const SCHEMA_SQL = `
-- Meta table for device identity and sync state
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Items (products/menu items)
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  sku TEXT,
  barcode TEXT,
  initial_stock INTEGER DEFAULT 0,
  category TEXT,
  mode TEXT CHECK(mode IN ('fastfood', 'spaza', 'both')) DEFAULT 'both',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted INTEGER DEFAULT 0
);

-- Sales (transactions)
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  items_json TEXT NOT NULL,
  total REAL NOT NULL,
  date TEXT NOT NULL,
  device_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Stock movements (adjustments, deliveries)
CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  type TEXT CHECK(type IN ('adjustment', 'delivery', 'return')) DEFAULT 'adjustment',
  notes TEXT,
  device_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (item_id) REFERENCES items(id)
);

-- Sync queue (operation log)
CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  op_type TEXT NOT NULL CHECK(op_type IN ('item_insert', 'item_update', 'item_delete', 'sale_insert', 'stock_movement_insert')),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  device_id TEXT,
  device_seq INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  synced INTEGER DEFAULT 0,
  synced_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(item_id);
`;
