import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { getDatabase } from '../db/database';

export default function DailyTotalsScreen() {
  const [todayTotal, setTodayTotal] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [recentDays, setRecentDays] = useState([]);
  
  useEffect(() => {
    loadTotals();
  }, []);
  
  const loadTotals = async () => {
    const db = getDatabase();
    const today = new Date().toISOString().split('T')[0];
    
    // Today's totals
    const todayResult = await db.getFirstAsync(
      'SELECT COUNT(*) as count, SUM(total) as sum FROM sales WHERE date = ?',
      [today]
    );
    setTodayTotal(todayResult?.sum || 0);
    setTodayCount(todayResult?.count || 0);
    
    // Last 7 days
    const daysResult = await db.getAllAsync(`
      SELECT date, COUNT(*) as count, SUM(total) as total 
      FROM sales 
      WHERE date >= date('now', '-7 days')
      GROUP BY date 
      ORDER BY date DESC
    `);
    setRecentDays(daysResult);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.todayCard}>
        <Text style={styles.todayLabel}>Today's Sales</Text>
        <Text style={styles.todayAmount}>R{todayTotal.toFixed(2)}</Text>
        <Text style={styles.todayCount}>{todayCount} transactions</Text>
      </View>
      
      <Text style={styles.sectionTitle}>Last 7 Days</Text>
      
      <FlatList
        data={recentDays}
        keyExtractor={item => item.date}
        renderItem={({ item }) => (
          <View style={styles.dayCard}>
            <View>
              <Text style={styles.dayDate}>{item.date}</Text>
              <Text style={styles.dayCount}>{item.count} transactions</Text>
            </View>
            <Text style={styles.dayTotal}>R{item.total.toFixed(2)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f5f5f5' },
  todayCard: { 
    backgroundColor: '#4CAF50', 
    padding: 25, 
    borderRadius: 10, 
    marginBottom: 20,
    alignItems: 'center'
  },
  todayLabel: { fontSize: 16, color: '#fff', marginBottom: 10 },
  todayAmount: { fontSize: 42, fontWeight: 'bold', color: '#fff' },
  todayCount: { fontSize: 14, color: '#fff', marginTop: 5 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  dayCard: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2
  },
  dayDate: { fontSize: 16, fontWeight: '600' },
  dayCount: { fontSize: 12, color: '#666', marginTop: 2 },
  dayTotal: { fontSize: 20, fontWeight: 'bold', color: '#4CAF50' },
});
