import { Tabs } from 'expo-router';
import React from 'react';

import { CustomTabBar } from '@/components/CustomTabBar';
import { useColorScheme } from '@/hooks/useColorScheme';

// Global type extension for the showAddHabitModal function
declare global {
  var showAddHabitModal: (() => void) | undefined;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      tabBar={(props) => (
        <CustomTabBar 
          {...props} 
          onAddPress={() => {
            // This will be connected to the add habit modal
            // We need to trigger the modal from HabitList
            if (globalThis.showAddHabitModal) {
              globalThis.showAddHabitModal();
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
