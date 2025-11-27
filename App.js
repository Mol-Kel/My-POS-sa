import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { initDatabase, seedData } from './src/db/database';
import { startSyncLoop } from './src/sync/sync';
import SyncStatus from './src/components/SyncStatus';

import ModeSelectScreen from './src/screens/ModeSelectScreen';
import ItemListScreen from './src/screens/ItemListScreen';
import QuickSaleScreen from './src/screens/QuickSaleScreen';
import DailyTotalsScreen from './src/screens/DailyTotalsScreen';
import StockManagementScreen from './src/screens/StockManagementScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await initDatabase();
        await seedData();
        startSyncLoop();
        setIsReady(true);
      } catch (e) {
        console.warn('Init error:', e);
      }
    }
    prepare();
  }, []);

  if (!isReady) {
    return null; // Or loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="ModeSelect"
        screenOptions={{
          headerRight: () => <SyncStatus />
        }}
      >
        <Stack.Screen 
          name="ModeSelect" 
          component={ModeSelectScreen}
          options={{ title: 'SA POS' }}
        />
        <Stack.Screen 
          name="ItemList" 
          component={ItemListScreen}
          options={{ title: 'Items' }}
        />
        <Stack.Screen 
          name="QuickSale" 
          component={QuickSaleScreen}
          options={{ title: 'Quick Sale' }}
        />
        <Stack.Screen 
          name="DailyTotals" 
          component={DailyTotalsScreen}
          options={{ title: 'Daily Totals' }}
        />
        <Stack.Screen 
          name="StockManagement" 
          component={StockManagementScreen}
          options={{ title: 'Stock Management' }}
        />
        <Stack.Screen 
          name="History" 
          component={HistoryScreen}
          options={{ title: 'Sales History' }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
