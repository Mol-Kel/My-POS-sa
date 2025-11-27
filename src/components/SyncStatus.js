import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { addSyncStatusListener, removeSyncStatusListener } from '../sync/sync';

export default function SyncStatus() {
  const [status, setStatus] = useState({ online: false, syncing: false, lastSync: null });
  
  useEffect(() => {
    addSyncStatusListener(setStatus);
    return () => removeSyncStatusListener(setStatus);
  }, []);
  
  const getStatusColor = () => {
    if (!status.online) return '#999';
    if (status.syncing) return '#FFA500';
    return '#4CAF50';
  };
  
  const getStatusText = () => {
    if (!status.online) return 'Offline';
    if (status.syncing) return 'Syncing...';
    return 'Synced';
  };
  
  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: getStatusColor() }]} />
      <Text style={styles.text}>{getStatusText()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  text: {
    fontSize: 12,
    color: '#666',
  },
});
