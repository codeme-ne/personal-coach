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
  View,
  RefreshControl
} from 'react-native';
import { Habit } from '../habitService';
import { useHabitStore, HabitWithStreak } from '../stores/habitStore';
import { HabitListItem } from './HabitListItem';
import { HabitStreakModal } from './HabitStreakModal';
import { useFeedback } from '../contexts/FeedbackContext';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Card } from './ui/Card';
import { IconButton } from './ui/IconButton';

export function HabitList() {
  // Zustand Store für globales State Management
  const {
    habits,
    isLoading,
    error,
    loadHabits,
    addHabitOptimistic,
    updateHabitOptimistic,
    deleteHabitOptimistic,
    toggleHabitCompletionOptimistic,
    subscribeToHabits,
    unsubscribeAll,
    refreshAll
  } = useHabitStore();
  
  // Feedback Hook für Toast-Nachrichten
  const { showInfo, showError } = useFeedback();
  
  // Lokaler State nur für UI-spezifische Dinge
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitDescription, setNewHabitDescription] = useState('');
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [selectedHabitForStreak, setSelectedHabitForStreak] = useState<Habit | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
      
      // Initial load und Real-time Subscription aktivieren
      loadHabits();
      subscribeToHabits();
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
      unsubscribeAll();
    };
  }, []);

  // Pull-to-refresh Handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAll();
    setIsRefreshing(false);
  };

  const addHabit = async () => {
    if (!newHabitName.trim()) {
      showInfo('Bitte geben Sie einen Namen für die Gewohnheit ein');
      return;
    }

    try {
      if (editingHabit) {
        // Update existing habit mit optimistischem Update
        await updateHabitOptimistic(editingHabit.id!, {
          name: newHabitName.trim(),
          description: newHabitDescription.trim(),
        });
      } else {
        // Add new habit mit optimistischem Update
        await addHabitOptimistic(newHabitName.trim(), newHabitDescription.trim());
      }
      
      // Modal schließen und Form zurücksetzen
      setNewHabitName('');
      setNewHabitDescription('');
      setShowAddModal(false);
      setEditingHabit(null);
    } catch (error) {
      showError(editingHabit ? 'Gewohnheit konnte nicht aktualisiert werden' : 'Gewohnheit konnte nicht hinzugefügt werden');
    }
  };

  const toggleHabitCompletion = async (habit: HabitWithStreak) => {
    console.log('Toggle habit completion called for:', habit.name, 'Current state:', habit.completedToday);
    // Nutze optimistisches Update für sofortiges Feedback
    await toggleHabitCompletionOptimistic(habit.id!);
    console.log('Toggle habit completion completed successfully');
    // Kein Error-Handling mehr - Store behandelt das jetzt graceful
  };

  const deleteHabit = async (id: string) => {
    try {
      // Nutze optimistisches Delete für sofortiges UI-Feedback
      await deleteHabitOptimistic(id);
    } catch (error) {
      showError('Gewohnheit konnte nicht gelöscht werden');
    }
  };

  const editHabit = (habit: HabitWithStreak) => {
    setEditingHabit(habit);
    setNewHabitName(habit.name);
    setNewHabitDescription(habit.description || '');
    setShowAddModal(true);
  };
  
  const showHabitStats = (habit: HabitWithStreak) => {
    setSelectedHabitForStreak(habit);
    setShowStreakModal(true);
  };

  const renderHabit = ({ item }: { item: HabitWithStreak }) => (
    <HabitListItem
      habit={item}
      onToggleComplete={toggleHabitCompletion}
      onEdit={editHabit}
      onDelete={deleteHabit}
      onShowStats={showHabitStats}
    />
  );

  return (
    <ThemedView style={styles.container}>
      {/* Removed the header with "My Habits" */}

      {/* Habit List mit Pull-to-Refresh */}
      {habits.length === 0 && !isLoading ? (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>
            Noch keine Gewohnheiten. Fügen Sie Ihre erste Gewohnheit hinzu!
          </ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={habits}
          renderItem={renderHabit}
          keyExtractor={(item) => item.id!}
          style={styles.habitList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[Colors[colorScheme ?? 'light'].tint]}
              tintColor={Colors[colorScheme ?? 'light'].tint}
            />
          }
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
              {editingHabit ? 'Gewohnheit bearbeiten' : 'Neue Gewohnheit'}
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
              placeholder="Name der Gewohnheit (z.B. Sport, Lesen, Meditieren)"
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
              placeholder="Beschreibung (optional)"
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
                <ThemedText style={{ color: '#000000' }}>Abbrechen</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.saveButton,
                  { backgroundColor: Colors[colorScheme ?? 'light'].tint }
                ]}
                onPress={addHabit}
                disabled={isLoading}
              >
                <ThemedText style={styles.saveButtonText}>
                  {isLoading ? 'Speichern...' : editingHabit ? 'Aktualisieren' : 'Hinzufügen'}
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