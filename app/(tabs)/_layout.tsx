import { Tabs, router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

import { AddOptionsModal } from '@/components/AddOptionsModal';
import { CustomTabBar } from '@/components/CustomTabBar';
import { useAuth } from '@/hooks/useAuth';

// Global type extension for the showAddHabitModal function
declare global {
  var showAddHabitModal: (() => void) | undefined;
}

export default function TabLayout() {
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const { isSignedIn, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isSignedIn) {
      router.replace('/auth/login');
    }
  }, [isLoading, isSignedIn]);

  const handleAddHabit = () => {
    if (globalThis.showAddHabitModal) {
      globalThis.showAddHabitModal();
    }
  };

  const handleStartChat = () => {
    router.push('/chat-coach');
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Don't render tabs if not authenticated (will redirect)
  if (!isSignedIn) {
    return null;
  }

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
          name="stats"
          options={{
            title: 'Stats',
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
          }}
        />
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
