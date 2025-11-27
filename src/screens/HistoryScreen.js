import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { getDatabase } from '../db/database';

export default function HistoryScreen() {
  const [sales, setSales] = useState([]);
  
  useEffect(() => {
    loadHistory();
  }, []);
  
  const loadHistory = async () => {
    const db = getDatabase();
    const result = await db.getAllAsync(
      'SELECT * FROM sales ORDER BY created_at DESC LIMIT 50'
    );
    setSales(result);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Recent Sales</Text>
      
      <FlatList
        data={sales}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const items = JSON.parse(item.items_json);
          const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
          
          return (
            <View style={styles.saleCard}>
              <View style={styles.saleHeader}>
                <Text style={styles.saleDate}>
                  {new Date(item.created_at).toLocaleString()}
                </Text>
                <Text style={styles.saleTotal}>R{item.total.toFixed(2)}</Text>
              </View>
              <Text style={styles.saleItems}>
                {itemCount} item{itemCount !== 1 ? 's' : ''}
              </Text>
              <View style={styles.itemsList}>
                {items.map((saleItem, idx) => (
                  <Text key={idx} style={styles.itemDetail}>
                    • {saleItem.name} x{saleItem.quantity}
                  </Text>
                ))}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f5f5f5' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  saleCard: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 10,
    elevation: 2
  },
  saleHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 10
  },
  saleDate: { fontSize: 12, color: '#666' },
  saleTotal: { fontSize: 20, fontWeight: 'bold', color: '#4CAF50' },
  saleItems: { fontSize: 14, color: '#666', marginBottom: 10 },
  itemsList: { paddingLeft: 10 },
  itemDetail: { fontSize: 14, color: '#333', marginBottom: 3 },
});
