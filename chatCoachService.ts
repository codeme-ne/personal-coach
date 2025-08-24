// === AI Chat Coach Service ===
// Zweck: Echter AI-Coach mit Firebase Cloud Function und permanentem Speicher
// Features: Firebase Functions, Kontext-bewusste Responses, Chat-History

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHabitStore } from './stores/habitStore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from './config/firebase';

// === Interfaces ===
export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

interface CoachingContext {
  todayCompleted: number;
  totalHabits: number;
  longestStreak: number;
  recentCompletions: string[];
  progressPercentage: number;
  userName?: string;
  totalMessages: number;
  lastActiveDate: string;
}

interface UserProfile {
  goals: string[];
  challenges: string[];
  preferredCoachingStyle: 'motivational' | 'analytical' | 'gentle' | 'tough';
  progressNotes: string[];
  joinDate: Date;
  personalityInsights: string[];
}

// Firebase Functions Configuration
const functions = getFunctions();

// Response Source Tracking
let lastResponseSource: 'cloud' | 'fallback' = 'fallback';

// === Chat Coach Service Class ===
export class ChatCoachService {
  private static instance: ChatCoachService;
  private chatHistory: ChatMessage[] = [];
  private userProfile: UserProfile | null = null;
  private maxHistoryLength = 50; // Mehr History für besseren Kontext
  
  private constructor() {}
  
  public static getInstance(): ChatCoachService {
    if (!ChatCoachService.instance) {
      ChatCoachService.instance = new ChatCoachService();
    }
    return ChatCoachService.instance;
  }

  // === Permanenter Speicher ===
  
  async loadChatHistory(): Promise<ChatMessage[]> {
    try {
      const stored = await AsyncStorage.getItem('ai_chat_history');
      if (stored) {
        this.chatHistory = JSON.parse(stored).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
      return this.chatHistory;
    } catch (error) {
      console.error('Error loading chat history:', error);
      return [];
    }
  }

  async saveChatHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem('ai_chat_history', JSON.stringify(this.chatHistory));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }

  async loadUserProfile(): Promise<UserProfile | null> {
    try {
      const stored = await AsyncStorage.getItem('ai_user_profile');
      if (stored) {
        this.userProfile = {
          ...JSON.parse(stored),
          joinDate: new Date(JSON.parse(stored).joinDate)
        };
      }
      return this.userProfile;
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  }

  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      this.userProfile = profile;
      await AsyncStorage.setItem('ai_user_profile', JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  }

  // === Kontext-Sammlung ===
  
  private async getUserContext(): Promise<CoachingContext> {
    try {
      const store = useHabitStore.getState();
      const habits = store.habits;
      const completedCount = store.getCompletedHabitsCount();
      const progressPercentage = store.getProgressPercentage();
      const habitsWithStreaks = store.getHabitsWithStreaks();
      
      const longestStreak = habitsWithStreaks.length > 0 
        ? Math.max(...habitsWithStreaks.map(h => h.streak))
        : 0;
      
      const completedHabits = habits.filter(h => 
        store.isHabitCompleted(h.id, new Date().toISOString().split('T')[0])
      );
      
      return {
        todayCompleted: completedCount,
        totalHabits: habits.length,
        longestStreak,
        recentCompletions: completedHabits.map(h => h.name),
        progressPercentage,
        totalMessages: this.chatHistory.length,
        lastActiveDate: new Date().toISOString().split('T')[0]
      };
    } catch (error) {
      console.error('Error getting user context:', error);
      return {
        todayCompleted: 0,
        totalHabits: 0,
        longestStreak: 0,
        recentCompletions: [],
        progressPercentage: 0,
        totalMessages: 0,
        lastActiveDate: new Date().toISOString().split('T')[0]
      };
    }
  }

  // === AI Response Generation ===
  
  public async generateResponse(userMessage: string): Promise<string> {
    const context = await this.getUserContext();
    const profile = await this.loadUserProfile();
    
    // Versuche Cloud Function zuerst
    try {
      const response = await this.callCloudAI(userMessage, context, profile);
      lastResponseSource = 'cloud';
      return this.cleanAIResponse(response);
    } catch (error) {
      console.log('Cloud Function failed, using intelligent fallback:', error);
      lastResponseSource = 'fallback';
      return this.generateIntelligentFallback(userMessage, context, profile);
    }
  }

  private async callCloudAI(userMessage: string, context: CoachingContext, profile: UserProfile | null): Promise<string> {
    const getChatResponse = httpsCallable(functions, 'getChatResponse');
    
    // Build chat history for context
    const chatHistory = this.chatHistory.slice(-5).map(msg => ({
      role: msg.isUser ? 'user' as const : 'assistant' as const,
      content: msg.text,
      timestamp: msg.timestamp
    }));
    
    const requestData = {
      message: userMessage,
      chatHistory,
      language: 'de' as const
    };
    
    const result = await getChatResponse(requestData);
    const data = result.data as { text: string; source: string };
    
    if (!data.text) {
      throw new Error('No response text from cloud function');
    }
    
    return data.text;
  }

  private async createCoachingPrompt(context: CoachingContext, profile: UserProfile | null): Promise<string> {
    const { todayCompleted, totalHabits, longestStreak, recentCompletions, progressPercentage } = context;
    const coachingStyle = profile?.preferredCoachingStyle || 'motivational';
    
    // Hole detaillierte Habit-Informationen
    const habitDetails = await this.getDetailedHabitContext();
    
    // Erstelle Conversation Memory
    const conversationMemory = this.buildConversationMemory();
    
    // Progress Notes aus User Profile
    const progressNotes = profile?.progressNotes?.slice(-5) || [];
    
    return `Du bist ein erfahrener Habit-Coach namens "Alex" mit umfassender Expertise in Verhaltenspsychologie und Gewohnheitsbildung. Du bist der persönliche Coach deines Klienten und kennst seine individuelle Geschichte.

WICHTIG: Du hast VOLLSTÄNDIGEN ZUGRIFF auf die Konversationshistorie und erinnerst dich an ALLES!

=== AKTUELLER KLIENT-STATUS ===
📊 Gewohnheiten heute: ${todayCompleted}/${totalHabits} (${progressPercentage}%)
🔥 Längste Streak: ${longestStreak} Tage
✅ Heute abgeschlossen: ${recentCompletions.join(', ') || 'Noch keine'}
💬 Gespräche geführt: ${context.totalMessages}
📅 Letzter Kontakt: ${context.lastActiveDate}

=== DETAILLIERTE GEWOHNHEITEN ===
${habitDetails}

=== BISHERIGE GESPRÄCHE & KONTEXT ===
${conversationMemory}

=== PERSÖNLICHE NOTIZEN ===
${progressNotes.length > 0 ? progressNotes.join('\n') : 'Erste Interaktion'}

=== DEINE COACHING-PRINZIPIEN ===

KERNAUFGABEN:
1. Sei der PERSÖNLICHE Coach - nicht ein generischer Bot
2. Beziehe dich IMMER auf die spezifischen Gewohnheiten des Klienten
3. Erkenne Muster und gib darauf basierend individuelle Ratschläge
4. Sei empathisch bei Problemen, enthusiastisch bei Erfolgen

KOMMUNIKATIONSSTIL:
✅ IMMER auf Deutsch, persönlich und direkt
✅ Verwende den Namen der Gewohnheiten ("Dein Laufen heute...")
✅ Beziehe dich auf frühere Gespräche ("Wie du mir letzte Woche erzählt hast...")
✅ Maximal 2-3 Sätze pro Antwort - prägnant und wirkungsvoll
✅ 1-2 passende Emojis für emotionale Verbindung
✅ Stelle eine konkrete Frage oder gib einen umsetzbaren Tipp

SPEZIFISCHE ANTWORT-STRATEGIEN:
- Bei Fragen zu Gewohnheiten: Gib wissenschaftlich fundierte, praxisnahe Tipps
- Bei Motivationsproblemen: Erinnere an bisherige Erfolge, kleinere Schritte vorschlagen
- Bei Zeitproblemen: 2-Minuten-Regel, Habit-Stacking, Priorisierung
- Bei Rückschlägen: Normalisieren, Selbstmitgefühl fördern, Neustart-Strategie
- Bei Erfolgen: Authentisch feiern, nach Erfolgsfaktoren fragen, nächste Stufe anregen

ABSOLUTE NO-GOs:
❌ Generische Phrasen wie "Das ist toll!" ohne Kontext
❌ Ignorieren der spezifischen Gewohnheiten des Klienten
❌ Lange Erklärungen oder theoretische Abhandlungen
❌ Vergessen von Informationen aus früheren Gesprächen
❌ Unrealistische oder zu viele Vorschläge auf einmal

=== AKTUELLE GESPRÄCHSSITUATION ===
Analysiere die Nachricht des Klienten genau:
- Was ist die eigentliche Frage/das Problem?
- Welche Emotion steckt dahinter?
- Wie kannst du KONKRET und PERSÖNLICH helfen?

Antworte als persönlicher Coach "Alex", der seinen Klienten wirklich kennt!`;
  }

  private buildConversationHistory(): string {
    const recentMessages = this.chatHistory.slice(-6); // Letzte 6 Nachrichten für Kontext
    return recentMessages.map(msg => 
      `${msg.isUser ? 'Benutzer' : 'Coach'}: ${msg.text}`
    ).join('\n');
  }

  private buildConversationMemory(): string {
    const recentMessages = this.chatHistory.slice(-10);
    if (recentMessages.length === 0) {
      return 'Erstes Gespräch - keine vorherigen Unterhaltungen';
    }
    
    // Erstelle Memory-Summary der letzten Gespräche
    const themes = this.analyzeConversationThemes(recentMessages);
    const lastSession = recentMessages.slice(-3);
    
    let memory = `Letzte Gespräche:\n`;
    
    if (themes.length > 0) {
      memory += `Häufige Themen: ${themes.join(', ')}\n`;
    }
    
    if (lastSession.length > 0) {
      memory += `Letztes Gespräch:\n`;
      lastSession.forEach(msg => {
        const role = msg.isUser ? 'Du' : 'Ich (Coach)';
        memory += `${role}: ${msg.text.substring(0, 100)}...\n`;
      });
    }
    
    return memory;
  }

  private async getDetailedHabitContext(): Promise<string> {
    try {
      const store = useHabitStore.getState();
      const habits = store.habits;
      
      if (habits.length === 0) {
        return 'Noch keine Gewohnheiten definiert';
      }
      
      let habitDetails = `Du trackst ${habits.length} Gewohnheit${habits.length > 1 ? 'en' : ''}:\n`;
      
      for (const habit of habits.slice(0, 8)) { // Maximal 8 für übersichtlichkeit
        const isCompletedToday = store.isHabitCompleted(
          habit.id, 
          new Date().toISOString().split('T')[0]
        );
        const habitsWithStreaks = store.getHabitsWithStreaks();
        const habitWithStreak = habitsWithStreaks.find(h => h.id === habit.id);
        const streak = habitWithStreak?.streak || 0;
        
        const status = isCompletedToday ? '✅' : '⏳';
        habitDetails += `${status} "${habit.name}" (${streak} Tage Serie)\n`;
      }
      
      if (habits.length > 8) {
        habitDetails += `... und ${habits.length - 8} weitere\n`;
      }
      
      return habitDetails;
    } catch (error) {
      return 'Fehler beim Laden der Gewohnheiten';
    }
  }

  private analyzeConversationThemes(messages: ChatMessage[]): string[] {
    const themes: { [key: string]: number } = {};
    const themeKeywords = {
      'Motivation': ['motivation', 'motivier', 'antrieb', 'energie'],
      'Probleme': ['problem', 'schwer', 'schaffe nicht', 'frustriert'],
      'Erfolg': ['geschafft', 'super', 'toll', 'stolz', 'erfolgreich'],
      'Planung': ['plan', 'ziel', 'vorhaben', 'strategie'],
      'Zeit': ['zeit', 'busy', 'stress', 'zeitdruck'],
      'Streaks': ['streak', 'serie', 'konsequent', 'täglich']
    };
    
    messages.forEach(msg => {
      const text = msg.text.toLowerCase();
      Object.entries(themeKeywords).forEach(([theme, keywords]) => {
        if (keywords.some(keyword => text.includes(keyword))) {
          themes[theme] = (themes[theme] || 0) + 1;
        }
      });
    });
    
    // Gib die 3 häufigsten Themen zurück
    return Object.entries(themes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([theme]) => theme);
  }

  private cleanAIResponse(response: string): string {
    return response
      .replace(/\\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^(Coach:|Assistent:|AI:)/i, '')
      .trim()
      .substring(0, 300); // Maximale Länge begrenzen
  }

  private generateIntelligentFallback(userMessage: string, context: CoachingContext, profile: UserProfile | null): string {
    const lowerMessage = userMessage.toLowerCase();
    const { todayCompleted, totalHabits, longestStreak, recentCompletions, progressPercentage } = context;
    
    // Analysiere Nachrichtenverlauf für Kontext
    const recentContext = this.analyzeRecentMessages();
    
    // === Spezifische Intent-basierte Responses ===
    
    // Begrüßung mit persönlichem Kontext
    if (this.isGreeting(lowerMessage)) {
      if (context.totalMessages === 0) {
        return "👋 Hallo! Ich bin dein persönlicher AI-Coach für Gewohnheiten. Erzähl mir, womit kann ich dir heute helfen?";
      } else if (progressPercentage >= 80) {
        return `🌟 Hey! Du läufst heute richtig heiß - ${progressPercentage}% geschafft! Wie fühlst du dich dabei?`;
      } else if (todayCompleted > 0) {
        return `Hi! Schön dich zu sehen! ${todayCompleted} von ${totalHabits} heute erledigt. Was steht als nächstes an? 💪`;
      } else {
        return `Hallo! Ein neuer Tag wartet auf dich. ${totalHabits} Gewohnheiten in deiner Liste - womit startest du? 🚀`;
      }
    }
    
    // Motivation und Unterstützung
    if (lowerMessage.includes('motivation') || lowerMessage.includes('hilfe') || lowerMessage.includes('schwer')) {
      return this.getContextualMotivation(context, recentContext);
    }
    
    // Fortschritt und Statistiken
    if (lowerMessage.includes('progress') || lowerMessage.includes('fortschritt') || lowerMessage.includes('statistik')) {
      return this.getProgressInsight(context);
    }
    
    // Streaks und Konsistenz
    if (lowerMessage.includes('streak') || lowerMessage.includes('serie') || lowerMessage.includes('konsequent')) {
      return this.getStreakEncouragement(context);
    }
    
    // Tipps und Strategien
    if (lowerMessage.includes('tipp') || lowerMessage.includes('rat') || lowerMessage.includes('wie') || lowerMessage.includes('strategie')) {
      return this.getStrategicAdvice(context, profile);
    }
    
    // Heute-spezifische Fragen
    if (lowerMessage.includes('heute') || lowerMessage.includes('today') || lowerMessage.includes('jetzt')) {
      return this.getTodayFocus(context);
    }
    
    // Energie und Antrieb
    if (lowerMessage.includes('müde') || lowerMessage.includes('energie') || lowerMessage.includes('antrieb') || lowerMessage.includes('erschöpft')) {
      return this.getEnergyBoost(context);
    }
    
    // Zeit und Stress
    if (lowerMessage.includes('zeit') || lowerMessage.includes('busy') || lowerMessage.includes('stress') || lowerMessage.includes('zeitdruck')) {
      return this.getTimeManagementTip(context);
    }
    
    // Rückschläge und Probleme
    if (lowerMessage.includes('aufgeben') || lowerMessage.includes('schaffe nicht') || lowerMessage.includes('frustriert') || lowerMessage.includes('problem')) {
      return this.getSetbackSupport(context, recentContext);
    }
    
    // Feiern und Erfolg
    if (lowerMessage.includes('geschafft') || lowerMessage.includes('erfolg') || lowerMessage.includes('stolz') || lowerMessage.includes('super')) {
      return this.getCelebrationResponse(context);
    }
    
    // Planung und Ziele
    if (lowerMessage.includes('plan') || lowerMessage.includes('ziel') || lowerMessage.includes('vorhaben') || lowerMessage.includes('morgen')) {
      return this.getPlanningSupport(context);
    }
    
    // Fallback: Kontextuelle Nachfrage
    return this.getIntelligentFallback(context, userMessage);
  }

  // === Spezifische Response-Generatoren ===
  
  private getContextualMotivation(context: CoachingContext, recentContext: any): string {
    const { todayCompleted, totalHabits, longestStreak, progressPercentage } = context;
    
    if (progressPercentage === 100) {
      return "🔥 Du hast heute ALLES geschafft! Diese Disziplin ist inspirierend. Du zeigst, was möglich ist! Wie feiert man solche Erfolge? 🎉";
    } else if (progressPercentage >= 70) {
      return `💪 ${progressPercentage}% ist beeindruckend! Du bist so nah am perfekten Tag. Was brauchst du für den letzten Push?`;
    } else if (longestStreak >= 14) {
      return `⭐ Mit ${longestStreak} Tagen Streak hast du schon bewiesen: Du schaffst alles! Heute ist nur ein weiterer Baustein deines Erfolgs.`;
    } else if (todayCompleted > 0) {
      return `🌱 ${todayCompleted} geschafft zeigt: Du bist auf dem richtigen Weg! Jede Gewohnheit zählt. Welche fühlt sich heute leicht an?`;
    } else {
      return "✨ Jeder Champion startet bei Null. Du hast die Kraft für heute - ein kleiner Schritt reicht zum Anfangen! Was rufst du zuerst?";
    }
  }
  
  private getProgressInsight(context: CoachingContext): string {
    const { todayCompleted, totalHabits, longestStreak, progressPercentage } = context;
    
    if (totalHabits === 0) {
      return "🎯 Du stehst am Anfang einer spannenden Reise! Lass uns deine erste Gewohnheit definieren. Was willst du in deinem Leben verbessern?";
    } else if (progressPercentage >= 80) {
      return `📊 Wow! ${progressPercentage}% Completion-Rate heute ist außergewöhnlich! Längste Streak: ${longestStreak} Tage. Du entwickelst echte Meisterschaft! 🏆`;
    } else if (longestStreak > 0) {
      return `📈 Heute: ${todayCompleted}/${totalHabits} (${progressPercentage}%), beste Serie: ${longestStreak} Tage. Du zeigst kontinuierlichen Fortschritt! 💫`;
    } else {
      return `📋 Aktueller Stand: ${todayCompleted}/${totalHabits} Gewohnheiten heute. Du baust gerade das Fundament für große Veränderungen! 🏗️`;
    }
  }
  
  private getStreakEncouragement(context: CoachingContext): string {
    const { longestStreak } = context;
    
    if (longestStreak >= 30) {
      return `🏅 ${longestStreak} Tage Streak? Das ist Master-Level! Du hast eine echte Gewohnheits-Superkraft entwickelt. Teile dein Geheimnis!`;
    } else if (longestStreak >= 14) {
      return `🔥 ${longestStreak} Tage Serie zeigt: Du hast das System verstanden! Die ersten 2 Wochen sind die schwierigsten - du rockst das!`;
    } else if (longestStreak >= 7) {
      return `⚡ Eine Woche durchgezogen ist ein super Start! Du spürst schon, wie die Gewohnheit zur Routine wird, oder? 🚀`;
    } else if (longestStreak > 0) {
      return `🌟 ${longestStreak} Tage sind der Beweis: Du kannst es! Heute ist die Chance, diese Serie auszubauen. Worauf wartest du?`;
    } else {
      return "💎 Jede legendäre Streak beginnt mit Tag 1. Heute könnte der Start von etwas Großartigem sein! Welche Gewohnheit verdient den ersten Tag?";
    }
  }
  
  private getStrategicAdvice(context: CoachingContext, profile: UserProfile | null): string {
    const { totalHabits, progressPercentage, longestStreak } = context;
    
    const tips = [
      "🔗 Habit-Stacking: Verbinde neue Gewohnheiten mit bestehenden. 'Nach dem Kaffee → 5 Min Stretching' funktioniert perfekt!",
      "⏰ 2-Minuten-Regel: Starte so klein, dass Scheitern unmöglich wird. Aus 2 Minuten werden oft 20 - der Start ist alles!",
      "📱 Umgebungs-Design: Gute Gewohnheiten sichtbar machen, schlechte verstecken. Deine Umgebung formt dein Verhalten!",
      "🔄 Never-Miss-Twice: Ein verpasster Tag ist menschlich, zwei Tage werden zum Muster. Sofort zurück ins Spiel!",
      "🎉 Belohnungs-Ritual: Nach jeder Gewohnheit 30 Sekunden feiern. Du trainierst dein Gehirn auf Erfolg!",
      "🌅 Morgen-Power: Die ersten 2 Stunden entscheiden den Tag. Schwierige Gewohnheiten zuerst, wenn die Willenskraft stark ist!",
      "📊 Progress-Tracking: Was gemessen wird, wird gemacht. Sichtbare Fortschritte motivieren unbewusst weiter!",
      "👥 Accountability: Teile deine Ziele! Social Pressure und Support verstärken deine Motivation enorm."
    ];
    
    if (totalHabits > 5 && progressPercentage < 50) {
      return "🎯 Fokus-Tipp: Wähle 2-3 Kern-Gewohnheiten für diese Woche. Lieber weniger perfekt als viel chaotisch! Qualität schlägt Quantität.";
    } else if (longestStreak === 0) {
      return "🚀 Start-Tipp: Wähle die EINFACHSTE Gewohnheit und mache sie 7 Tage perfekt. Erfolg baut auf Erfolg auf!";
    }
    
    return tips[Math.floor(Math.random() * tips.length)];
  }
  
  private getTodayFocus(context: CoachingContext): string {
    const { todayCompleted, totalHabits, recentCompletions } = context;
    
    if (todayCompleted === totalHabits && totalHabits > 0) {
      return "🎉 Heute ist bereits perfekt! Alle Gewohnheiten abgeschlossen. Zeit für Selbstfürsorge und Reflexion. Wie feierst du diesen Erfolg?";
    } else if (recentCompletions.length > 0) {
      return `✅ Heute schon erledigt: ${recentCompletions.join(', ')}. ${totalHabits - todayCompleted} warten noch. Welche packst du als nächstes an? 💪`;
    } else if (totalHabits > 0) {
      return `🌅 ${totalHabits} Gewohnheiten warten heute auf dich! Starte mit der einfachsten - Momentum ist der Schlüssel zum Erfolg! 🔑`;
    } else {
      return "🎯 Heute ist der perfekte Tag für einen Neustart! Welche eine Gewohnheit würde dein Leben verbessern? Lass uns sie definieren!";
    }
  }
  
  private getEnergyBoost(context: CoachingContext): string {
    const responses = [
      "⚡ Wenig Energie? Perfect für Micro-Habits! 1-2 Minuten reichen. Bewegung schafft Bewegung - starte minimal! 🔋",
      "😴 Müde Tage sind Charakter-Tage. Was du trotz Müdigkeit machst, formt deine Identität als disziplinierte Person! 💪",
      "🌱 Niedrige Energie = niedrige Erwartungen. 10% von normal ist heute schon ein Sieg! Perfektion ist nicht das Ziel.",
      "☕ Energie folgt Action! Oft kommt die Motivation NACH dem ersten Schritt. Starte und lass dich überraschen! ⚡",
      "🧘 Müdigkeit ist oft mental. 2 Minuten bewusst atmen oder stretchen können Wunder wirken. Probier's aus! 🌸"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  private getTimeManagementTip(context: CoachingContext): string {
    const responses = [
      "⏰ Keine Zeit? Habit-Stacking rettet den Tag! Verbinde Gewohnheiten mit dem, was du sowieso machst. Effizienz pur! 🔗",
      "⚡ Busy-Modus? Micro-Habits sind deine Waffe: 30 Sek Dankbarkeit, 1 Min Stretching. Kleine Wins zählen riesig! ✨",
      "🎯 Stress-Tag? Fokus auf 1 Kern-Gewohnheit. Alles andere ist Bonus. Du schaffst das! 💪",
      "📱 Warteschlange? Perfekt für Mini-Gewohnheiten! 1 Min Meditation, 5 Dankbarkeits-Gedanken. Zeit optimal nutzen! ⏳",
      "🌊 In der Ruhe liegt die Kraft. Paradox: Wer sich Zeit für Gewohnheiten nimmt, hat oft mehr Zeit. Investition statt Kosten! 💎"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  private getSetbackSupport(context: CoachingContext, recentContext: any): string {
    const { longestStreak } = context;
    
    if (longestStreak > 7) {
      return `💝 Du hattest schon ${longestStreak} Tage Serie - das beweist: Du KANNST es! Ein Rückschlag löscht nicht deine Fähigkeiten. Zurück ins Spiel!`;
    } else {
      return "🌱 Rückschläge sind Lernchancen! Jeder Meister war mal ein Anfänger. Was war der Grund? Lass uns die Hürde kleiner machen! 💪";
    }
  }
  
  private getCelebrationResponse(context: CoachingContext): string {
    const { progressPercentage, longestStreak } = context;
    
    if (progressPercentage === 100) {
      return "🎊 PERFEKTER TAG! Du hast dir diesen Erfolg verdient! Das ist die Disziplin von Champions. Wie fühlst du dich dabei? 👑";
    } else if (longestStreak >= 14) {
      return `🏆 Diese Konsistenz ist beeindruckend! ${longestStreak} Tage zeigen echte Entschlossenheit. Du inspirierst andere! ⭐`;
    } else {
      return "🎉 Jeder Erfolg verdient Anerkennung! Du baust Schritt für Schritt dein bestes Ich auf. Stolz ist berechtigt! 💪";
    }
  }
  
  private getPlanningSupport(context: CoachingContext): string {
    const { totalHabits, progressPercentage } = context;
    
    if (totalHabits === 0) {
      return "🎯 Großartig, dass du planst! Starte mit EINER Gewohnheit, die dir Freude macht. Welche Veränderung wünschst du dir am meisten?";
    } else if (progressPercentage < 50) {
      return "📋 Smart zu planen! Fokussiere dich auf 2-3 Hauptgewohnheiten. Welche sind dir am wichtigsten? Qualität vor Quantität! 🎯";
    } else {
      return "🚀 Mit deiner aktuellen Performance kannst du größer denken! Welche neue Herausforderung lockt dich? Zeit für das nächste Level! ⬆️";
    }
  }
  
  private getIntelligentFallback(context: CoachingContext, userMessage: string): string {
    const { todayCompleted, totalHabits, totalMessages } = context;
    
    // Erste Interaktion
    if (totalMessages < 3) {
      return "🤗 Schön, dass du hier bist! Ich bin hier, um dich bei deinen Gewohnheiten zu unterstützen. Was beschäftigt dich gerade? 💭";
    }
    
    // Kontext-basierte Antworten
    const responses = [
      `🤔 Interessant! Du hast heute ${todayCompleted}/${totalHabits} geschafft. Wie kann ich dir bei deinen Zielen helfen? 🎯`,
      "💬 Ich höre genau zu! Jede Frage bringt uns näher zu deinem Erfolg. Erzähl mir mehr über deine Gedanken! 👂",
      "🧠 Als dein Coach bin ich neugierig: Was ist deine größte Herausforderung bei Gewohnheiten? Lass uns eine Lösung finden! 🔍",
      "⚡ Du fragst, ich antworte! Welche Unterstützung brauchst du heute, um deine beste Version zu werden? 🌟"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // === Helper Methods ===
  
  private isGreeting(message: string): boolean {
    const greetings = ['hallo', 'hi', 'hey', 'guten', 'servus', 'moin', 'grüß', 'hello'];
    return greetings.some(g => message.includes(g));
  }
  
  private analyzeRecentMessages(): any {
    const recentMessages = this.chatHistory.slice(-5);
    const context: any = { themes: [], sentiment: 'neutral' };
    
    // Analysiere häufige Themen in letzten Nachrichten
    const themes = ['motivation', 'problem', 'erfolg', 'zeit', 'stress', 'müde'];
    for (const theme of themes) {
      const mentions = recentMessages.filter(msg => 
        msg.text.toLowerCase().includes(theme)
      ).length;
      if (mentions > 0) {
        context.themes.push(theme);
      }
    }
    
    return context;
  }

  // === Chat Management ===
  
  public async addMessage(text: string, isUser: boolean): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date(),
      status: 'sent'
    };
    
    this.chatHistory.push(message);
    
    // Limitiere History-Länge
    if (this.chatHistory.length > this.maxHistoryLength) {
      this.chatHistory = this.chatHistory.slice(-this.maxHistoryLength);
    }
    
    await this.saveChatHistory();
    
    // Update user profile mit neuen Insights
    if (isUser) {
      await this.updateUserInsights(text);
    }
    
    return message;
  }

  private async updateUserInsights(userMessage: string): Promise<void> {
    let profile = await this.loadUserProfile();
    
    if (!profile) {
      profile = {
        goals: [],
        challenges: [],
        preferredCoachingStyle: 'motivational',
        progressNotes: [],
        joinDate: new Date(),
        personalityInsights: []
      };
    }
    
    // Analysiere Benutzer-Nachrichten für Insights
    const lowerMessage = userMessage.toLowerCase();
    
    // Erkenne Ziele
    if (lowerMessage.includes('ziel') || lowerMessage.includes('goal') || lowerMessage.includes('erreichen') || lowerMessage.includes('schaffen')) {
      profile.progressNotes.push(`Goal mentioned: ${userMessage.substring(0, 100)} - ${new Date().toLocaleDateString()}`);
    }
    
    // Erkenne Herausforderungen
    if (lowerMessage.includes('schwer') || lowerMessage.includes('problem') || lowerMessage.includes('schaffe nicht') || lowerMessage.includes('müde')) {
      profile.progressNotes.push(`Challenge noted: ${userMessage.substring(0, 100)} - ${new Date().toLocaleDateString()}`);
    }
    
    // Erkenne Erfolge
    if (lowerMessage.includes('geschafft') || lowerMessage.includes('super') || lowerMessage.includes('toll') || lowerMessage.includes('stolz')) {
      profile.progressNotes.push(`Success celebrated: ${userMessage.substring(0, 100)} - ${new Date().toLocaleDateString()}`);
    }
    
    // Halte nur die letzten 15 Notizen
    profile.progressNotes = profile.progressNotes.slice(-15);
    
    await this.saveUserProfile(profile);
  }

  public getMessages(): ChatMessage[] {
    return [...this.chatHistory];
  }

  public async clearChatHistory(): Promise<void> {
    this.chatHistory = [];
    await AsyncStorage.removeItem('ai_chat_history');
    await AsyncStorage.removeItem('ai_user_profile');
  }
  
  public getHistory(): ChatMessage[] {
    return [...this.chatHistory];
  }
  
  public addToHistory(message: ChatMessage): void {
    this.chatHistory.push(message);
    
    // Limitiere History-Länge
    if (this.chatHistory.length > this.maxHistoryLength) {
      this.chatHistory = this.chatHistory.slice(-this.maxHistoryLength);
    }
  }
  
  public clearHistory(): void {
    this.chatHistory = [];
  }

  // === API Management ===
  
  // Get the source of the last response
  public getLastResponseSource(): 'cloud' | 'fallback' {
    return lastResponseSource;
  }
  
  // Status der API-Integration  
  public getAPIStatus(): { cloud: boolean; fallback: boolean } {
    return {
      cloud: !!auth.currentUser, // Cloud function available if user is authenticated
      fallback: true // Fallback is always available
    };
  }
}

// Export Singleton Instance
export const chatCoachService = ChatCoachService.getInstance();