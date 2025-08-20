import { Tabs, router } from 'expo-router';
import React, { useState } from 'react';

import { AddOptionsModal } from '@/components/AddOptionsModal';
import { CustomTabBar } from '@/components/CustomTabBar';

// Global type extension for the showAddHabitModal function
declare global {
  var showAddHabitModal: (() => void) | undefined;
}

export default function TabLayout() {
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  const handleAddHabit = () => {
    if (globalThis.showAddHabitModal) {
      globalThis.showAddHabitModal();
    }
  };

  const handleStartChat = () => {
    router.push('/chat-coach');
  };

  return (
    <>
      <Tabs
        tabBar={(props) => (
          <CustomTabBar 
            {...props} 
            onAddPress={() => setShowOptionsModal(true)}
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

      {/* Add Options Modal */}
      <AddOptionsModal
        visible={showOptionsModal}
        onClose={() => setShowOptionsModal(false)}
        onAddHabit={handleAddHabit}
        onStartChat={handleStartChat}
      />
    </>
  );
}
