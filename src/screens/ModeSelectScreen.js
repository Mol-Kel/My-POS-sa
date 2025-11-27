import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getDatabase } from '../db/database';

export default function ModeSelectScreen({ navigation }) {
  const [mode, setMode] = useState('fastfood');
  
  useEffect(() => {
    async function loadMode() {
      const db = getDatabase();
      const result = await db.getFirstAsync('SELECT value FROM meta WHERE key = ?', ['app_mode']);
      if (result) setMode(result.value);
    }
    loadMode();
  }, []);
  
  const selectMode = async (newMode) => {
    const db = getDatabase();
    await db.runAsync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', ['app_mode', newMode]);
    setMode(newMode);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SA POS</Text>
      <Text style={styles.subtitle}>Select Business Mode</Text>
      
      <TouchableOpacity 
        style={[styles.modeButton, mode === 'fastfood' && styles.modeButtonActive]}
        onPress={() => selectMode('fastfood')}
      >
        <Text style={styles.modeButtonText}>🍔 Fast Food / Kota Stand</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.modeButton, mode === 'spaza' && styles.modeButtonActive]}
        onPress={() => selectMode('spaza')}
      >
        <Text style={styles.modeButtonText}>🛒 Spaza Shop</Text>
      </TouchableOpacity>
      
      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('ItemList', { mode })}>
          <Text style={styles.menuButtonText}>📦 Items</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('QuickSale', { mode })}>
          <Text style={styles.menuButtonText}>💰 Quick Sale</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('DailyTotals')}>
          <Text style={styles.menuButtonText}>📊 Daily Totals</Text>
        </TouchableOpacity>
        
        {mode === 'spaza' && (
          <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('StockManagement')}>
            <Text style={styles.menuButtonText}>📈 Stock Management</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('History')}>
          <Text style={styles.menuButtonText}>📜 History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.menuButtonText}>⚙️ Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginTop: 40 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#666', marginTop: 10, marginBottom: 30 },
  modeButton: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 10, 
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#ddd'
  },
  modeButtonActive: { borderColor: '#4CAF50', backgroundColor: '#E8F5E9' },
  modeButtonText: { fontSize: 18, textAlign: 'center', fontWeight: '600' },
  menu: { marginTop: 30 },
  menuButton: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 10,
    elevation: 2
  },
  menuButtonText: { fontSize: 16, fontWeight: '500' },
});
