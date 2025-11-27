import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Modal, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { getDatabase, computeStock, getDeviceId, getNextDeviceSeq } from '../db/database';
import { v4 as uuidv4 } from 'uuid';

export default function StockManagementScreen() {
  const [items, setItems] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');
  
  useEffect(() => {
    loadStockLevels();
    requestCameraPermission();
  }, []);
  
  const requestCameraPermission = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
  };
  
  const loadStockLevels = async () => {
    const db = getDatabase();
    const allItems = await db.getAllAsync(
      `SELECT * FROM items WHERE (mode = 'spaza' OR mode = 'both') AND deleted = 0`
    );
    
    const itemsWithStock = await Promise.all(
      allItems.map(async (item) => {
        const stock = await computeStock(item.id);
        return { ...item, current_stock: stock };
      })
    );
    
    setItems(itemsWithStock.sort((a, b) => a.current_stock - b.current_stock));
  };
  
  const handleBarCodeScanned = async ({ data }) => {
    setScanning(false);
    const db = getDatabase();
    const item = await db.getFirstAsync('SELECT * FROM items WHERE barcode = ?', [data]);
    
    if (item) {
      const stock = await computeStock(item.id);
      setSelectedItem({ ...item, current_stock: stock });
      setAdjustModalVisible(true);
    } else {
      Alert.alert('Not Found', `No item found with barcode: ${data}`);
    }
  };
  
  const handleStockAdjustment = async () => {
    if (!selectedItem || !adjustQuantity) return;
    
    const db = getDatabase();
    const deviceId = await getDeviceId();
    const id = uuidv4();
    const quantity = parseInt(adjustQuantity);
    
    await db.runAsync(
      `INSERT INTO stock_movements (id, item_id, quantity, type, notes, device_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, selectedItem.id, quantity, 'adjustment', adjustNotes, deviceId]
    );
    
    const seq = await getNextDeviceSeq();
    await db.runAsync(
      `INSERT INTO sync_queue (id, op_type, table_name, record_id, payload, device_id, device_seq) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        'stock_movement_insert',
        'stock_movements',
        id,
        JSON.stringify({ id, item_id: selectedItem.id, quantity, type: 'adjustment', notes: adjustNotes, device_id: deviceId }),
        deviceId,
        seq
      ]
    );
    
    setAdjustModalVisible(false);
    setSelectedItem(null);
    setAdjustQuantity('');
    setAdjustNotes('');
    loadStockLevels();
    Alert.alert('Success', 'Stock adjusted successfully');
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.scanButton}
        onPress={() => setScanning(true)}
      >
        <Text style={styles.scanButtonText}>📷 Scan Barcode</Text>
      </TouchableOpacity>
      
      <Text style={styles.sectionTitle}>Stock Levels</Text>
      
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[
              styles.stockCard,
              item.current_stock < 10 && styles.lowStockCard
            ]}
            onPress={() => {
              setSelectedItem(item);
              setAdjustModalVisible(true);
            }}
          >
            <View>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.barcode && <Text style={styles.itemBarcode}>{item.barcode}</Text>}
            </View>
            <View style={styles.stockInfo}>
              <Text style={[
                styles.stockLevel,
                item.current_stock < 10 && styles.lowStockLevel
              ]}>
                {item.current_stock}
              </Text>
              {item.current_stock < 10 && <Text style={styles.lowStockWarning}>⚠️ Low</Text>}
            </View>
          </TouchableOpacity>
        )}
      />
      
      {scanning && (
        <Modal visible={scanning} animationType="slide">
          <BarCodeScanner
            onBarCodeScanned={handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
          <TouchableOpacity 
            style={styles.closeScanButton}
            onPress={() => setScanning(false)}
          >
            <Text style={styles.closeScanText}>✕ Close</Text>
          </TouchableOpacity>
        </Modal>
      )}
      
      <Modal visible={adjustModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adjust Stock</Text>
            
            {selectedItem && (
              <>
                <Text style={styles.modalItemName}>{selectedItem.name}</Text>
                <Text style={styles.modalCurrentStock}>
                  Current Stock: {selectedItem.current_stock}
                </Text>
              </>
            )}
            
            <TextInput
              style={styles.input}
              placeholder="Adjustment (+/-)"
              value={adjustQuantity}
              onChangeText={setAdjustQuantity}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Notes (optional)"
              value={adjustNotes}
              onChangeText={setAdjustNotes}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setAdjustModalVisible(false);
                  setSelectedItem(null);
                  setAdjustQuantity('');
                  setAdjustNotes('');
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleStockAdjustment}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f5f5f5' },
  scanButton: { 
    backgroundColor: '#2196F3', 
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 15 
  },
  scanButtonText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  stockCard: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2
  },
  lowStockCard: { borderLeftWidth: 4, borderLeftColor: '#FF9800' },
  itemName: { fontSize: 16, fontWeight: '600' },
  itemBarcode: { fontSize: 12, color: '#666', marginTop: 2 },
  stockInfo: { alignItems: 'flex-end' },
  stockLevel: { fontSize: 24, fontWeight: 'bold', color: '#4CAF50' },
  lowStockLevel: { color: '#FF9800' },
  lowStockWarning: { fontSize: 12, color: '#FF9800', marginTop: 2 },
  closeScanButton: { 
    position: 'absolute', 
    top: 50, 
    right: 20, 
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 8
  },
  closeScanText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalContainer: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    padding: 20 
  },
  modalContent: { 
    backgroundColor: '#fff', 
    borderRadius: 10, 
    padding: 20 
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  modalItemName: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  modalCurrentStock: { fontSize: 14, color: '#666', marginBottom: 20 },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 15,
    fontSize: 16
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cancelButton: { 
    backgroundColor: '#999', 
    padding: 12, 
    borderRadius: 8, 
    flex: 1, 
    marginRight: 10 
  },
  saveButton: { 
    backgroundColor: '#4CAF50', 
    padding: 12, 
    borderRadius: 8, 
    flex: 1 
  },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
});
