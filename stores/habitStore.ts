// === Zustand Store für Habit Management ===
// Zweck: Zentrales State Management mit optimistischen Updates und Echtzeit-Sync
// Features: Globaler State, Optimistische Updates, Error Handling, Performance-Optimierungen

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Habit, HabitCompletion, habitService } from '../habitService';
import { Unsubscribe } from 'firebase/firestore';

// Erweiterte Habit-Typen mit UI-spezifischen Daten
export interface HabitWithStreak extends Habit {
  streak: number;
  completedToday: boolean;
  isLoading?: boolean; // Für optimistische Updates
}

// Store State Interface
interface HabitStore {
  // State
  habits: HabitWithStreak[];
  todayCompletions: Array<{ habit: Habit; completion: HabitCompletion }>;
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
  
  // Subscriptions
  habitsUnsubscribe: Unsubscribe | null;
  completionsUnsubscribe: Unsubscribe | null;
  
  // Actions - Basis CRUD
  setHabits: (habits: HabitWithStreak[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Actions - Optimistische Updates
  addHabitOptimistic: (name: string, description?: string) => Promise<void>;
  updateHabitOptimistic: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabitOptimistic: (id: string) => Promise<void>;
  toggleHabitCompletionOptimistic: (habitId: string) => Promise<void>;
  
  // Actions - Daten laden
  loadHabits: () => Promise<void>;
  loadTodayCompletions: () => Promise<void>;
  refreshAll: () => Promise<void>;
  
  // Actions - Echtzeit Subscriptions
  subscribeToHabits: () => void;
  subscribeToTodayCompletions: () => void;
  unsubscribeAll: () => void;
  
  // Selectors
  getHabitById: (id: string) => HabitWithStreak | undefined;
  getCompletedHabitsCount: () => number;
  getProgressPercentage: () => number;
  getHabitsWithStreaks: () => HabitWithStreak[];
  
  // Chart Data Aggregations
  getCompletedHabitsPerDay: () => Promise<{ x: string; y: number }[]>;
  getDailySuccessRate: () => Promise<{ x: number; y: number }[]>;
  getHabitCompletionDates: (habitId: string, days: number) => Promise<{ [key: string]: boolean }>;
}

// Zustand Store mit Middleware
export const useHabitStore = create<HabitStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    habits: [],
    todayCompletions: [],
    isLoading: false,
    error: null,
    lastSync: null,
    habitsUnsubscribe: null,
    completionsUnsubscribe: null,
    
    // === Basis State Setters ===
    setHabits: (habits) => set({ habits, lastSync: new Date() }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    
    // === Optimistische Updates ===
    addHabitOptimistic: async (name, description) => {
      // Optimistisches Update - Sofort UI aktualisieren
      const tempId = `temp-${Date.now()}`;
      const optimisticHabit: HabitWithStreak = {
        id: tempId,
        name,
        description: description || '',
        createdAt: new Date(),
        userId: '', // Wird vom Service gefüllt
        streak: 0,
        completedToday: false,
        isLoading: true,
      };
      
      set((state) => ({
        habits: [optimisticHabit, ...state.habits],
      }));
      
      try {
        // Echte Datenbank-Operation
        const newHabitId = await habitService.addHabit(name, description);
        
        // Update mit echter ID
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === tempId
              ? { ...h, id: newHabitId, isLoading: false }
              : h
          ),
        }));
        
        // Volle Synchronisation für Konsistenz
        await get().loadHabits();
      } catch (error) {
        // Rollback bei Fehler
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== tempId),
          error: 'Gewohnheit konnte nicht hinzugefügt werden',
        }));
        console.error('Error adding habit:', error);
        throw error;
      }
    },
    
    updateHabitOptimistic: async (id, updates) => {
      // Speichere Original für Rollback
      const originalHabits = get().habits;
      
      // Optimistisches Update
      set((state) => ({
        habits: state.habits.map((h) =>
          h.id === id ? { ...h, ...updates, isLoading: true } : h
        ),
      }));
      
      try {
        await habitService.updateHabit(id, updates);
        
        // Update erfolgreich - Loading entfernen
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, isLoading: false } : h
          ),
        }));
      } catch (error) {
        // Rollback bei Fehler
        set({ habits: originalHabits, error: 'Update fehlgeschlagen' });
        console.error('Error updating habit:', error);
        throw error;
      }
    },
    
    deleteHabitOptimistic: async (id) => {
      // Speichere Original für Rollback
      const originalHabits = get().habits;
      
      // Optimistisches Löschen
      set((state) => ({
        habits: state.habits.filter((h) => h.id !== id),
      }));
      
      try {
        await habitService.deleteHabit(id);
      } catch (error) {
        // Rollback bei Fehler
        set({ habits: originalHabits, error: 'Löschen fehlgeschlagen' });
        console.error('Error deleting habit:', error);
        throw error;
      }
    },
    
    toggleHabitCompletionOptimistic: async (habitId) => {
      console.log('Store: toggleHabitCompletionOptimistic called for habitId:', habitId);
      const habit = get().habits.find((h) => h.id === habitId);
      if (!habit) {
        console.error('Store: Habit not found with id:', habitId);
        return;
      }
      
      console.log('Store: Current habit state:', habit.name, 'completedToday:', habit.completedToday);
      
      // Optimistisches Update
      const newCompletedState = !habit.completedToday;
      const newStreak = newCompletedState ? habit.streak + 1 : Math.max(0, habit.streak - 1);
      
      console.log('Store: Setting optimistic state - newCompletedState:', newCompletedState, 'newStreak:', newStreak);
      
      // Sofort UI aktualisieren
      set((state) => ({
        habits: state.habits.map((h) =>
          h.id === habitId
            ? { ...h, completedToday: newCompletedState, streak: newStreak, isLoading: false } // isLoading auf false für sofortiges Update
            : h
        ),
      }));
      
      // Firebase-Aufruf mit besserer Fehlerbehandlung
      try {
        if (newCompletedState) {
          console.log('Store: Calling completeHabitForToday');
          await habitService.completeHabitForToday(habitId);
        } else {
          console.log('Store: Calling uncompleteHabitForToday');
          await habitService.uncompleteHabitForToday(habitId);
        }
        
        console.log('Store: Firebase update successful');
        
        // Lade echte Streak-Daten nur wenn Firebase erfolgreich war
        try {
          const actualStreak = await habitService.getHabitStreak(habitId);
          set((state) => ({
            habits: state.habits.map((h) =>
              h.id === habitId
                ? { ...h, streak: actualStreak, isLoading: false }
                : h
            ),
          }));
        } catch (streakError) {
          console.warn('Could not update streak from Firebase:', streakError);
          // Behalte optimistischen Streak bei
        }
        
        // Versuche Today Completions zu aktualisieren
        try {
          await get().loadTodayCompletions();
        } catch (completionsError) {
          console.warn('Could not load today completions:', completionsError);
        }
      } catch (error) {
        console.error('Firebase Error (non-critical):', error);
        console.warn('Using local state only - Firebase sync failed');
        
        // KEIN Rollback - behalte lokalen State
        // Die UI bleibt aktualisiert, auch wenn Firebase fehlschlägt
        
        // Setze nur isLoading auf false
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId
              ? { ...h, isLoading: false }
              : h
          ),
        }));
        
        // Werfe KEINEN Fehler - die lokale Änderung war erfolgreich
        console.log('Local update successful despite Firebase error');
      }
    },
    
    // === Daten laden ===
    loadHabits: async () => {
      set({ isLoading: true, error: null });
      
      try {
        const habitsFromDb = await habitService.getHabits();
        
        // Parallel Streak und Completion Status laden für Performance
        const habitsWithData = await Promise.all(
          habitsFromDb.map(async (habit) => {
            const [streak, completedToday] = await Promise.all([
              habitService.getHabitStreak(habit.id!),
              habitService.isHabitCompletedToday(habit.id!),
            ]);
            
            return {
              ...habit,
              streak,
              completedToday,
              isLoading: false,
            };
          })
        );
        
        set({ habits: habitsWithData, isLoading: false, lastSync: new Date() });
      } catch (error) {
        set({ error: 'Gewohnheiten konnten nicht geladen werden', isLoading: false });
        console.error('Error loading habits:', error);
      }
    },
    
    loadTodayCompletions: async () => {
      try {
        const completions = await habitService.getTodayCompletedHabits();
        set({ todayCompletions: completions });
      } catch (error) {
        console.error('Error loading today completions:', error);
      }
    },
    
    refreshAll: async () => {
      await Promise.all([get().loadHabits(), get().loadTodayCompletions()]);
    },
    
    // === Echtzeit Subscriptions ===
    subscribeToHabits: () => {
      // Unsubscribe von vorherigen Subscriptions
      const currentUnsubscribe = get().habitsUnsubscribe;
      if (currentUnsubscribe) {
        currentUnsubscribe();
      }
      
      // Neue Subscription erstellen
      const unsubscribe = habitService.subscribeToHabits(
        async (habitsFromDb) => {
          // Lade zusätzliche Daten für jeden Habit
          const habitsWithData = await Promise.all(
            habitsFromDb.map(async (habit) => {
              const [streak, completedToday] = await Promise.all([
                habitService.getHabitStreak(habit.id!),
                habitService.isHabitCompletedToday(habit.id!),
              ]);
              
              return {
                ...habit,
                streak,
                completedToday,
                isLoading: false,
              };
            })
          );
          
          set({ habits: habitsWithData, lastSync: new Date() });
        },
        (error) => {
          set({ error: 'Echtzeit-Sync fehlgeschlagen' });
          console.error('Subscription error:', error);
        }
      );
      
      set({ habitsUnsubscribe: unsubscribe });
    },
    
    subscribeToTodayCompletions: () => {
      // Unsubscribe von vorherigen Subscriptions
      const currentUnsubscribe = get().completionsUnsubscribe;
      if (currentUnsubscribe) {
        currentUnsubscribe();
      }
      
      // Neue Subscription erstellen
      const unsubscribe = habitService.subscribeToTodayCompletedHabits(
        (completions) => {
          set({ todayCompletions: completions });
          
          // Aktualisiere completedToday Status in habits
          const habitIds = new Set(completions.map((c) => c.habit.id));
          set((state) => ({
            habits: state.habits.map((h) => ({
              ...h,
              completedToday: habitIds.has(h.id),
            })),
          }));
        },
        (error) => {
          console.error('Completions subscription error:', error);
        }
      );
      
      set({ completionsUnsubscribe: unsubscribe });
    },
    
    unsubscribeAll: () => {
      const { habitsUnsubscribe, completionsUnsubscribe } = get();
      
      if (habitsUnsubscribe) {
        habitsUnsubscribe();
        set({ habitsUnsubscribe: null });
      }
      
      if (completionsUnsubscribe) {
        completionsUnsubscribe();
        set({ completionsUnsubscribe: null });
      }
    },
    
    // === Selectors ===
    getHabitById: (id) => {
      return get().habits.find((h) => h.id === id);
    },
    
    getCompletedHabitsCount: () => {
      return get().habits.filter((h) => h.completedToday).length;
    },
    
    getProgressPercentage: () => {
      const habits = get().habits;
      if (habits.length === 0) return 0;
      return Math.round((get().getCompletedHabitsCount() / habits.length) * 100);
    },
    
    getHabitsWithStreaks: () => {
      return get().habits.filter((h) => h.streak > 0);
    },
    
    // === Chart Data Aggregations ===
    getCompletedHabitsPerDay: async () => {
      const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
      const today = new Date();
      const weekData = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dayIndex = date.getDay();
        const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1];
        
        // Count completed habits for this specific day
        const dateStart = new Date(date);
        dateStart.setHours(0, 0, 0, 0);
        const dateEnd = new Date(date);
        dateEnd.setHours(23, 59, 59, 999);
        
        try {
          const completions = await habitService.getCompletionsForDateRange(
            dateStart,
            dateEnd
          );
          
          // Count unique habit completions for this day
          const uniqueHabits = new Set(completions.map(c => c.habitId));
          weekData.push({
            x: dayName,
            y: uniqueHabits.size,
          });
        } catch (error) {
          console.error('Error fetching completions for day:', error);
          weekData.push({
            x: dayName,
            y: 0,
          });
        }
      }
      
      return weekData;
    },
    
    getDailySuccessRate: async () => {
      const monthData = [];
      const today = new Date();
      const totalHabits = get().habits.length;
      
      if (totalHabits === 0) {
        // Return empty data if no habits exist
        for (let i = 29; i >= 0; i--) {
          monthData.push({ x: 30 - i, y: 0 });
        }
        return monthData;
      }
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        const dateStart = new Date(date);
        dateStart.setHours(0, 0, 0, 0);
        const dateEnd = new Date(date);
        dateEnd.setHours(23, 59, 59, 999);
        
        try {
          const completions = await habitService.getCompletionsForDateRange(
            dateStart,
            dateEnd
          );
          
          // Calculate success rate
          const uniqueHabits = new Set(completions.map(c => c.habitId));
          const successRate = Math.round((uniqueHabits.size / totalHabits) * 100);
          
          monthData.push({
            x: 30 - i,
            y: successRate,
          });
        } catch (error) {
          console.error('Error fetching completions for date:', error);
          monthData.push({
            x: 30 - i,
            y: 0,
          });
        }
      }
      
      return monthData;
    },
    
    getHabitCompletionDates: async (habitId: string, days: number = 90) => {
      const calendarData: { [key: string]: boolean } = {};
      const today = new Date();
      
      try {
        // Fetch all completions for this habit
        const completions = await habitService.getHabitCompletions(habitId, days);
        
        // Create a set of completion dates
        const completionDates = new Set(
          completions.map(c => {
            const date = new Date(c.completedAt);
            return date.toISOString().split('T')[0];
          })
        );
        
        // Build calendar data for the specified number of days
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          calendarData[dateStr] = completionDates.has(dateStr);
        }
      } catch (error) {
        console.error('Error fetching habit completions:', error);
        
        // Return empty calendar data on error
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          calendarData[dateStr] = false;
        }
      }
      
      return calendarData;
    },
  }))
);

// Cleanup bei unmount
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    useHabitStore.getState().unsubscribeAll();
  });
}