import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Modal,
  View,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { habitService, Habit, HabitCompletion } from '../habitService';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface HabitHistoryProps {
  habit: Habit | null;
  visible: boolean;
  onClose: () => void;
}

export function HabitHistory({ habit, visible, onClose }: HabitHistoryProps) {
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (habit && visible) {
      loadHistory();
    }
  }, [habit, visible]);

  const loadHistory = async () => {
    if (!habit) return;
    
    try {
      setLoading(true);
      const habitCompletions = await habitService.getHabitCompletions(habit.id!);
      const habitStreak = await habitService.getHabitStreak(habit.id!);
      setCompletions(habitCompletions);
      setStreak(habitStreak);
    } catch (error) {
      console.error('Error loading habit history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isYesterday = (date: Date): boolean => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  };

  const getDateLabel = (date: Date): string => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return formatDate(date);
  };

  // Group completions by month for better visualization
  const groupCompletionsByMonth = () => {
    const grouped: { [key: string]: HabitCompletion[] } = {};
    
    completions.forEach(completion => {
      const monthYear = completion.completedAt.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(completion);
    });
    
    return Object.entries(grouped);
  };

  if (!habit) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={[
          styles.modalContent,
          { backgroundColor: Colors[colorScheme ?? 'light'].background }
        ]}>
          <ThemedView style={styles.header}>
            <ThemedView>
              <ThemedText type="subtitle" style={styles.habitName}>
                {habit.name}
              </ThemedText>
              {habit.description && (
                <ThemedText style={styles.habitDescription}>
                  {habit.description}
                </ThemedText>
              )}
            </ThemedView>
            
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <ThemedText style={styles.closeButtonText}>✕</ThemedText>
            </TouchableOpacity>
          </ThemedView>

          <ThemedView style={styles.statsContainer}>
            <ThemedView style={styles.statItem}>
              <ThemedText style={styles.statValue}>🔥 {streak}</ThemedText>
              <ThemedText style={styles.statLabel}>Current Streak</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.statItem}>
              <ThemedText style={styles.statValue}>📅 {completions.length}</ThemedText>
              <ThemedText style={styles.statLabel}>Total Days</ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Completion History
          </ThemedText>

          {loading ? (
            <ThemedView style={styles.loadingContainer}>
              <ThemedText>Loading...</ThemedText>
            </ThemedView>
          ) : completions.length === 0 ? (
            <ThemedView style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                No completions yet. Start building your streak today!
              </ThemedText>
            </ThemedView>
          ) : (
            <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
              {groupCompletionsByMonth().map(([month, monthCompletions]) => (
                <ThemedView key={month} style={styles.monthSection}>
                  <ThemedText style={styles.monthTitle}>{month}</ThemedText>
                  {monthCompletions.map((completion) => (
                    <ThemedView key={completion.id} style={styles.completionItem}>
                      <ThemedText style={styles.completionDate}>
                        {getDateLabel(completion.completedAt)}
                      </ThemedText>
                      <ThemedText style={styles.checkIcon}>✓</ThemedText>
                    </ThemedView>
                  ))}
                </ThemedView>
              ))}
            </ScrollView>
          )}
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  habitName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  habitDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    opacity: 0.6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  historyList: {
    flex: 1,
  },
  monthSection: {
    marginBottom: 20,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.8,
  },
  completionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
  },
  completionDate: {
    fontSize: 16,
  },
  checkIcon: {
    fontSize: 18,
    color: '#4CAF50',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.6,
  },
});