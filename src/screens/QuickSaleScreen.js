import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Modal, Alert } from 'react-native';
import { getDatabase, recordSale, computeStock } from '../db/database';
import Receipt from '../components/Receipt';

export default function QuickSaleScreen({ route }) {
  const { mode } = route.params;
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [lastSaleId, setLastSaleId] = useState(null);
  
  const loadItems = async () => {
    const db = getDatabase();
    const filter = mode === 'both' ? '' : `WHERE (mode = '${mode}' OR mode = 'both')`;
    let query = `SELECT * FROM items ${filter} AND deleted = 0`;
    
    if (searchQuery) {
      query += ` AND (name LIKE '%${searchQuery}%' OR barcode = '${searchQuery}')`;
    }
    
    const result = await db.getAllAsync(query);
    setItems(result);
  };
  
  useEffect(() => {
    loadItems();
  }, [searchQuery, mode]);
  
  const addToCart = (item) => {
    const existing = cart.find(c => c.item_id === item.id);
    if (existing) {
      setCart(cart.map(c => 
        c.item_id === item.id 
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ));
    } else {
      setCart([...cart, { 
        item_id: item.id, 
        name: item.name, 
        price: item.price, 
        quantity: 1 
      }]);
    }
  };
  
  const updateQuantity = (itemId, delta) => {
    setCart(cart.map(c => {
      if (c.item_id === itemId) {
        const newQty = Math.max(1, c.quantity + delta);
        return { ...c, quantity: newQty };
      }
      return c;
    }));
  };
  
  const removeFromCart = (itemId) => {
    setCart(cart.filter(c => c.item_id !== itemId));
  };
  
  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };
  
  const completeSale = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Add items before completing sale');
      return;
    }
    
    // Check stock for spaza mode
    if (mode === 'spaza') {
      for (const cartItem of cart) {
        const stock = await computeStock(cartItem.item_id);
        if (stock < cartItem.quantity) {
          Alert.alert(
            'Low Stock Warning',
            `${cartItem.name} has only ${stock} in stock. Continue anyway?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Continue', onPress: () => finalizeSale() }
            ]
          );
          return;
        }
      }
    }
    
    await finalizeSale();
  };
  
  const finalizeSale = async () => {
    const total = calculateTotal();
    const saleId = await recordSale(cart, total);
    setLastSaleId(saleId);
    setReceiptVisible(true);
    setCart([]);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search items or scan barcode..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <View style={styles.itemsSection}>
        <Text style={styles.sectionTitle}>Items</Text>
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.itemButton}
              onPress={() => addToCart(item)}
            >
              <Text style={styles.itemButtonName}>{item.name}</Text>
              <Text style={styles.itemButtonPrice}>R{item.price.toFixed(2)}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
      
      <View style={styles.cartSection}>
        <Text style={styles.sectionTitle}>Cart</Text>
        {cart.length === 0 ? (
          <Text style={styles.emptyCart}>Cart is empty</Text>
        ) : (
          <FlatList
            data={cart}
            keyExtractor={item => item.item_id}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName}>{item.name}</Text>
                  <Text style={styles.cartItemPrice}>R{item.price.toFixed(2)} x {item.quantity}</Text>
                </View>
                <View style={styles.cartItemControls}>
                  <TouchableOpacity onPress={() => updateQuantity(item.item_id, -1)}>
                    <Text style={styles.controlButton}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantity}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => updateQuantity(item.item_id, 1)}>
                    <Text style={styles.controlButton}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeFromCart(item.item_id)}>
                    <Text style={styles.removeButton}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
        
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>R{calculateTotal().toFixed(2)}</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.completeButton, cart.length === 0 && styles.completeButtonDisabled]}
          onPress={completeSale}
          disabled={cart.length === 0}
        >
          <Text style={styles.completeButtonText}>Complete Sale</Text>
        </TouchableOpacity>
      </View>
      
      <Modal visible={receiptVisible} animationType="slide">
        <Receipt saleId={lastSaleId} onClose={() => setReceiptVisible(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  searchContainer: { padding: 15, backgroundColor: '#fff' },
  searchInput: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    padding: 12, 
    borderRadius: 8,
    fontSize: 16
  },
  itemsSection: { flex: 1, padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  itemButton: { 
    flex: 1, 
    backgroundColor: '#fff', 
    margin: 5, 
    padding: 15, 
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2
  },
  itemButtonName: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  itemButtonPrice: { fontSize: 16, color: '#4CAF50', fontWeight: 'bold', marginTop: 5 },
  cartSection: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    maxHeight: '40%'
  },
  emptyCart: { textAlign: 'center', color: '#999', padding: 20 },
  cartItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 14, fontWeight: '600' },
  cartItemPrice: { fontSize: 12, color: '#666', marginTop: 2 },
  cartItemControls: { flexDirection: 'row', alignItems: 'center' },
  controlButton: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    paddingHorizontal: 12,
    color: '#4CAF50'
  },
  quantity: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 10 },
  removeButton: { 
    fontSize: 18, 
    color: '#f44336', 
    marginLeft: 15,
    fontWeight: 'bold'
  },
  totalSection: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 15,
    borderTopWidth: 2,
    borderTopColor: '#ddd',
    marginTop: 10
  },
  totalLabel: { fontSize: 20, fontWeight: 'bold' },
  totalAmount: { fontSize: 24, fontWeight: 'bold', color: '#4CAF50' },
  completeButton: { 
    backgroundColor: '#4CAF50', 
    padding: 15, 
    borderRadius: 8, 
    marginTop: 10 
  },
  completeButtonDisabled: { backgroundColor: '#ccc' },
  completeButtonText: { 
    color: '#fff', 
    textAlign: 'center', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
});
