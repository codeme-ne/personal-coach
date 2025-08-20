import { ScrollView, StyleSheet, useColorScheme } from 'react-native';

import { HabitList } from '@/components/HabitList';
import { HelloWave } from '@/components/HelloWave';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Habit Tracker</ThemedText>
        <HelloWave />
      </ThemedView>
      
      {/* Habit List Component */}
      <HabitList />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8F9', // Light gray background like in settings
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
});
