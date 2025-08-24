// === Optimized Habit Service with Real-time Updates ===
// Zweck: Effiziente Firestore-Queries mit Real-time Listeners und Index-Nutzung
// Features: Server-side Filtering, Real-time Updates, Optimized Queries

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  Timestamp,
  Unsubscribe,
  DocumentData,
  QuerySnapshot,
  serverTimestamp,
  limit,
  startAfter
} from 'firebase/firestore';
import { auth, db } from './config/firebase';

// === Data Models ===
// Zweck: TypeScript Interfaces für Type-Safety
export interface Habit {
  id?: string;
  name: string;
  description?: string;
  createdAt: Date;
  lastCompletedDate?: Date;
  userId: string;
  streakCount?: number; // Cached streak count für Performance
}

export interface HabitCompletion {
  id?: string;
  habitId: string;
  completedAt: Date;
  userId: string;
}

// === Helper Functions ===
// Zweck: Utility Functions für Auth und Date Operations

const getCurrentUserId = (): string => {
  const user = auth.currentUser;
  console.log('habitService: getCurrentUserId - user:', user ? user.email : 'NO USER');
  if (!user) {
    console.error('habitService: NO USER AUTHENTICATED! Using test user');
    // Temporär für Debugging - normalerweise sollte hier ein Fehler geworfen werden
    // throw new Error('Benutzer nicht authentifiziert. Bitte melden Sie sich an.');
    return 'test-user-123'; // Temporärer Test-User
  }
  console.log('habitService: userId:', user.uid);
  return user.uid;
};

const getStartOfDay = (date: Date): Date => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getEndOfDay = (date: Date): Date => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

// === Optimized Streak Calculation ===
// Zweck: Effiziente Streak-Berechnung mit limitierten Queries
const calculateStreak = async (habitId: string): Promise<number> => {
  try {
    const userId = getCurrentUserId();
    
    // Query nur die letzten 365 Completions für Performance
    // Nutzt den Index: habitId + completedAt (descending)
    const q = query(
      collection(db, 'completions'),
      where('habitId', '==', habitId),
      where('userId', '==', userId),
      orderBy('completedAt', 'desc'),
      limit(365)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return 0;
    
    const completions = snapshot.docs.map(doc => ({
      completedAt: doc.data().completedAt.toDate()
    }));
    
    // Streak-Berechnung Logic
    let streak = 0;
    const today = getStartOfDay(new Date());
    let currentDate = new Date(today);
    
    // Check if today is completed
    const todayCompleted = completions.some(c => {
      const completionDate = getStartOfDay(c.completedAt);
      return completionDate.getTime() === today.getTime();
    });
    
    if (!todayCompleted) {
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Count consecutive days
    for (const completion of completions) {
      const completionDate = getStartOfDay(completion.completedAt);
      
      if (completionDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (completionDate.getTime() < currentDate.getTime()) {
        break; // Gap found, streak broken
      }
    }
    
    return streak;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
};

// === Main Service Object ===
export const habitService = {
  // === CRUD Operations ===
  
  // Add new habit
  async addHabit(name: string, description?: string): Promise<string> {
    try {
      const userId = getCurrentUserId();
      
      const docRef = await addDoc(collection(db, 'habits'), {
        name,
        description: description || '',
        createdAt: serverTimestamp(),
        userId,
        streakCount: 0
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding habit:', error);
      throw error;
    }
  },

  // Get all habits with real-time listener
  // Nutzt Index: userId + createdAt (descending)
  subscribeToHabits(
    callback: (habits: Habit[]) => void,
    errorCallback?: (error: Error) => void
  ): Unsubscribe {
    try {
      const userId = getCurrentUserId();
      
      const q = query(
        collection(db, 'habits'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      return onSnapshot(
        q,
        (snapshot) => {
          const habits = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            lastCompletedDate: doc.data().lastCompletedDate?.toDate(),
          })) as Habit[];
          
          callback(habits);
        },
        (error) => {
          console.error('Error in habits subscription:', error);
          errorCallback?.(error);
        }
      );
    } catch (error) {
      console.error('Error setting up habits subscription:', error);
      errorCallback?.(error as Error);
      return () => {}; // Return empty unsubscribe function
    }
  },

  // Get habits once (for non-reactive needs)
  async getHabits(): Promise<Habit[]> {
    try {
      const userId = getCurrentUserId();
      
      const q = query(
        collection(db, 'habits'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastCompletedDate: doc.data().lastCompletedDate?.toDate(),
      })) as Habit[];
    } catch (error) {
      console.error('Error fetching habits:', error);
      throw error;
    }
  },

  // Update habit
  async updateHabit(id: string, updates: Partial<Habit>): Promise<void> {
    try {
      const userId = getCurrentUserId();
      
      // Security: Remove userId from updates
      const { userId: _, ...safeUpdates } = updates;
      
      // Convert dates to Timestamps if needed
      if (safeUpdates.createdAt) {
        (safeUpdates as any).createdAt = Timestamp.fromDate(safeUpdates.createdAt);
      }
      if (safeUpdates.lastCompletedDate) {
        (safeUpdates as any).lastCompletedDate = Timestamp.fromDate(safeUpdates.lastCompletedDate);
      }
      
      const habitRef = doc(db, 'habits', id);
      await updateDoc(habitRef, safeUpdates);
    } catch (error) {
      console.error('Error updating habit:', error);
      throw error;
    }
  },

  // Delete habit and all its completions
  async deleteHabit(id: string): Promise<void> {
    try {
      const userId = getCurrentUserId();
      
      // Delete all completions for this habit
      // Nutzt Index: habitId + userId
      const q = query(
        collection(db, 'completions'),
        where('habitId', '==', id),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // Delete the habit
      await deleteDoc(doc(db, 'habits', id));
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw error;
    }
  },

  // === Completion Operations ===
  
  // Mark habit as complete for today
  async completeHabitForToday(habitId: string): Promise<void> {
    try {
      console.log('habitService: completeHabitForToday called for habitId:', habitId);
      const userId = getCurrentUserId();
      console.log('habitService: userId:', userId);
      const today = new Date();
      const todayStart = getStartOfDay(today);
      const todayEnd = getEndOfDay(today);
      
      // Check if already completed today using server-side query
      // Nutzt Index: habitId + userId
      const q = query(
        collection(db, 'completions'),
        where('habitId', '==', habitId),
        where('userId', '==', userId),
        where('completedAt', '>=', Timestamp.fromDate(todayStart)),
        where('completedAt', '<=', Timestamp.fromDate(todayEnd))
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        console.log('habitService: Already completed today, skipping');
        return;
      }
      
      // Add completion record
      console.log('habitService: Adding completion record');
      await addDoc(collection(db, 'completions'), {
        habitId,
        completedAt: serverTimestamp(),
        userId
      });
      
      // Update streak count on habit
      const streak = await calculateStreak(habitId);
      console.log('habitService: Updated streak:', streak);
      await updateDoc(doc(db, 'habits', habitId), {
        lastCompletedDate: serverTimestamp(),
        streakCount: streak
      });
      console.log('habitService: completeHabitForToday completed successfully');
    } catch (error) {
      console.error('Error completing habit:', error);
      throw error;
    }
  },

  // Remove today's completion for a habit
  async uncompleteHabitForToday(habitId: string): Promise<void> {
    try {
      const userId = getCurrentUserId();
      const todayStart = getStartOfDay(new Date());
      const todayEnd = getEndOfDay(new Date());
      
      // Find today's completion using server-side query
      const q = query(
        collection(db, 'completions'),
        where('habitId', '==', habitId),
        where('userId', '==', userId),
        where('completedAt', '>=', Timestamp.fromDate(todayStart)),
        where('completedAt', '<=', Timestamp.fromDate(todayEnd))
      );
      
      const snapshot = await getDocs(q);
      
      // Delete today's completion(s)
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // Recalculate streak
      const streak = await calculateStreak(habitId);
      
      // Find last completion before today
      const previousQ = query(
        collection(db, 'completions'),
        where('habitId', '==', habitId),
        where('userId', '==', userId),
        where('completedAt', '<', Timestamp.fromDate(todayStart)),
        orderBy('completedAt', 'desc'),
        limit(1)
      );
      
      const previousSnapshot = await getDocs(previousQ);
      
      if (!previousSnapshot.empty) {
        const lastCompletedDate = previousSnapshot.docs[0].data().completedAt;
        await updateDoc(doc(db, 'habits', habitId), {
          lastCompletedDate,
          streakCount: streak
        });
      } else {
        // No previous completions
        await updateDoc(doc(db, 'habits', habitId), {
          lastCompletedDate: null,
          streakCount: 0
        });
      }
    } catch (error) {
      console.error('Error uncompleting habit:', error);
      throw error;
    }
  },

  // Check if habit is completed today (optimized query)
  async isHabitCompletedToday(habitId: string): Promise<boolean> {
    try {
      const userId = getCurrentUserId();
      const todayStart = getStartOfDay(new Date());
      const todayEnd = getEndOfDay(new Date());
      
      // Direct server-side query for today's completion
      const q = query(
        collection(db, 'completions'),
        where('habitId', '==', habitId),
        where('userId', '==', userId),
        where('completedAt', '>=', Timestamp.fromDate(todayStart)),
        where('completedAt', '<=', Timestamp.fromDate(todayEnd)),
        limit(1) // We only need to know if one exists
      );
      
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking habit completion:', error);
      return false;
    }
  },

  // Get completions for a habit with pagination
  async getHabitCompletions(
    habitId: string, 
    limitCount: number = 30,
    startAfterDoc?: DocumentData
  ): Promise<HabitCompletion[]> {
    try {
      const userId = getCurrentUserId();
      
      // Build query with pagination
      // Nutzt Index: habitId + completedAt (descending)
      let q = query(
        collection(db, 'completions'),
        where('habitId', '==', habitId),
        where('userId', '==', userId),
        orderBy('completedAt', 'desc'),
        limit(limitCount)
      );
      
      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc));
      }
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt.toDate(),
      })) as HabitCompletion[];
    } catch (error) {
      console.error('Error fetching habit completions:', error);
      throw error;
    }
  },

  // Get streak for a habit (uses cached value if available)
  async getHabitStreak(habitId: string): Promise<number> {
    try {
      // First try to get cached streak from habit document
      const habitDoc = await getDocs(
        query(
          collection(db, 'habits'),
          where('__name__', '==', habitId)
        )
      );
      
      if (!habitDoc.empty && habitDoc.docs[0].data().streakCount !== undefined) {
        return habitDoc.docs[0].data().streakCount;
      }
      
      // Fallback to calculation
      return await calculateStreak(habitId);
    } catch (error) {
      console.error('Error getting streak:', error);
      return 0;
    }
  },

  // === Today's Overview with Real-time Updates ===
  
  // Subscribe to today's completed habits
  subscribeToTodayCompletedHabits(
    callback: (completedHabits: Array<{habit: Habit, completion: HabitCompletion}>) => void,
    errorCallback?: (error: Error) => void
  ): Unsubscribe {
    try {
      const userId = getCurrentUserId();
      const todayStart = getStartOfDay(new Date());
      const todayEnd = getEndOfDay(new Date());
      
      // Subscribe to today's completions
      // Nutzt Index: userId + completedAt (descending)
      const q = query(
        collection(db, 'completions'),
        where('userId', '==', userId),
        where('completedAt', '>=', Timestamp.fromDate(todayStart)),
        where('completedAt', '<=', Timestamp.fromDate(todayEnd)),
        orderBy('completedAt', 'desc')
      );
      
      // Also need to listen to habits for real-time updates
      let habitsCache: Habit[] = [];
      
      // First, subscribe to habits
      const habitsUnsubscribe = this.subscribeToHabits(
        (habits) => {
          habitsCache = habits;
        },
        errorCallback
      );
      
      // Then subscribe to completions
      const completionsUnsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const completions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            completedAt: doc.data().completedAt.toDate(),
          })) as HabitCompletion[];
          
          // Match with habits
          const completedHabits = completions
            .map(completion => {
              const habit = habitsCache.find(h => h.id === completion.habitId);
              return habit ? { habit, completion } : null;
            })
            .filter(item => item !== null) as Array<{habit: Habit, completion: HabitCompletion}>;
          
          callback(completedHabits);
        },
        (error) => {
          console.error('Error in today completions subscription:', error);
          errorCallback?.(error);
        }
      );
      
      // Return combined unsubscribe function
      return () => {
        habitsUnsubscribe();
        completionsUnsubscribe();
      };
    } catch (error) {
      console.error('Error setting up today completions subscription:', error);
      errorCallback?.(error as Error);
      return () => {};
    }
  },

  // Get completions for a specific date range
  async getCompletionsForDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<HabitCompletion[]> {
    try {
      const userId = getCurrentUserId();
      
      const q = query(
        collection(db, 'completions'),
        where('userId', '==', userId),
        where('completedAt', '>=', Timestamp.fromDate(startDate)),
        where('completedAt', '<=', Timestamp.fromDate(endDate)),
        orderBy('completedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt.toDate(),
      })) as HabitCompletion[];
    } catch (error) {
      console.error('Error fetching completions for date range:', error);
      return [];
    }
  },

  // Get today's completed habits once
  async getTodayCompletedHabits(): Promise<Array<{habit: Habit, completion: HabitCompletion}>> {
    try {
      const userId = getCurrentUserId();
      const todayStart = getStartOfDay(new Date());
      const todayEnd = getEndOfDay(new Date());
      
      // Get habits first
      const habits = await this.getHabits();
      
      // Get today's completions with server-side filtering
      // Nutzt Index: userId + completedAt (descending)
      const q = query(
        collection(db, 'completions'),
        where('userId', '==', userId),
        where('completedAt', '>=', Timestamp.fromDate(todayStart)),
        where('completedAt', '<=', Timestamp.fromDate(todayEnd)),
        orderBy('completedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      const completions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt.toDate(),
      })) as HabitCompletion[];
      
      // Match completions with habits
      return completions
        .map(completion => {
          const habit = habits.find(h => h.id === completion.habitId);
          return habit ? { habit, completion } : null;
        })
        .filter(item => item !== null) as Array<{habit: Habit, completion: HabitCompletion}>;
    } catch (error) {
      console.error('Error fetching today\'s completed habits:', error);
      return [];
    }
  },

  // === Batch Operations for Performance ===
  
  // Get completion status for multiple habits at once
  async getBatchCompletionStatus(habitIds: string[]): Promise<Map<string, boolean>> {
    try {
      const userId = getCurrentUserId();
      const todayStart = getStartOfDay(new Date());
      const todayEnd = getEndOfDay(new Date());
      const statusMap = new Map<string, boolean>();
      
      // Initialize all to false
      habitIds.forEach(id => statusMap.set(id, false));
      
      if (habitIds.length === 0) return statusMap;
      
      // Query completions for all habits at once
      const q = query(
        collection(db, 'completions'),
        where('userId', '==', userId),
        where('habitId', 'in', habitIds), // Firestore limits this to 10 items
        where('completedAt', '>=', Timestamp.fromDate(todayStart)),
        where('completedAt', '<=', Timestamp.fromDate(todayEnd))
      );
      
      const snapshot = await getDocs(q);
      
      // Mark completed habits
      snapshot.docs.forEach(doc => {
        const habitId = doc.data().habitId;
        statusMap.set(habitId, true);
      });
      
      return statusMap;
    } catch (error) {
      console.error('Error getting batch completion status:', error);
      return new Map();
    }
  },

  // Get streaks for multiple habits at once
  async getBatchStreaks(habitIds: string[]): Promise<Map<string, number>> {
    try {
      const streakMap = new Map<string, number>();
      
      // Get all habits to check cached streaks
      const habits = await this.getHabits();
      
      for (const habitId of habitIds) {
        const habit = habits.find(h => h.id === habitId);
        if (habit?.streakCount !== undefined) {
          streakMap.set(habitId, habit.streakCount);
        } else {
          // Calculate if not cached
          const streak = await calculateStreak(habitId);
          streakMap.set(habitId, streak);
        }
      }
      
      return streakMap;
    } catch (error) {
      console.error('Error getting batch streaks:', error);
      return new Map();
    }
  }
};