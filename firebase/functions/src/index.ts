// === Cloud Functions für Personal Coach ===
// Zweck: Serverless Backend-Funktionen für KI-Integration und erweiterte Features
// Features: Together AI Llama 3.1 Integration, Kontext-basierte Antworten, User Analytics

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { createTogetherSystemPrompt, buildMessagesForTogether } from './prompts';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// === Interfaces ===
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface UserContext {
  userId: string;
  totalHabits: number;
  completedToday: number;
  progressPercentage: number;
  longestStreak: number;
  topHabits: Array<{ name: string; streak: number }>;
  recentActivity: string;
}

interface ChatRequest {
  userId: string;
  message: string;
  chatHistory: ChatMessage[];
  language?: 'de' | 'en';
}

// === Helper Functions ===

/**
 * Lädt den Nutzerkontext aus Firestore für personalisierte Antworten
 */
async function getUserContext(userId: string): Promise<UserContext> {
  try {
    // Lade alle Habits des Nutzers
    const habitsSnapshot = await db
      .collection('habits')
      .where('userId', '==', userId)
      .get();
    
    const habits = habitsSnapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Lade heute's Completions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    const completionsSnapshot = await db
      .collection('completions')
      .where('userId', '==', userId)
      .where('completedAt', '>=', admin.firestore.Timestamp.fromDate(today))
      .where('completedAt', '<=', admin.firestore.Timestamp.fromDate(todayEnd))
      .get();
    
    const completedToday = completionsSnapshot.size;
    
    // Berechne Streaks und finde Top-Habits
    const habitsWithStreaks = await Promise.all(
      habits.map(async (habit: any) => {
        const streak = habit.streakCount || 0;
        return { name: habit.name, streak };
      })
    );
    
    // Sortiere nach Streak
    habitsWithStreaks.sort((a: {name: string, streak: number}, b: {name: string, streak: number}) => b.streak - a.streak);
    const topHabits = habitsWithStreaks.slice(0, 3);
    const longestStreak = habitsWithStreaks[0]?.streak || 0;
    
    // Bestimme recent activity
    const recentActivity = completedToday > 0 
      ? `Heute ${completedToday} von ${habits.length} Gewohnheiten abgeschlossen`
      : 'Heute noch keine Aktivität';
    
    return {
      userId,
      totalHabits: habits.length,
      completedToday,
      progressPercentage: habits.length > 0 
        ? Math.round((completedToday / habits.length) * 100) 
        : 0,
      longestStreak,
      topHabits,
      recentActivity
    };
  } catch (error) {
    console.error('Error loading user context:', error);
    // Return default context on error
    return {
      userId,
      totalHabits: 0,
      completedToday: 0,
      progressPercentage: 0,
      longestStreak: 0,
      topHabits: [],
      recentActivity: 'Keine Daten verfügbar'
    };
  }
}



/**
 * Ruft Together AI's Chat Completion API auf
 * Macht einen echten REST Call zu Together's Llama 3.1 Modell
 */
async function callTogetherAPI(
  systemPrompt: string, 
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
): Promise<string> {
  const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
  const TOGETHER_MODEL = process.env.TOGETHER_MODEL || 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo';

  if (!TOGETHER_API_KEY) {
    throw new Error('TOGETHER_API_KEY environment variable is not set');
  }

  try {
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: TOGETHER_MODEL,
        messages: messages,
        max_tokens: 400,
        temperature: 0.7,
        top_p: 0.9,
        stop: null,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Together API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from Together API');
    }

    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Together API call failed:', error);
    throw error;
  }
}

// === Cloud Functions ===

/**
 * HTTPS Callable Function für Chat-Antworten
 * Nutzt Together AI's Llama 3.1 für echte KI-Antworten
 */
export const getChatResponse = functions
  .region('europe-west1')
  .runWith({
    timeoutSeconds: 60,
    memory: '512MB'
  })
  .https.onCall(async (data: ChatRequest, context: functions.https.CallableContext) => {
    // Authentifizierung prüfen
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to use chat'
      );
    }
    
    const userId = context.auth.uid;
    
    try {
      // Validierung
      if (!data.message || typeof data.message !== 'string') {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Message is required and must be a string'
        );
      }
      
      // Lade Nutzerkontext
      const userContext = await getUserContext(userId);
      
      // Erstelle System-Prompt für Together AI
      const systemPrompt = createTogetherSystemPrompt(userContext, data.language || 'de');
      
      // Baue Messages-Array für Together API
      const messages = buildMessagesForTogether(
        systemPrompt,
        data.chatHistory || [],
        data.message
      );
      
      // Rufe Together AI API auf
      const aiResponse = await callTogetherAPI(systemPrompt, messages);
      
      // Log für Analytics (optional)
      await db.collection('chat_logs').add({
        userId,
        message: data.message,
        response: aiResponse,
        context: userContext,
        source: 'cloud',
        model: process.env.TOGETHER_MODEL || 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return {
        text: aiResponse,
        source: 'cloud'
      };
    } catch (error) {
      console.error('Error in getChatResponse:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to generate response: ' + (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  });

/**
 * Scheduled Function für tägliche Motivations-Erinnerungen
 * Läuft jeden Tag um 20:00 Uhr
 */
export const dailyMotivationCheck = functions
  .region('europe-west1')
  .pubsub.schedule('0 20 * * *')
  .timeZone('Europe/Berlin')
  .onRun(async (context: functions.EventContext) => {
    try {
      // Finde Nutzer, die heute noch keine Gewohnheiten abgeschlossen haben
      const usersSnapshot = await db.collection('users').get();
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userContext = await getUserContext(userId);
        
        if (userContext.completedToday === 0 && userContext.totalHabits > 0) {
          // Erstelle Motivationsnachricht
          await db.collection('notifications').add({
            userId,
            type: 'daily_reminder',
            title: 'Zeit für deine Gewohnheiten! 🌟',
            body: `Du hast noch ${userContext.totalHabits} Gewohnheiten offen heute. Schon 5 Minuten können einen Unterschied machen!`,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            read: false
          });
        }
      }
      
      console.log('Daily motivation check completed');
    } catch (error) {
      console.error('Error in daily motivation check:', error);
    }
  });

/**
 * Analytics Function - Berechnet wöchentliche Statistiken
 */
export const calculateWeeklyStats = functions
  .region('europe-west1')
  .pubsub.schedule('0 0 * * 1') // Jeden Montag um Mitternacht
  .timeZone('Europe/Berlin')
  .onRun(async (context: functions.EventContext) => {
    try {
      const usersSnapshot = await db.collection('users').get();
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        
        // Berechne Wochenstatistiken
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const completionsSnapshot = await db
          .collection('completions')
          .where('userId', '==', userId)
          .where('completedAt', '>=', admin.firestore.Timestamp.fromDate(weekAgo))
          .get();
        
        const stats = {
          userId,
          week: new Date().toISOString().split('T')[0],
          totalCompletions: completionsSnapshot.size,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('weekly_stats').add(stats);
      }
      
      console.log('Weekly stats calculation completed');
    } catch (error) {
      console.error('Error calculating weekly stats:', error);
    }
  });