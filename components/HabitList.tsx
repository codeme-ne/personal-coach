
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Alert, 
  Modal,
  View,
  Platform
} from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { habitService, Habit } from '../habitService';
import { HabitHistory } from './HabitHistory';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface HabitWithStreak extends Habit {
  streak: number;
  completedToday: boolean;
}

export function HabitList() {
  const [habits, setHabits] = useState<HabitWithStreak[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitDescription, setNewHabitDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [selectedHabitForHistory, setSelectedHabitForHistory] = useState<Habit | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const colorScheme = useColorScheme();

  useEffect(() => {
    loadHabits();
    // Expose the modal trigger function globally for FAB access
    (global as any).showAddHabitModal = () => {
      setEditingHabit(null);
      setNewHabitName('');
      setNewHabitDescription('');
      setShowAddModal(true);
    };
    
    return () => {
      // Cleanup on unmount
      delete (global as any).showAddHabitModal;
    };
  }, []);

  const loadHabits = async () => {
    try {
      setLoading(true);
      const habitsFromDb = await habitService.getHabits();
      
      // Load streak and completion status for each habit
      const habitsWithData = await Promise.all(
        habitsFromDb.map(async (habit) => {
          const streak = await habitService.getHabitStreak(habit.id!);
          const completedToday = await habitService.isHabitCompletedToday(habit.id!);
          return { ...habit, streak, completedToday };
        })
      );
      
      setHabits(habitsWithData);
    } catch (error) {
      Alert.alert('Error', 'Could not load habits');
    } finally {
      setLoading(false);
    }
  };

  const addHabit = async () => {
    if (!newHabitName.trim()) {
      Alert.alert('Notice', 'Please enter a habit name');
      return;
    }

    try {
      setLoading(true);
      
      if (editingHabit) {
        // Update existing habit
        await habitService.updateHabit(editingHabit.id!, {
          name: newHabitName.trim(),
          description: newHabitDescription.trim(),
        });
      } else {
        // Add new habit
        await habitService.addHabit(newHabitName.trim(), newHabitDescription.trim());
      }
      
      setNewHabitName('');
      setNewHabitDescription('');
      setShowAddModal(false);
      setEditingHabit(null);
      
      // Clear habits first to force re-render, then reload with small delay
      setHabits([]);
      setTimeout(async () => {
        await loadHabits();
      }, 500);
    } catch (error) {
      Alert.alert('Error', editingHabit ? 'Could not update habit' : 'Could not add habit');
    } finally {
      setLoading(false);
    }
  };

  const toggleHabitCompletion = async (habit: HabitWithStreak) => {
    try {
      if (habit.completedToday) {
        await habitService.uncompleteHabitForToday(habit.id!);
      } else {
        await habitService.completeHabitForToday(habit.id!);
      }
      await loadHabits();
    } catch (error) {
      Alert.alert('Error', 'Could not update habit');
    }
  };

  const deleteHabit = async (id: string) => {
    const performDelete = async () => {
      try {
        await habitService.deleteHabit(id);
        await loadHabits();
      } catch (error) {
        const errorMessage = 'Could not delete habit';
        if (Platform.OS === 'web') {
          window.alert(errorMessage);
        } else {
          Alert.alert('Error', errorMessage);
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete this habit? All history will be lost.');
      if (confirmed) {
        await performDelete();
      }
    } else {
      Alert.alert(
        'Delete Habit',
        'Are you sure you want to delete this habit? All history will be lost.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: performDelete,
          },
        ]
      );
    }
  };

  const editHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setNewHabitName(habit.name);
    setNewHabitDescription(habit.description || '');
    setShowAddModal(true);
  };

  const renderHabit = ({ item }: { item: HabitWithStreak }) => (
    <ThemedView style={styles.habitItem}>
      <TouchableOpacity
        style={styles.habitContent}
        onPress={() => toggleHabitCompletion(item)}
        onLongPress={() => {
          setSelectedHabitForHistory(item);
          setShowHistoryModal(true);
        }}
      >
        <ThemedView style={[
          styles.checkbox,
          item.completedToday && styles.checkboxCompleted,
          { borderColor: '#000000' }
        ]}>
          {item.completedToday && <ThemedText style={styles.checkmark}>✓</ThemedText>}
        </ThemedView>
        
        <ThemedView style={styles.habitInfo}>
          <ThemedText style={[styles.habitName, { color: '#000000' }]}>{item.name}</ThemedText>
          <ThemedView style={styles.streakContainer}>
            <ThemedText style={[styles.streakText, { color: '#000000' }]}>
              {item.streak > 0 ? `🔥 ${item.streak} day streak` : 'No streak yet'}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </TouchableOpacity>
      
      <ThemedView style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => {
            setSelectedHabitForHistory(item);
            setShowHistoryModal(true);
          }}
        >
          <ThemedText style={styles.historyButtonText}>📊</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => editHabit(item)}
        >
          <ThemedText style={styles.editButtonText}>✏️</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteHabit(item.id!)}
        >
          <ThemedText style={styles.deleteButtonText}>🗑️</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="subtitle" style={[styles.title, { color: '#FFFFFF' }]}>My Habits</ThemedText>
      </ThemedView>

      {/* Habit List */}
      {habits.length === 0 && !loading ? (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText style={[styles.emptyText, { color: '#000000' }]}>
            No habits yet. Add your first habit to get started!
          </ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={habits}
          renderItem={renderHabit}
          keyExtractor={(item) => item.id!}
          style={styles.habitList}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={loadHabits}
        />
      )}

      {/* Add/Edit Habit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText type="subtitle" style={[styles.modalTitle, { color: '#000000' }]}>
              {editingHabit ? 'Edit Habit' : 'Add New Habit'}
            </ThemedText>
            
            <TextInput
              style={[
                styles.input,
                { 
                  borderColor: '#000000',
                  color: '#000000'
                }
              ]}
              id="habit-name-input"
              nativeID="habit-name-input"
              accessibilityLabel="Habit name"
              accessibilityHint="Enter the name of the habit you want to track"
              placeholder="Habit name (e.g., Exercise, Read, Meditate)"
              placeholderTextColor="#00000080"
              value={newHabitName}
              onChangeText={setNewHabitName}
              autoFocus
              autoComplete="off"
              textContentType="none"
            />
            
            <TextInput
              style={[
                styles.input,
                styles.descriptionInput,
                { 
                  borderColor: '#000000',
                  color: '#000000'
                }
              ]}
              id="habit-description-input"
              nativeID="habit-description-input"
              accessibilityLabel="Habit description"
              accessibilityHint="Optional description to provide more details about your habit"
              placeholder="Description (optional)"
              placeholderTextColor="#00000080"
              value={newHabitDescription}
              onChangeText={setNewHabitDescription}
              multiline
              numberOfLines={3}
              autoComplete="off"
              textContentType="none"
            />
            
            <ThemedView style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  setEditingHabit(null);
                  setNewHabitName('');
                  setNewHabitDescription('');
                }}
              >
                <ThemedText style={{ color: '#000000' }}>Cancel</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.saveButton,
                  { backgroundColor: Colors[colorScheme ?? 'light'].tint }
                ]}
                onPress={addHabit}
                disabled={loading}
              >
                <ThemedText style={styles.saveButtonText}>
                  {loading ? 'Saving...' : editingHabit ? 'Update' : 'Add'}
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </View>
      </Modal>

      {/* Habit History Modal */}
      <HabitHistory
        habit={selectedHabitForHistory}
        visible={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedHabitForHistory(null);
          loadHabits(); // Refresh data when closing history
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  habitList: {
    flex: 1,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  habitContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderRadius: 14,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    fontSize: 14,
    opacity: 0.7,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  historyButton: {
    padding: 8,
  },
  historyButtonText: {
    fontSize: 18,
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 18,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 18,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cancelButton: {
    backgroundColor: '#E5E5E5',
    borderWidth: 1,
    borderColor: '#D0D0D0',
  },
  saveButton: {
    // backgroundColor set dynamically
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});