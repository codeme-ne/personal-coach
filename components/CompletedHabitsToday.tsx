import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  TouchableOpacity
} from 'react-native';
import { Habit, HabitCompletion, habitService } from '../habitService';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface CompletedHabitItem {
  habit: Habit;
  completion: HabitCompletion;
}

export function CompletedHabitsToday() {
  const [completedHabits, setCompletedHabits] = useState<CompletedHabitItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCompletedHabits();
  }, []);

  const loadCompletedHabits = async () => {
    try {
      setLoading(true);
      const completed = await habitService.getTodayCompletedHabits();
      setCompletedHabits(completed);
    } catch (error) {
      console.error('Error loading completed habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCompletionTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderCompletedHabit = ({ item }: { item: CompletedHabitItem }) => (
    <View style={styles.completedHabitItem}>
      <View style={styles.checkmarkContainer}>
        <MaterialIcons name="check-circle" size={24} color="#34C759" />
      </View>
      <View style={styles.habitInfo}>
        <ThemedText style={styles.habitName}>{item.habit.name}</ThemedText>
        <ThemedText style={styles.completionTime}>
          Completed at {formatCompletionTime(item.completion.completedAt)}
        </ThemedText>
      </View>
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.loadingText}>Loading completed habits...</ThemedText>
      </ThemedView>
    );
  }

  if (completedHabits.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.emptyText}>
          No habits completed today yet. Complete a habit to see it here!
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={loadCompletedHabits} style={styles.refreshButton}>
          <MaterialIcons name="refresh" size={16} color="#687076" />
          <ThemedText style={styles.refreshText}>Refresh</ThemedText>
        </TouchableOpacity>
      </View>
      <FlatList
        data={completedHabits}
        renderItem={renderCompletedHabit}
        keyExtractor={(item) => `${item.habit.id}-${item.completion.id}`}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false} // Since this will be inside another ScrollView
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 4,
  },
  refreshText: {
    fontSize: 12,
    color: '#687076',
    marginLeft: 4,
  },
  completedHabitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  checkmarkContainer: {
    marginRight: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  completionTime: {
    fontSize: 13,
    color: '#687076',
  },
  loadingText: {
    fontSize: 14,
    color: '#687076',
    textAlign: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#687076',
    textAlign: 'center',
    padding: 16,
    fontStyle: 'italic',
  },
});
