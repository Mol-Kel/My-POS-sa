import * as SQLite from 'expo-sqlite';
import { SCHEMA_SQL } from './schema';
import { v4 as uuidv4 } from 'uuid';
import seedDataJson from '../../seed-data.json';

let db;

export async function initDatabase() {
  db = await SQLite.openDatabaseAsync('sapos.db');
  
  await db.execAsync(SCHEMA_SQL);
  
  // Initialize device ID if not exists
  const result = await db.getFirstAsync('SELECT value FROM meta WHERE key = ?', ['device_id']);
  if (!result) {
    const deviceId = uuidv4();
    await db.runAsync('INSERT INTO meta (key, value) VALUES (?, ?)', ['device_id', deviceId]);
    await db.runAsync('INSERT INTO meta (key, value) VALUES (?, ?)', ['device_seq', '0']);
    await db.runAsync('INSERT INTO meta (key, value) VALUES (?, ?)', ['last_sync', '']);
  }
  
  return db;
}

export function getDatabase() {
  return db;
}

export async function getDeviceId() {
  const result = await db.getFirstAsync('SELECT value FROM meta WHERE key = ?', ['device_id']);
  return result?.value || 'unknown';
}

export async function getNextDeviceSeq() {
  const result = await db.getFirstAsync('SELECT value FROM meta WHERE key = ?', ['device_seq']);
  const seq = parseInt(result?.value || '0') + 1;
  await db.runAsync('UPDATE meta SET value = ? WHERE key = ?', [seq.toString(), 'device_seq']);
  return seq;
}

export async function seedData() {
  // Check if already seeded
  const count = await db.getFirstAsync('SELECT COUNT(*) as count FROM items');
  if (count.count > 0) return;
  
  const deviceId = await getDeviceId();
  
  for (const item of seedDataJson.items) {
    const id = uuidv4();
    await db.runAsync(
      `INSERT INTO items (id, name, price, sku, barcode, initial_stock, category, mode) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, item.name, item.price, item.sku, item.barcode, item.initial_stock, item.category, item.mode]
    );
    
    // Add to sync queue
    const seq = await getNextDeviceSeq();
    await db.runAsync(
      `INSERT INTO sync_queue (id, op_type, table_name, record_id, payload, device_id, device_seq) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), 'item_insert', 'items', id, JSON.stringify(item), deviceId, seq]
    );
  }
}

// Helper: Add item
export async function addItem(name, price, sku, barcode, initial_stock, category, mode) {
  const id = uuidv4();
  const deviceId = await getDeviceId();
  
  await db.runAsync(
    `INSERT INTO items (id, name, price, sku, barcode, initial_stock, category, mode) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, price, sku, barcode, initial_stock, category, mode]
  );
  
  const seq = await getNextDeviceSeq();
  await db.runAsync(
    `INSERT INTO sync_queue (id, op_type, table_name, record_id, payload, device_id, device_seq) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      uuidv4(), 
      'item_insert', 
      'items', 
      id, 
      JSON.stringify({ id, name, price, sku, barcode, initial_stock, category, mode }),
      deviceId,
      seq
    ]
  );
  
  return id;
}

// Helper: Record sale
export async function recordSale(itemsArray, total) {
  const id = uuidv4();
  const deviceId = await getDeviceId();
  const date = new Date().toISOString().split('T')[0];
  
  await db.runAsync(
    `INSERT INTO sales (id, items_json, total, date, device_id) 
     VALUES (?, ?, ?, ?, ?)`,
    [id, JSON.stringify(itemsArray), total, date, deviceId]
  );
  
  const seq = await getNextDeviceSeq();
  await db.runAsync(
    `INSERT INTO sync_queue (id, op_type, table_name, record_id, payload, device_id, device_seq) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      uuidv4(),
      'sale_insert',
      'sales',
      id,
      JSON.stringify({ id, items_json: itemsArray, total, date, device_id: deviceId }),
      deviceId,
      seq
    ]
  );
  
  return id;
}

// Helper: Compute current stock for an item
export async function computeStock(itemId) {
  const item = await db.getFirstAsync('SELECT initial_stock FROM items WHERE id = ?', [itemId]);
  if (!item) return 0;
  
  const movements = await db.getAllAsync(
    'SELECT quantity FROM stock_movements WHERE item_id = ?',
    [itemId]
  );
  
  const sales = await db.getAllAsync(
    `SELECT items_json FROM sales WHERE json_extract(items_json, '$') LIKE ?`,
    [`%"item_id":"${itemId}"%`]
  );
  
  let stock = item.initial_stock;
  movements.forEach(m => stock += m.quantity);
  
  sales.forEach(s => {
    const items = JSON.parse(s.items_json);
    items.forEach(i => {
      if (i.item_id === itemId) stock -= i.quantity;
    });
  });
  
  return stock;
}
