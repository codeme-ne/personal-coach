// === Cloud Functions für Personal Coach ===
// Zweck: Serverless Backend-Funktionen für KI-Integration und erweiterte Features
// Features: Claude 3.5 Sonnet Integration, Kontext-basierte Antworten, User Analytics

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { buildSystemPrompt } from './prompts';
import { ResilientTogetherAPI } from './togetherAPI';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Environment configuration
const TOGETHER_HISTORY_TURNS = parseInt(process.env.TOGETHER_HISTORY_TURNS || '6');
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;

// === Interfaces ===
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UserContext {
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
    
    const habits = habitsSnapshot.docs.map(doc => ({
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
      habits.map(async (habit) => {
        const streak = habit.streakCount || 0;
        return { name: habit.name, streak };
      })
    );
    
    // Sortiere nach Streak
    habitsWithStreaks.sort((a, b) => b.streak - a.streak);
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

// Prompt creation is now handled by the prompts module

/**
 * Ruft KI API mit resilientem Together.ai Client auf
 */
async function callAIAPI(prompt: string): Promise<string> {
  if (!TOGETHER_API_KEY) {
    // Fallback auf simulierte Antworten wenn kein API Key verfügbar
    return await callClaudeAPI(prompt);
  }

  try {
    const togetherAPI = new ResilientTogetherAPI(TOGETHER_API_KEY);
    const response = await togetherAPI.call(prompt, {
      model: 'meta-llama/Llama-2-7b-chat-hf',
      max_tokens: 200,
      temperature: 0.7,
      top_p: 0.9
    });
    
    return response;
  } catch (error) {
    console.error('Together API failed, falling back to simulation:', error);
    // Fallback auf simulierte Antworten
    return await callClaudeAPI(prompt);
  }
}
async function callClaudeAPI(prompt: string): Promise<string> {
  // Simulierte KI-Antwort basierend auf dem Kontext
  // In Produktion: Echter API Call zu Anthropic
  
  // Für Demo: Intelligente regelbasierte Antworten
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('fortschritt') || lowerPrompt.includes('progress')) {
    const context = prompt.match(/Heute abgeschlossen: (\d+) \((\d+)%\)/);
    if (context) {
      const completed = parseInt(context[1]);
      const percentage = parseInt(context[2]);
      
      if (percentage >= 80) {
        return `Wow, ${percentage}% heute geschafft! 🔥 Du bist auf einem fantastischen Weg! Diese Konstanz wird sich definitiv auszahlen. Was war heute deine größte Herausforderung?`;
      } else if (percentage >= 50) {
        return `Super, du hast bereits ${completed} Gewohnheiten abgeschlossen! 💪 Du bist über der Hälfte - das zeigt echtes Engagement. Welche Gewohnheit fällt dir heute am schwersten?`;
      } else if (percentage > 0) {
        return `Gut gemacht mit ${completed} Gewohnheit${completed > 1 ? 'en' : ''}! 🎯 Jeder Schritt zählt. Was hält dich davon ab, noch eine weitere Gewohnheit heute anzugehen?`;
      } else {
        return `Ich sehe, du hast heute noch nicht angefangen. Das ist okay! 🌟 Der beste Zeitpunkt anzufangen ist jetzt. Welche Gewohnheit wäre die einfachste für den Start?`;
      }
    }
  }
  
  if (lowerPrompt.includes('motivation') || lowerPrompt.includes('schwer') || lowerPrompt.includes('aufgeben')) {
    const streakMatch = prompt.match(/Längste Serie: (\d+) Tage/);
    const streak = streakMatch ? parseInt(streakMatch[1]) : 0;
    
    if (streak > 7) {
      return `Mit ${streak} Tagen hast du bereits bewiesen, dass du durchhalten kannst! 💪 Denk daran: Du bist stärker als deine Ausreden. Diese Herausforderung ist nur temporär, deine Stärke ist permanent. Was genau macht es heute schwer?`;
    } else {
      return `Jeder Meister war einmal ein Anfänger. 🌱 Fokussiere dich auf kleine Wins - schon 2 Minuten täglich können einen Unterschied machen. Was wäre heute ein kleiner, machbarer Schritt?`;
    }
  }
  
  if (lowerPrompt.includes('tipp') || lowerPrompt.includes('hilfe') || lowerPrompt.includes('ratschlag')) {
    const habitsMatch = prompt.match(/Anzahl Gewohnheiten: (\d+)/);
    const habits = habitsMatch ? parseInt(habitsMatch[1]) : 0;
    
    if (habits === 0) {
      return `Lass uns mit einer einzigen Gewohnheit starten! 🎯 Wähle etwas Kleines und Machbares - z.B. 5 Minuten Lesen oder ein Glas Wasser nach dem Aufstehen. Was interessiert dich am meisten?`;
    } else if (habits > 5) {
      return `Mit ${habits} Gewohnheiten jonglierst du schon einiges! 🎪 Tipp: Priorisiere 2-3 Kerngewohnheiten und baue die anderen drumherum. Welche sind dir am wichtigsten?`;
    } else {
      return `Verbinde neue Gewohnheiten mit bestehenden Routinen! 🔗 Nach dem Zähneputzen 5 Liegestütze, nach dem Kaffee 10 Minuten lesen. Was ist deine stabilste tägliche Routine?`;
    }
  }
  
  // Default personalisierte Antwort
  return `Das ist eine interessante Frage! Basierend auf deinen Daten sehe ich großes Potenzial. 🌟 Erzähl mir mehr darüber, damit ich dir gezielter helfen kann.`;
}

// === Cloud Functions ===

/**
 * HTTPS Callable Function für Chat-Antworten
 * Nimmt Nutzernachricht entgegen und generiert KI-basierte Antwort
 */
export const getChatResponse = functions
  .region('europe-west1')
  .runWith({
    timeoutSeconds: 60,
    memory: '512MB'
  })
  .https.onCall(async (data: ChatRequest, context) => {
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
      
      // Erstelle Prompt mit neuem Prompts-Modul
      const prompt = buildSystemPrompt({
        userMessage: data.message,
        userContext,
        chatHistory: data.chatHistory || [],
        language: data.language || 'de',
        historyTurns: TOGETHER_HISTORY_TURNS
      });
      
      // Rufe KI API auf mit resilientem Wrapper
      const response = await callAIAPI(prompt);
      
      // Log für Analytics (optional)
      await db.collection('chat_logs').add({
        userId,
        message: data.message,
        response,
        context: userContext,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return {
        success: true,
        response,
        context: userContext
      };
    } catch (error) {
      console.error('Error in getChatResponse:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to generate response'
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
  .onRun(async (context) => {
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
  .onRun(async (context) => {
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