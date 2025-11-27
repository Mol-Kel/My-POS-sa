import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { getDatabase, getDeviceId } from '../db/database';
import { performSync } from '../sync/sync';

export default function SettingsScreen() {
  const [deviceId, setDeviceId] = useState('');
  const [pin, setPin] = useState('');
  
  useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    const id = await getDeviceId();
    setDeviceId(id);
    
    const db = getDatabase();
    const pinResult = await db.getFirstAsync('SELECT value FROM meta WHERE key = ?', ['pin']);
    if (pinResult) setPin(pinResult.value);
  };
  
  const savePin = async () => {
    const db = getDatabase();
    await db.runAsync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', ['pin', pin]);
    Alert.alert('Success', 'PIN saved');
  };
  
  const manualSync = async () => {
    Alert.alert('Syncing', 'Starting manual sync...');
    await performSync();
    Alert.alert('Complete', 'Sync completed');
  };
  
  const clearData = () => {
    Alert.alert(
      'Clear Data',
      'This will delete all local data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const db = getDatabase();
            await db.execAsync(`
              DELETE FROM items;
              DELETE FROM sales;
              DELETE FROM stock_movements;
              DELETE FROM sync_queue;
            `);
            Alert.alert('Success', 'Data cleared. Restart app to reseed.');
          }
        }
      ]
    );
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Device Settings</Text>
      
      <View style={styles.settingCard}>
        <Text style={styles.label}>Device ID</Text>
        <Text style={styles.deviceId}>{deviceId}</Text>
      </View>
      
      <View style={styles.settingCard}>
        <Text style={styles.label}>PIN Lock (4 digits)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter PIN"
          value={pin}
          onChangeText={setPin}
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry
        />
        <TouchableOpacity style={styles.saveButton} onPress={savePin}>
          <Text style={styles.buttonText}>Save PIN</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.actionButton} onPress={manualSync}>
        <Text style={styles.actionButtonText}>🔄 Manual Sync</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={clearData}>
        <Text style={styles.actionButtonText}>🗑️ Clear All Data</Text>
      </TouchableOpacity>
      
      <Text style={styles.version}>Version 1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f5f5f5' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  settingCard: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 15,
    elevation: 2
  },
  label: { fontSize: 14, color: '#666', marginBottom: 10 },
  deviceId: { fontSize: 12, fontFamily: 'monospace', color: '#333' },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 10,
    fontSize: 16
  },
  saveButton: { 
    backgroundColor: '#4CAF50', 
    padding: 12, 
    borderRadius: 8 
  },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
  actionButton: { 
    backgroundColor: '#2196F3', 
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 10 
  },
  dangerButton: { backgroundColor: '#f44336' },
  actionButtonText: { 
    color: '#fff', 
    textAlign: 'center', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  version: { 
    textAlign: 'center', 
    color: '#999', 
    marginTop: 20, 
    fontSize: 12 
  },
});
