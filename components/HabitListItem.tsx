// === Vereinfachte HabitListItem Komponente ===
// Zweck: Einfache Habit-Item Komponente ohne Animationen
// Features: Einfacher grüner Haken, klare Toggle-Funktion

import React, { memo, useCallback } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
  Alert,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { HabitWithStreak } from '../stores/habitStore';
import { ThemedText } from './ThemedText';
import { Card } from './ui/Card';
import { IconButton } from './ui/IconButton';
import { useFeedback } from '../contexts/FeedbackContext';

// === Props Interface ===
interface HabitListItemProps {
  habit: HabitWithStreak;
  onToggleComplete: (habit: HabitWithStreak) => Promise<void>;
  onEdit: (habit: HabitWithStreak) => void;
  onDelete: (habitId: string) => Promise<void>;
  onShowStats: (habit: HabitWithStreak) => void;
}

// === Memoized Component ===
export const HabitListItem = memo<HabitListItemProps>(({
  habit,
  onToggleComplete,
  onEdit,
  onDelete,
  onShowStats,
}) => {
  const { showSuccess, showError } = useFeedback();
  
  const isCompleted = habit.completedToday;
  const hasStreak = habit.streak > 0;
  
  const streakColor = habit.streak >= 30 ? '#FF6B35' : 
                      habit.streak >= 7 ? '#FFA500' : 
                      '#FFD700';
  
  // === Event Handler ===
  const handleToggleComplete = useCallback(async () => {
    console.log('HabitListItem: handleToggleComplete called for:', habit.name, 'Current state:', habit.completedToday);
    
    // Verhindere mehrfaches Klicken während des Ladens
    if (habit.isLoading) return;
    
    // Call the toggle function - no error handling needed
    await onToggleComplete(habit);
    console.log('HabitListItem: Toggle completed');
  }, [habit, onToggleComplete]);
  
  const handleEdit = useCallback(() => {
    onEdit(habit);
  }, [habit, onEdit]);
  
  const handleDelete = useCallback(async () => {
    const message = `Möchten Sie "${habit.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`;
    
    const confirmed = Platform.OS === 'web' 
      ? window.confirm(message)
      : await new Promise((resolve) => {
          Alert.alert(
            'Gewohnheit löschen',
            message,
            [
              { text: 'Abbrechen', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Löschen', style: 'destructive', onPress: () => resolve(true) }
            ]
          );
        });
    
    if (confirmed) {
      try {
        await onDelete(habit.id!);
        showSuccess(`${habit.name} wurde gelöscht`);
      } catch (error) {
        console.error('Delete error:', error);
        showError('Fehler beim Löschen der Gewohnheit');
      }
    }
  }, [habit, onDelete, showSuccess, showError]);
  
  const handleShowStats = useCallback(() => {
    onShowStats(habit);
  }, [habit, onShowStats]);

  return (
    <Card style={[styles.habitItem, habit.isLoading && styles.loadingItem]}>
      {/* Haupt-Touchable-Bereich */}
      <TouchableOpacity
        style={styles.mainArea}
        onPress={handleToggleComplete}
        disabled={habit.isLoading}
        activeOpacity={0.7}
      >
        {/* Checkmark/Icon Bereich */}
        <View style={[styles.iconSquare, isCompleted && styles.completedIconSquare]}>
          {isCompleted ? (
            <MaterialIcons name="check" size={24} color="#FFFFFF" />
          ) : (
            <View style={styles.emptyCircle} />
          )}
        </View>

        {/* Text Bereich */}
        <View style={styles.textArea}>
          <ThemedText style={[styles.itemTitle, isCompleted && styles.completedItemTitle]}>
            {habit.name}
          </ThemedText>
          
          {habit.description && (
            <ThemedText style={[styles.itemDescription, isCompleted && styles.completedItemDescription]}>
              {habit.description}
            </ThemedText>
          )}

          {/* Streak Anzeige */}
          {hasStreak ? (
            <View style={[styles.streakContainer, { backgroundColor: streakColor }]}>
              <MaterialIcons name="local-fire-department" size={16} color="#FFFFFF" />
              <ThemedText style={styles.streakText}>
                {habit.streak} {habit.streak === 1 ? 'Tag' : 'Tage'}
              </ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.noStreakText}>Noch keine Serie</ThemedText>
          )}
          
          {/* Status Anzeige */}
          {isCompleted && (
            <ThemedText style={styles.completedText}>✓ Heute erledigt</ThemedText>
          )}
        </View>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <IconButton
          icon={<MaterialIcons name="analytics" size={20} color="#666666" />}
          size="sm"
          variant="ghost"
          onPress={handleShowStats}
          accessibilityLabel={`Statistiken für ${habit.name} anzeigen`}
        />
        <IconButton
          icon={<MaterialIcons name="edit" size={20} color="#666666" />}
          size="sm"
          variant="ghost"
          onPress={handleEdit}
          accessibilityLabel={`${habit.name} bearbeiten`}
        />
        <IconButton
          icon={<MaterialIcons name="delete" size={20} color="#666666" />}
          size="sm"
          variant="ghost"
          onPress={handleDelete}
          accessibilityLabel={`${habit.name} löschen`}
        />
      </View>

      {/* Loading Overlay */}
      {habit.isLoading && (
        <View style={styles.loadingOverlay}>
          <ThemedText style={styles.loadingText}>Aktualisiere...</ThemedText>
        </View>
      )}
    </Card>
  );
});

// Performance-Optimierung mit React.memo areEqual
HabitListItem.displayName = 'HabitListItem';

const styles = StyleSheet.create({
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingItem: {
    opacity: 0.7,
  },
  mainArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSquare: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  completedIconSquare: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  emptyCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCCCCC',
  },
  textArea: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  completedItemTitle: {
    textDecorationLine: 'line-through',
    color: '#888888',
  },
  itemDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  completedItemDescription: {
    color: '#AAAAAA',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  streakText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  noStreakText: {
    fontSize: 12,
    color: '#AAAAAA',
    fontStyle: 'italic',
    marginTop: 4,
  },
  completedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
});