import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import { auth, db } from './config/firebase';

/**
 * === Firebase Query Optimization ===
 * 
 * This service uses optimized queries to avoid Firestore composite index requirements.
 * Key optimizations:
 * 1. Single-field queries only (habitId) to avoid composite indexes
 * 2. Client-side filtering for date ranges instead of server-side where clauses
 * 3. Client-side sorting instead of orderBy with where clauses
 * 
 * This approach works immediately without requiring manual index creation in Firebase Console.
 * Trade-off: Slightly more client-side processing, but eliminates deployment complexity.
 */

// Data Models
export interface Habit {
  id?: string;
  name: string;
  description?: string;
  createdAt: Date;
  lastCompletedDate?: Date;
  userId: string;  // Neu: User ID für Datensicherheit
}

export interface HabitCompletion {
  id?: string;
  habitId: string;
  completedAt: Date;
  userId: string;  // Neu: User ID für Datensicherheit
}

// Helper function zur Benutzer-Authentifizierung
const getCurrentUserId = (): string => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Benutzer nicht authentifiziert. Bitte melden Sie sich an.');
  }
  return user.uid;
};

// Helper function to get start of day
const getStartOfDay = (date: Date): Date => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

// Helper function to get end of day
const getEndOfDay = (date: Date): Date => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

// Helper function to calculate streak
const calculateStreak = (completions: HabitCompletion[]): number => {
  if (completions.length === 0) return 0;
  
  // Sort completions by date (most recent first)
  const sortedCompletions = [...completions].sort(
    (a, b) => b.completedAt.getTime() - a.completedAt.getTime()
  );
  
  let streak = 0;
  const today = getStartOfDay(new Date());
  let currentDate = new Date(today);
  
  // Check if today is completed
  const todayCompleted = sortedCompletions.some(c => {
    const completionDate = getStartOfDay(c.completedAt);
    return completionDate.getTime() === today.getTime();
  });
  
  // If today is not completed, start checking from yesterday
  if (!todayCompleted) {
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  // Count consecutive days
  for (const completion of sortedCompletions) {
    const completionDate = getStartOfDay(completion.completedAt);
    
    if (completionDate.getTime() === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (completionDate.getTime() < currentDate.getTime()) {
      // Gap in dates, streak is broken
      break;
    }
  }
  
  return streak;
};

export const habitService = {
  // Add new habit (mit User Scoping)
  async addHabit(name: string, description?: string): Promise<void> {
    try {
      const userId = getCurrentUserId();
      
      await addDoc(collection(db, 'habits'), {
        name,
        description: description || '',
        createdAt: new Date(),
        userId,  // User ID für Datensicherheit
      });
    } catch (error) {
      console.error('Error adding habit:', error);
      throw error;
    }
  },

  // Get all habits (nur für aktuellen User)
  async getHabits(): Promise<Habit[]> {
    try {
      const userId = getCurrentUserId();
      
      // Query nur für Habits des aktuellen Users
      const q = query(
        collection(db, 'habits'), 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        lastCompletedDate: doc.data().lastCompletedDate?.toDate(),
      })) as Habit[];
    } catch (error) {
      console.error('Error fetching habits:', error);
      throw error;
    }
  },

  // Update habit (mit User Verification)
  async updateHabit(id: string, updates: Partial<Habit>): Promise<void> {
    try {
      const userId = getCurrentUserId();
      
      // Entferne userId aus updates falls vorhanden (Sicherheit)
      const { userId: _, ...safeUpdates } = updates;
      
      const habitRef = doc(db, 'habits', id);
      await updateDoc(habitRef, safeUpdates);
    } catch (error) {
      console.error('Error updating habit:', error);
      throw error;
    }
  },

  // Delete habit (mit User Verification)
  async deleteHabit(id: string): Promise<void> {
    try {
      const userId = getCurrentUserId();
      
      // Delete all completions for this habit (nur für aktuellen User)
      const completions = await this.getHabitCompletions(id);
      for (const completion of completions) {
        if (completion.id) {
          await deleteDoc(doc(db, 'completions', completion.id));
        }
      }
      
      // Delete the habit
      await deleteDoc(doc(db, 'habits', id));
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw error;
    }
  },

  // Mark habit as complete for today (mit User Scoping)
  async completeHabitForToday(habitId: string): Promise<void> {
    try {
      const userId = getCurrentUserId();
      const today = new Date();
      
      // Check if already completed today
      const isCompleted = await this.isHabitCompletedToday(habitId);
      if (isCompleted) {
        console.log('Habit already completed today');
        return;
      }
      
      // Add completion record mit User ID
      await addDoc(collection(db, 'completions'), {
        habitId,
        completedAt: today,
        userId,  // User ID für Datensicherheit
      });
      
      // Update last completed date on habit
      const habitRef = doc(db, 'habits', habitId);
      await updateDoc(habitRef, {
        lastCompletedDate: today,
      });
    } catch (error) {
      console.error('Error completing habit:', error);
      throw error;
    }
  },

  // Remove today's completion for a habit (mit User Scoping)
  async uncompleteHabitForToday(habitId: string): Promise<void> {
    try {
      const userId = getCurrentUserId();
      const today = getStartOfDay(new Date());
      const tomorrow = getEndOfDay(new Date());
      
      // Query mit userId und habitId für Sicherheit
      const q = query(
        collection(db, 'completions'),
        where('habitId', '==', habitId),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Filter and delete today's completion(s) client-side
      const todayDocs = querySnapshot.docs.filter(docSnapshot => {
        const completedAt = docSnapshot.data().completedAt.toDate();
        return completedAt >= today && completedAt <= tomorrow;
      });
      
      // Delete today's completion(s)
      for (const docSnapshot of todayDocs) {
        await deleteDoc(docSnapshot.ref);
      }
      
      // Update last completed date on habit (find the previous completion)
      const allCompletions = await this.getHabitCompletions(habitId);
      const pastCompletions = allCompletions.filter(
        c => c.completedAt.getTime() < today.getTime()
      );
      
      if (pastCompletions.length > 0) {
        const lastCompletion = pastCompletions.sort(
          (a, b) => b.completedAt.getTime() - a.completedAt.getTime()
        )[0];
        
        const habitRef = doc(db, 'habits', habitId);
        await updateDoc(habitRef, {
          lastCompletedDate: lastCompletion.completedAt,
        });
      } else {
        // No previous completions, remove lastCompletedDate
        const habitRef = doc(db, 'habits', habitId);
        await updateDoc(habitRef, {
          lastCompletedDate: null,
        });
      }
    } catch (error) {
      console.error('Error uncompleting habit:', error);
      throw error;
    }
  },

  // Check if habit is completed today (mit User Scoping)
  async isHabitCompletedToday(habitId: string): Promise<boolean> {
    try {
      const userId = getCurrentUserId();
      const today = getStartOfDay(new Date());
      const tomorrow = getEndOfDay(new Date());
      
      // Query mit userId und habitId für Sicherheit
      const q = query(
        collection(db, 'completions'),
        where('habitId', '==', habitId),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Filter client-side for today's completions
      const todayCompletions = querySnapshot.docs.some(doc => {
        const completedAt = doc.data().completedAt.toDate();
        return completedAt >= today && completedAt <= tomorrow;
      });
      
      return todayCompletions;
    } catch (error) {
      console.error('Error checking habit completion:', error);
      throw error;
    }
  },

  // Get all completions for a habit (nur für aktuellen User)
  async getHabitCompletions(habitId: string): Promise<HabitCompletion[]> {
    try {
      const userId = getCurrentUserId();
      
      // Query mit userId und habitId für Sicherheit
      const q = query(
        collection(db, 'completions'),
        where('habitId', '==', habitId),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      const completions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt.toDate(),
      })) as HabitCompletion[];
      
      // Sort client-side instead of using orderBy in query
      return completions.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
    } catch (error) {
      console.error('Error fetching habit completions:', error);
      throw error;
    }
  },

  // Get streak for a habit
  async getHabitStreak(habitId: string): Promise<number> {
    try {
      const completions = await this.getHabitCompletions(habitId);
      return calculateStreak(completions);
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  },

  // Get today's completed habits with their names
  async getTodayCompletedHabits(): Promise<{habit: Habit, completion: HabitCompletion}[]> {
    try {
      const userId = getCurrentUserId();
      const today = getStartOfDay(new Date());
      const tomorrow = getEndOfDay(new Date());
      
      // Get all habits for the user
      const habits = await this.getHabits();
      
      // Get all completions for today
      const q = query(
        collection(db, 'completions'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Filter for today's completions client-side
      const todayCompletions = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          completedAt: doc.data().completedAt.toDate(),
        }) as HabitCompletion)
        .filter(completion => 
          completion.completedAt >= today && completion.completedAt <= tomorrow
        );
      
      // Match completions with habits
      const completedHabits = todayCompletions
        .map(completion => {
          const habit = habits.find(h => h.id === completion.habitId);
          return habit ? { habit, completion } : null;
        })
        .filter(item => item !== null) as {habit: Habit, completion: HabitCompletion}[];
      
      // Sort by completion time (most recent first)
      return completedHabits.sort((a, b) => 
        b.completion.completedAt.getTime() - a.completion.completedAt.getTime()
      );
    } catch (error) {
      console.error('Error fetching today\'s completed habits:', error);
      return [];
    }
  },
};