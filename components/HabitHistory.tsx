// === Optimierte HabitHistory Komponente mit Paginierung ===
// Zweck: Performance-optimierte Historie-Anzeige mit Infinite Scroll
// Features: Lazy Loading, Virtualisierung, Batch-Loading

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  StyleSheet, 
  Modal,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { habitService, Habit, HabitCompletion } from '../habitService';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useFeedback } from '@/contexts/FeedbackContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// === Constants ===
const INITIAL_LOAD_DAYS = 90; // Initial 3 Monate laden
const LOAD_MORE_DAYS = 90; // Weitere 3 Monate bei Scroll
const PAGE_SIZE = 30; // Anzahl Completions pro Page

// === Props Interface ===
interface HabitHistoryProps {
  habit: Habit | null;
  visible: boolean;
  onClose: () => void;
}

// === Gruppierte Completions ===
interface GroupedCompletions {
  month: string;
  year: number;
  completions: HabitCompletion[];
}

export function HabitHistory({ habit, visible, onClose }: HabitHistoryProps) {
  // State
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastLoadedDoc, setLastLoadedDoc] = useState<any>(null);
  const [totalCompletions, setTotalCompletions] = useState(0);
  
  // Hooks
  const colorScheme = useColorScheme();
  const { showError } = useFeedback();
  
  // === Date Helpers ===
  const formatDate = useCallback((date: Date): string => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('de-DE', options);
  }, []);
  
  const isToday = useCallback((date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }, []);
  
  const isYesterday = useCallback((date: Date): boolean => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  }, []);
  
  const getDateLabel = useCallback((date: Date): string => {
    if (isToday(date)) return 'Heute';
    if (isYesterday(date)) return 'Gestern';
    return formatDate(date);
  }, [isToday, isYesterday, formatDate]);
  
  // === Data Loading ===
  const loadInitialHistory = useCallback(async () => {
    if (!habit) return;
    
    try {
      setLoading(true);
      
      // Lade Streak
      const habitStreak = await habitService.getHabitStreak(habit.id!);
      setStreak(habitStreak);
      
      // Lade erste Seite der Completions
      const initialCompletions = await habitService.getHabitCompletions(
        habit.id!,
        PAGE_SIZE
      );
      
      setCompletions(initialCompletions);
      setTotalCompletions(initialCompletions.length);
      
      // Prüfe ob es mehr Daten gibt
      if (initialCompletions.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setLastLoadedDoc(initialCompletions[initialCompletions.length - 1]);
        setHasMore(true);
      }
    } catch (error) {
      console.error('Error loading habit history:', error);
      showError('Historie konnte nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, [habit, showError]);
  
  const loadMoreHistory = useCallback(async () => {
    if (!habit || !hasMore || loadingMore || !lastLoadedDoc) return;
    
    try {
      setLoadingMore(true);
      
      // Lade nächste Seite
      const moreCompletions = await habitService.getHabitCompletions(
        habit.id!,
        PAGE_SIZE,
        lastLoadedDoc
      );
      
      if (moreCompletions.length > 0) {
        setCompletions(prev => [...prev, ...moreCompletions]);
        setTotalCompletions(prev => prev + moreCompletions.length);
        
        if (moreCompletions.length < PAGE_SIZE) {
          setHasMore(false);
        } else {
          setLastLoadedDoc(moreCompletions[moreCompletions.length - 1]);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more history:', error);
      showError('Weitere Daten konnten nicht geladen werden');
    } finally {
      setLoadingMore(false);
    }
  }, [habit, hasMore, loadingMore, lastLoadedDoc, showError]);
  
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setCompletions([]);
    setLastLoadedDoc(null);
    setHasMore(true);
    await loadInitialHistory();
    setRefreshing(false);
  }, [loadInitialHistory]);
  
  // === Effects ===
  useEffect(() => {
    if (habit && visible) {
      loadInitialHistory();
    }
    
    // Cleanup bei Modal-Schließung
    if (!visible) {
      setCompletions([]);
      setLastLoadedDoc(null);
      setHasMore(true);
      setTotalCompletions(0);
    }
  }, [habit, visible, loadInitialHistory]);
  
  // === Gruppierung der Completions ===
  const groupedCompletions = useMemo((): GroupedCompletions[] => {
    const grouped: { [key: string]: GroupedCompletions } = {};
    
    completions.forEach(completion => {
      const date = completion.completedAt;
      const monthYear = date.toLocaleDateString('de-DE', { 
        year: 'numeric', 
        month: 'long' 
      });
      const year = date.getFullYear();
      
      if (!grouped[monthYear]) {
        grouped[monthYear] = {
          month: monthYear,
          year,
          completions: []
        };
      }
      
      grouped[monthYear].completions.push(completion);
    });
    
    // Sortiere nach Jahr und Monat (neueste zuerst)
    return Object.values(grouped).sort((a, b) => {
      const dateA = new Date(a.completions[0].completedAt);
      const dateB = new Date(b.completions[0].completedAt);
      return dateB.getTime() - dateA.getTime();
    });
  }, [completions]);
  
  // === Statistiken ===
  const statistics = useMemo(() => {
    if (completions.length === 0) return null;
    
    const sortedCompletions = [...completions].sort(
      (a, b) => a.completedAt.getTime() - b.completedAt.getTime()
    );
    
    const firstCompletion = sortedCompletions[0];
    const daysSinceStart = Math.floor(
      (Date.now() - firstCompletion.completedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const completionRate = daysSinceStart > 0 
      ? Math.round((completions.length / daysSinceStart) * 100) 
      : 100;
    
    return {
      totalDays: totalCompletions,
      firstDay: firstCompletion.completedAt,
      completionRate,
      currentStreak: streak,
    };
  }, [completions, totalCompletions, streak]);
  
  // === Scroll Handler ===
  const handleScroll = useCallback((event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom = 
      layoutMeasurement.height + contentOffset.y >= 
      contentSize.height - paddingToBottom;
    
    if (isCloseToBottom && hasMore && !loadingMore) {
      loadMoreHistory();
    }
  }, [hasMore, loadingMore, loadMoreHistory]);
  
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
          {/* Header */}
          <ThemedView style={styles.header}>
            <ThemedView style={styles.headerInfo}>
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
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </ThemedView>
          
          {/* Statistiken */}
          {statistics && (
            <ThemedView style={styles.statsContainer}>
              <ThemedView style={styles.statItem}>
                <MaterialIcons name="local-fire-department" size={24} color="#FF6B35" />
                <ThemedText style={styles.statValue}>{statistics.currentStreak}</ThemedText>
                <ThemedText style={styles.statLabel}>Aktuelle Serie</ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.statItem}>
                <MaterialIcons name="calendar-today" size={24} color="#3B82F6" />
                <ThemedText style={styles.statValue}>{statistics.totalDays}</ThemedText>
                <ThemedText style={styles.statLabel}>Tage gesamt</ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.statItem}>
                <MaterialIcons name="trending-up" size={24} color="#10B981" />
                <ThemedText style={styles.statValue}>{statistics.completionRate}%</ThemedText>
                <ThemedText style={styles.statLabel}>Erfolgsrate</ThemedText>
              </ThemedView>
            </ThemedView>
          )}
          
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Verlauf
          </ThemedText>
          
          {/* Historie Liste mit Infinite Scroll */}
          {loading ? (
            <ThemedView style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
              <ThemedText style={styles.loadingText}>Lade Historie...</ThemedText>
            </ThemedView>
          ) : completions.length === 0 ? (
            <ThemedView style={styles.emptyContainer}>
              <MaterialIcons name="history" size={48} color="#9CA3AF" />
              <ThemedText style={styles.emptyText}>
                Noch keine Einträge vorhanden.{'\n'}
                Starte heute und baue deine Serie auf!
              </ThemedText>
            </ThemedView>
          ) : (
            <ScrollView 
              style={styles.historyList}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={400}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[Colors[colorScheme ?? 'light'].tint]}
                  tintColor={Colors[colorScheme ?? 'light'].tint}
                />
              }
            >
              {groupedCompletions.map((group) => (
                <ThemedView key={group.month} style={styles.monthSection}>
                  <ThemedText style={styles.monthTitle}>{group.month}</ThemedText>
                  <ThemedView style={styles.monthGrid}>
                    {group.completions.map((completion) => (
                      <TouchableOpacity
                        key={completion.id}
                        style={styles.completionItem}
                        activeOpacity={0.7}
                      >
                        <ThemedText style={styles.completionDate}>
                          {getDateLabel(completion.completedAt)}
                        </ThemedText>
                        <View style={styles.checkIconContainer}>
                          <MaterialIcons name="check-circle" size={20} color="#10B981" />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ThemedView>
                </ThemedView>
              ))}
              
              {/* Load More Indicator */}
              {loadingMore && (
                <ThemedView style={styles.loadMoreContainer}>
                  <ActivityIndicator size="small" color={Colors[colorScheme ?? 'light'].tint} />
                  <ThemedText style={styles.loadMoreText}>Lade weitere Einträge...</ThemedText>
                </ThemedView>
              )}
              
              {!hasMore && completions.length > 0 && (
                <ThemedView style={styles.endMessage}>
                  <ThemedText style={styles.endMessageText}>
                    Das ist der Anfang deiner Reise! 🌟
                  </ThemedText>
                </ThemedView>
              )}
              
              {/* Spacer für besseres Scrolling */}
              <View style={{ height: 20 }} />
            </ScrollView>
          )}
        </ThemedView>
      </View>
    </Modal>
  );
}

// === Styles ===
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingTop: 8,
  },
  headerInfo: {
    flex: 1,
    marginRight: 16,
  },
  habitName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
    fontWeight: '600',
  },
  historyList: {
    flex: 1,
  },
  monthSection: {
    marginBottom: 24,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    opacity: 0.8,
    textTransform: 'capitalize',
  },
  monthGrid: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 12,
    padding: 8,
  },
  completionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 6,
    backgroundColor: 'white',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  completionDate: {
    fontSize: 15,
    fontWeight: '500',
  },
  checkIconContainer: {
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    opacity: 0.6,
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
    marginTop: 16,
    lineHeight: 22,
  },
  loadMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadMoreText: {
    marginLeft: 8,
    fontSize: 14,
    opacity: 0.6,
  },
  endMessage: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  endMessageText: {
    fontSize: 14,
    opacity: 0.5,
    fontStyle: 'italic',
  },
});