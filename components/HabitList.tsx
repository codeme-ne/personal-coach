import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Habit, habitService } from '../habitService';
import { HabitStreakModal } from './HabitStreakModal';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Card } from './ui/Card';
import { IconButton } from './ui/IconButton';

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
  const [selectedHabitForStreak, setSelectedHabitForStreak] = useState<Habit | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const colorScheme = useColorScheme();

  useEffect(() => {
    const initializeApp = async () => {
      // Check if we need to reset habits (new day)
      try {
        const today = new Date().toDateString();
        const lastResetDate = await AsyncStorage.getItem('lastResetDate');
        
        if (lastResetDate !== today) {
          // It's a new day, refresh the habits to update completion status
          await AsyncStorage.setItem('lastResetDate', today);
        }
      } catch (resetError) {
        console.log('Reset check failed:', resetError);
      }
      
      // Load habits after reset check
      loadHabits();
    };
    
    initializeApp();
    
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
    // Verhindere das Zurücksetzen von bereits abgehakten Gewohnheiten
    if (habit.completedToday) {
      return;
    }
    
    try {
      await habitService.completeHabitForToday(habit.id!);
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
    <Card variant="default" style={styles.habitItem}>
        <TouchableOpacity
          style={styles.habitContent}
          onPress={() => toggleHabitCompletion(item)}
        >
          {/* Checkmark or square icon based on completion status */}
          <View style={[
            styles.iconSquare, 
            item.completedToday && styles.completedIconSquare
          ]}>
            {item.completedToday && (
              <MaterialIcons name="check" size={24} color="white" />
            )}
          </View>
          
          <View style={styles.textContainer}>
            <ThemedText style={[
              styles.itemTitle,
              item.completedToday && styles.completedItemTitle
            ]}>
              {item.name}
            </ThemedText>
            <View style={styles.streakContainer}>
              <ThemedText style={[
                styles.itemDescription,
                item.completedToday && styles.completedItemDescription
              ]}>
                {item.completedToday 
                  ? `✓ Completed today • `
                  : ''
                }
              </ThemedText>
              {item.streak > 0 && (
                <View style={styles.streakBadge}>
                  <MaterialIcons name="local-fire-department" size={16} color="#FF6B35" />
                  <ThemedText style={styles.streakText}>{item.streak}</ThemedText>
                </View>
              )}
              {item.streak === 0 && (
                <ThemedText style={[
                  styles.itemDescription,
                  item.completedToday && styles.completedItemDescription
                ]}>
                  No streak yet
                </ThemedText>
              )}
            </View>
          </View>
        </TouchableOpacity>
        
        <View style={styles.actions}>
        <IconButton
          icon={<MaterialIcons name="bar-chart" size={20} color="#687076" />}
          size="small"
          onPress={() => {
            setSelectedHabitForStreak(item);
            setShowStreakModal(true);
          }}
          accessibilityLabel="View habit statistics"
        />
        <IconButton
          icon={<MaterialIcons name="edit" size={20} color="#687076" />}
          size="small"
          onPress={() => editHabit(item)}
          accessibilityLabel="Edit habit"
        />
        <IconButton
          icon={<MaterialIcons name="delete" size={20} color="#687076" />}
          size="small"
          onPress={() => deleteHabit(item.id!)}
          accessibilityLabel="Delete habit"
        />
      </View>
    </Card>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Removed the header with "My Habits" */}

      {/* Habit List */}
      {habits.length === 0 && !loading ? (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>
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

      {/* Habit Streak Modal */}
      <HabitStreakModal
        visible={showStreakModal}
        onClose={() => {
          setShowStreakModal(false);
          setSelectedHabitForStreak(null);
        }}
        habitId={selectedHabitForStreak?.id || ''}
        habitName={selectedHabitForStreak?.name || ''}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  habitList: {
    flex: 1,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  habitContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSquare: {
    width: 36,
    height: 36,
    backgroundColor: '#E1F0FF',
    borderRadius: 8,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedIconSquare: {
    backgroundColor: '#34C759', // Green background for completed habits
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 4,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 2,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  completedItemTitle: {
    color: '#34C759',
    fontWeight: '600',
  },
  itemDescription: {
    fontSize: 14,
    color: '#687076',
    marginTop: 2,
  },
  completedItemDescription: {
    color: '#34C759',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  
  // Keep the rest of your styles for modals and other elements...
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