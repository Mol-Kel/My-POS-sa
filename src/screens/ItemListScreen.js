import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Modal } from 'react-native';
import { getDatabase, addItem } from '../db/database';

export default function ItemListScreen({ route }) {
  const { mode } = route.params;
  const [items, setItems] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [stock, setStock] = useState('0');
  
  const loadItems = async () => {
    const db = getDatabase();
    const filter = mode === 'both' ? '' : `WHERE mode = '${mode}' OR mode = 'both'`;
    const result = await db.getAllAsync(`SELECT * FROM items ${filter} AND deleted = 0 ORDER BY name`);
    setItems(result);
  };
  
  useEffect(() => {
    loadItems();
  }, [mode]);
  
  const handleAddItem = async () => {
    if (!name || !price) return;
    await addItem(name, parseFloat(price), sku, barcode, parseInt(stock), 'general', mode);
    setModalVisible(false);
    setName('');
    setPrice('');
    setSku('');
    setBarcode('');
    setStock('0');
    loadItems();
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>+ Add Item</Text>
      </TouchableOpacity>
      
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>R{item.price.toFixed(2)}</Text>
            {item.barcode && <Text style={styles.itemBarcode}>Barcode: {item.barcode}</Text>}
          </View>
        )}
      />
      
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Item</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Item Name *"
              value={name}
              onChangeText={setName}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Price (R) *"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />
            
            <TextInput
              style={styles.input}
              placeholder="SKU (optional)"
              value={sku}
              onChangeText={setSku}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Barcode (optional)"
              value={barcode}
              onChangeText={setBarcode}
            />
            
            {mode === 'spaza' && (
              <TextInput
                style={styles.input}
                placeholder="Initial Stock"
                value={stock}
                onChangeText={setStock}
                keyboardType="number-pad"
              />
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.saveButton} onPress={handleAddItem}>
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
  addButton: { 
    backgroundColor: '#4CAF50', 
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 15 
  },
  addButtonText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '600' },
  itemCard: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 10,
    elevation: 2
  },
  itemName: { fontSize: 16, fontWeight: '600', marginBottom: 5 },
  itemPrice: { fontSize: 18, color: '#4CAF50', fontWeight: 'bold' },
  itemBarcode: { fontSize: 12, color: '#666', marginTop: 5 },
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
