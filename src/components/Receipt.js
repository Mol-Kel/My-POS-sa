import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { getDatabase } from '../db/database';

export default function Receipt({ saleId, onClose }) {
  const [sale, setSale] = useState(null);
  
  useEffect(() => {
    loadSale();
  }, [saleId]);
  
  const loadSale = async () => {
    const db = getDatabase();
    const result = await db.getFirstAsync('SELECT * FROM sales WHERE id = ?', [saleId]);
    if (result) {
      result.items = JSON.parse(result.items_json);
      setSale(result);
    }
  };
  
  const exportCSV = async () => {
    if (!sale) return;
    
    const csvContent = [
      'Item,Quantity,Price,Subtotal',
      ...sale.items.map(item => 
        `${item.name},${item.quantity},${item.price},${(item.price * item.quantity).toFixed(2)}`
      ),
      `,,Total,${sale.total.toFixed(2)}`
    ].join('\n');
    
    const fileName = `receipt_${saleId}.csv`;
    const fileUri = FileSystem.documentDirectory + fileName;
    
    await FileSystem.writeAsStringAsync(fileUri, csvContent);
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    } else {
      Alert.alert('Saved', `Receipt saved to ${fileUri}`);
    }
  };
  
  if (!sale) return null;
  
  return (
    <View style={styles.container}>
      <ScrollView style={styles.receiptContainer}>
        <Text style={styles.header}>SA POS</Text>
        <Text style={styles.subheader}>Receipt</Text>
        
        <View style={styles.divider} />
        
        <Text style={styles.info}>Date: {new Date(sale.created_at).toLocaleString()}</Text>
        <Text style={styles.info}>Receipt #: {saleId.substring(0, 8)}</Text>
        
        <View style={styles.divider} />
        
        {sale.items.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDetail}>
                R{item.price.toFixed(2)} x {item.quantity}
              </Text>
            </View>
            <Text style={styles.itemTotal}>
              R{(item.price * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
        
        <View style={styles.divider} />
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalAmount}>R{sale.total.toFixed(2)}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <Text style={styles.footer}>Thank you for your business!</Text>
      </ScrollView>
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.exportButton} onPress={exportCSV}>
          <Text style={styles.buttonText}>Export CSV</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  receiptContainer: { flex: 1, padding: 20 },
  header: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 5 
  },
  subheader: { 
    fontSize: 16, 
    textAlign: 'center', 
    color: '#666', 
    marginBottom: 20 
  },
  divider: { 
    borderBottomWidth: 1, 
    borderBottomColor: '#ddd', 
    marginVertical: 15 
  },
  info: { fontSize: 14, color: '#666', marginBottom: 5 },
  itemRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 12 
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600', marginBottom: 3 },
  itemDetail: { fontSize: 14, color: '#666' },
  itemTotal: { fontSize: 16, fontWeight: 'bold' },
  totalRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 10 
  },
  totalLabel: { fontSize: 20, fontWeight: 'bold' },
  totalAmount: { fontSize: 24, fontWeight: 'bold', color: '#4CAF50' },
  footer: { 
    textAlign: 'center', 
    fontSize: 14, 
    color: '#666', 
    marginTop: 10,
    fontStyle: 'italic'
  },
  actions: { 
    flexDirection: 'row', 
    padding: 15, 
    borderTopWidth: 1, 
    borderTopColor: '#ddd' 
  },
  exportButton: { 
    backgroundColor: '#2196F3', 
    padding: 15, 
    borderRadius: 8, 
    flex: 1, 
    marginRight: 10 
  },
  closeButton: { 
    backgroundColor: '#4CAF50', 
    padding: 15, 
    borderRadius: 8, 
    flex: 1 
  },
  buttonText: { 
    color: '#fff', 
    textAlign: 'center', 
    fontWeight: '600', 
    fontSize: 16 
  },
});
