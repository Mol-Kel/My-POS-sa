import { getDatabase, getDeviceId } from '../db/database';
import { supabase } from '../config/supabase';
import NetInfo from '@react-native-community/netinfo';
import { v4 as uuidv4 } from 'uuid';

let syncInProgress = false;
let syncStatus = { online: false, syncing: false, lastSync: null, error: null };
const statusListeners = [];

export function addSyncStatusListener(listener) {
  statusListeners.push(listener);
  listener(syncStatus);
}

export function removeSyncStatusListener(listener) {
  const index = statusListeners.indexOf(listener);
  if (index > -1) statusListeners.splice(index, 1);
}

function notifyListeners() {
  statusListeners.forEach(l => l(syncStatus));
}

export function startSyncLoop() {
  // Monitor network
  NetInfo.addEventListener(state => {
    syncStatus.online = state.isConnected;
    notifyListeners();
    if (state.isConnected && !syncInProgress) {
      performSync();
    }
  });
  
  // Periodic sync every 30 seconds if online
  setInterval(() => {
    if (syncStatus.online && !syncInProgress) {
      performSync();
    }
  }, 30000);
}

export async function performSync() {
  if (syncInProgress) return;
  
  syncInProgress = true;
  syncStatus.syncing = true;
  syncStatus.error = null;
  notifyListeners();
  
  try {
    const db = getDatabase();
    const deviceId = await getDeviceId();
    
    // 1. Fetch unsynced operations
    const ops = await db.getAllAsync(
      'SELECT * FROM sync_queue WHERE synced = 0 ORDER BY device_seq ASC'
    );
    
    if (ops.length === 0) {
      syncStatus.syncing = false;
      syncStatus.lastSync = new Date().toISOString();
      await db.runAsync('UPDATE meta SET value = ? WHERE key = ?', [syncStatus.lastSync, 'last_sync']);
      notifyListeners();
      syncInProgress = false;
      return;
    }
    
    // 2. Send to server via RPC
    const { data, error } = await supabase.rpc('apply_sync_ops', {
      ops: ops.map(op => ({
        id: op.id,
        op_type: op.op_type,
        table_name: op.table_name,
        record_id: op.record_id,
        payload: JSON.parse(op.payload),
        device_id: op.device_id,
        device_seq: op.device_seq,
        created_at: op.created_at
      }))
    });
    
    if (error) throw error;
    
    // 3. Mark ops as synced
    for (const op of ops) {
      await db.runAsync(
        'UPDATE sync_queue SET synced = 1, synced_at = ? WHERE id = ?',
        [new Date().toISOString(), op.id]
      );
    }
    
    // 4. Fetch server updates (items/sales from other devices)
    const lastSync = (await db.getFirstAsync('SELECT value FROM meta WHERE key = ?', ['last_sync']))?.value || '2000-01-01';
    
    const { data: serverItems } = await supabase
      .from('items')
      .select('*')
      .gt('updated_at', lastSync)
      .neq('device_id', deviceId);
    
    const { data: serverSales } = await supabase
      .from('sales')
      .select('*')
      .gt('created_at', lastSync)
      .neq('device_id', deviceId);
    
    const { data: serverMovements } = await supabase
      .from('stock_movements')
      .select('*')
      .gt('created_at', lastSync)
      .neq('device_id', deviceId);
    
    // 5. Apply server updates locally
    if (serverItems) {
      for (const item of serverItems) {
        await db.runAsync(
          `INSERT OR REPLACE INTO items (id, name, price, sku, barcode, initial_stock, category, mode, created_at, updated_at, deleted) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [item.id, item.name, item.price, item.sku, item.barcode, item.initial_stock, item.category, item.mode, item.created_at, item.updated_at, item.deleted ? 1 : 0]
        );
      }
    }
    
    if (serverSales) {
      for (const sale of serverSales) {
        const exists = await db.getFirstAsync('SELECT id FROM sales WHERE id = ?', [sale.id]);
        if (!exists) {
          await db.runAsync(
            `INSERT INTO sales (id, items_json, total, date, device_id, created_at) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [sale.id, JSON.stringify(sale.items_json), sale.total, sale.date, sale.device_id, sale.created_at]
          );
        }
      }
    }
    
    if (serverMovements) {
      for (const mov of serverMovements) {
        const exists = await db.getFirstAsync('SELECT id FROM stock_movements WHERE id = ?', [mov.id]);
        if (!exists) {
          await db.runAsync(
            `INSERT INTO stock_movements (id, item_id, quantity, type, notes, device_id, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [mov.id, mov.item_id, mov.quantity, mov.type, mov.notes, mov.device_id, mov.created_at]
          );
        }
      }
    }
    
    syncStatus.syncing = false;
    syncStatus.lastSync = new Date().toISOString();
    await db.runAsync('UPDATE meta SET value = ? WHERE key = ?', [syncStatus.lastSync, 'last_sync']);
    notifyListeners();
    
  } catch (err) {
    console.error('Sync error:', err);
    syncStatus.syncing = false;
    syncStatus.error = err.message;
    notifyListeners();
  } finally {
    syncInProgress = false;
  }
}
