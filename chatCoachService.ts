import { habitService } from './habitService';

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export class ChatCoachService {
  private static instance: ChatCoachService;
  
  private constructor() {}
  
  public static getInstance(): ChatCoachService {
    if (!ChatCoachService.instance) {
      ChatCoachService.instance = new ChatCoachService();
    }
    return ChatCoachService.instance;
  }

  public async generateResponse(userMessage: string): Promise<string> {
    try {
      // Get user's current habits for context
      const habits = await habitService.getHabits();
      const completedToday = await habitService.getTodayCompletedHabits();
      
      return this.generateContextualResponse(userMessage, habits, completedToday);
    } catch (error) {
      console.error('Error generating response:', error);
      return this.generateBasicResponse(userMessage);
    }
  }

  private generateContextualResponse(
    userMessage: string, 
    habits: any[], 
    completedToday: any[]
  ): string {
    const lowerMessage = userMessage.toLowerCase();
    
    // Greetings
    if (lowerMessage.includes('hallo') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      if (completedToday.length > 0) {
        return `Hallo! Ich sehe, du hast heute bereits ${completedToday.length} Gewohnheit${completedToday.length > 1 ? 'en' : ''} abgeschlossen: ${completedToday.map(c => c.habit.name).join(', ')}. Das ist fantastisch! Wie kann ich dir heute weiterhelfen?`;
      } else if (habits.length > 0) {
        return `Hallo! Du hast ${habits.length} Gewohnheit${habits.length > 1 ? 'en' : ''} in deiner Liste. Noch keine davon heute abgeschlossen? Kein Problem - der Tag ist noch jung! Wie kann ich dir helfen?`;
      } else {
        return 'Hallo! Willkommen bei deinem ChatCoach! Ich sehe, du hast noch keine Gewohnheiten erstellt. Möchtest du mit mir darüber sprechen, welche Gewohnheiten du entwickeln möchtest?';
      }
    }

    // Progress check
    if (lowerMessage.includes('fortschritt') || lowerMessage.includes('progress') || lowerMessage.includes('wie läuft')) {
      if (completedToday.length > 0) {
        const percentage = Math.round((completedToday.length / habits.length) * 100);
        return `Heute läuft es super! Du hast ${completedToday.length} von ${habits.length} Gewohnheiten abgeschlossen (${percentage}%). ${this.getMotivationalMessage(percentage)}`;
      } else if (habits.length > 0) {
        return `Du hast heute noch keine Gewohnheiten abgeschlossen, aber das ist okay! Du hast ${habits.length} Gewohnheit${habits.length > 1 ? 'en' : ''} in deiner Liste. Welche möchtest du als erstes angehen?`;
      } else {
        return 'Du hast noch keine Gewohnheiten erstellt. Lass uns gemeinsam überlegen, welche Gewohnheiten dir helfen könnten, deine Ziele zu erreichen!';
      }
    }

    // Motivation requests
    if (lowerMessage.includes('motivation') || lowerMessage.includes('motiviert') || lowerMessage.includes('aufgeben')) {
      return this.getMotivationMessage(habits.length, completedToday.length);
    }

    // Habit-specific questions
    if (lowerMessage.includes('gewohnheit') || lowerMessage.includes('habit')) {
      if (habits.length === 0) {
        return 'Du hast noch keine Gewohnheiten! Lass uns das ändern. Was ist eine Gewohnheit, die du gerne entwickeln möchtest? Zum Beispiel: täglich lesen, mehr trinken, Sport machen oder früher schlafen gehen?';
      } else {
        const habitNames = habits.map(h => h.name).join(', ');
        return `Du arbeitest an folgenden Gewohnheiten: ${habitNames}. Welche bereitet dir Schwierigkeiten oder welche läuft besonders gut?`;
      }
    }

    // Difficulty/challenges
    if (lowerMessage.includes('schwer') || lowerMessage.includes('schwierig') || lowerMessage.includes('problem') || lowerMessage.includes('schaffe')) {
      return 'Ich verstehe, dass es manchmal herausfordernd ist. Das ist völlig normal! Hier sind einige Strategien:\n\n• Starte klein - schon 2 Minuten täglich machen einen Unterschied\n• Verbinde neue Gewohnheiten mit bestehenden Routinen\n• Belohne dich für kleine Erfolge\n• Sei geduldig mit dir selbst\n\nWas genau bereitet dir Schwierigkeiten?';
    }

    // Tips request
    if (lowerMessage.includes('tipp') || lowerMessage.includes('hilfe') || lowerMessage.includes('ratschlag')) {
      return this.getRandomTip();
    }

    // Thanks
    if (lowerMessage.includes('danke') || lowerMessage.includes('dankeschön')) {
      return 'Sehr gerne! Es macht mir Freude, dir zu helfen. Du machst das wirklich gut! Denk daran: Jeder kleine Schritt zählt. Ist da noch etwas, womit ich dir helfen kann?';
    }

    // Default response with context
    if (habits.length > 0) {
      return `Das ist interessant! Du arbeitest ja an ${habits.length} Gewohnheit${habits.length > 1 ? 'en' : ''}. Kannst du mir mehr darüber erzählen? Wie hängt das mit deinen Gewohnheiten zusammen?`;
    } else {
      return 'Erzähle mir mehr darüber! Vielleicht können wir gemeinsam herausfinden, wie das in eine gute Gewohnheit umgewandelt werden kann.';
    }
  }

  private generateBasicResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('hallo') || lowerMessage.includes('hi')) {
      return 'Hallo! Schön, dass du da bist. Erzähl mir gerne von deinen Gewohnheiten oder Zielen.';
    }
    
    if (lowerMessage.includes('gewohnheit') || lowerMessage.includes('habit')) {
      return 'Das ist großartig, dass du an deinen Gewohnheiten arbeiten möchtest! Welche Gewohnheit beschäftigt dich gerade?';
    }
    
    if (lowerMessage.includes('motivation')) {
      return 'Motivation ist der Schlüssel! Denk daran: Kleine, konsistente Schritte führen zu großen Veränderungen. Was ist dein "Warum"?';
    }
    
    return 'Das ist interessant! Erzähl mir mehr darüber. Wie fühlst du dich dabei und was denkst du, könnte dir helfen?';
  }

  private getMotivationalMessage(percentage: number): string {
    if (percentage >= 80) {
      return 'Das ist außergewöhnlich! Du bist heute richtig auf Kurs! 🌟';
    } else if (percentage >= 60) {
      return 'Du machst das großartig! Du bist auf einem sehr guten Weg! 💪';
    } else if (percentage >= 40) {
      return 'Guter Start! Du hast schon einiges geschafft - weiter so! 👍';
    } else {
      return 'Jeder Anfang ist schwer, aber du hast schon begonnen - das ist das Wichtigste! 🎯';
    }
  }

  private getMotivationMessage(totalHabits: number, completedToday: number): string {
    const messages = [
      'Du schaffst das! Jeder Tag ist eine neue Chance, besser zu werden. 💪',
      'Denk daran: Es geht nicht um Perfektion, sondern um Fortschritt. Kleine Schritte zählen! 🌱',
      'Gewohnheiten sind wie Muskeln - sie werden stärker, je öfter du sie trainierst. 🏋️‍♀️',
      'Du bist stärker als deine Ausreden. Glaub an dich! ✨',
      'Jeder Experte war einmal ein Anfänger. Du bist auf dem richtigen Weg! 🎯'
    ];
    
    if (completedToday > 0) {
      return `Du hast heute bereits ${completedToday} Gewohnheit${completedToday > 1 ? 'en' : ''} geschafft! ${messages[Math.floor(Math.random() * messages.length)]}`;
    }
    
    return messages[Math.floor(Math.random() * messages.length)];
  }

  private getRandomTip(): string {
    const tips = [
      '💡 Tipp: Verbinde neue Gewohnheiten mit bestehenden Routinen. Zum Beispiel: "Nach dem Zähneputzen meditiere ich 5 Minuten."',
      '💡 Tipp: Starte so klein wie möglich. Lieber 1 Minute täglich als 1 Stunde einmal pro Woche.',
      '💡 Tipp: Belohne dich für Erfolge! Das Gehirn liebt positive Verstärkung.',
      '💡 Tipp: Schreibe deine "Warum" auf - deine Motivation hinter jeder Gewohnheit.',
      '💡 Tipp: Plane für Rückschläge. Wenn du einen Tag verpasst, mach einfach am nächsten Tag weiter.',
      '💡 Tipp: Teile deine Ziele mit anderen - sozialer Druck kann sehr motivierend sein!',
      '💡 Tipp: Verfolge deinen Fortschritt sichtbar - ein einfacher Kalender mit X-Markierungen wirkt Wunder.'
    ];
    
    return tips[Math.floor(Math.random() * tips.length)];
  }
}

export const chatCoachService = ChatCoachService.getInstance();
