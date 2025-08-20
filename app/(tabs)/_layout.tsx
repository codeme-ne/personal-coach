import { Tabs } from 'expo-router';
import React, { useState } from 'react';
import { Modal, View } from 'react-native';

import { CustomTabBar } from '@/components/CustomTabBar';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Import the add habit modal from HabitList context
import { HabitList } from '@/components/HabitList';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);

  // We'll need to pass this to HabitList through a context or prop
  // For now, we'll use a global export from HabitList

  return (
    <Tabs
      tabBar={(props) => (
        <CustomTabBar 
          {...props} 
          onAddPress={() => {
            // This will be connected to the add habit modal
            // We need to trigger the modal from HabitList
            if (global.showAddHabitModal) {
              global.showAddHabitModal();
            }
          }}
        />
      )}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Habits',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
      {/* Remove explore tab */}
    </Tabs>
  );
}
