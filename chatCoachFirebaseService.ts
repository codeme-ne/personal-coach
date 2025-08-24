// === Firebase Chat Coach Service ===
// Zweck: Benutzerspezifischer Chat-Service mit Firebase Firestore
// Features: User-scoped Chats, Permanente Speicherung, Sitzungsverwaltung

import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './config/firebase';
import { ChatMessage } from './chatCoachService';

export interface FirebaseChatMessage {
  id?: string;
  userId: string;
  sessionId: string;
  text: string;
  isUser: boolean;
  timestamp: Timestamp;
  status?: 'sending' | 'sent' | 'error';
}

export interface ChatSession {
  id?: string;
  userId: string;
  createdAt: Timestamp;
  lastMessageAt: Timestamp;
  messageCount: number;
  title?: string;
}

class ChatCoachFirebaseService {
  private static instance: ChatCoachFirebaseService;
  private readonly CHATS_COLLECTION = 'chatMessages';
  private readonly SESSIONS_COLLECTION = 'chatSessions';
  
  private constructor() {}
  
  public static getInstance(): ChatCoachFirebaseService {
    if (!ChatCoachFirebaseService.instance) {
      ChatCoachFirebaseService.instance = new ChatCoachFirebaseService();
    }
    return ChatCoachFirebaseService.instance;
  }

  // === Session Management ===
  
  async createSession(userId: string): Promise<string> {
    try {
      const sessionData: Omit<ChatSession, 'id'> = {
        userId,
        createdAt: serverTimestamp() as Timestamp,
        lastMessageAt: serverTimestamp() as Timestamp,
        messageCount: 0,
        title: `Chat vom ${new Date().toLocaleDateString('de-DE')}`
      };
      
      const docRef = await addDoc(collection(db, this.SESSIONS_COLLECTION), sessionData);
      console.log('Created new chat session:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating chat session:', error);
      throw error;
    }
  }
  
  async getUserSessions(userId: string): Promise<ChatSession[]> {
    try {
      const q = query(
        collection(db, this.SESSIONS_COLLECTION),
        where('userId', '==', userId),
        orderBy('lastMessageAt', 'desc'),
        limit(10)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatSession));
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      return [];
    }
  }
  
  async deleteSession(sessionId: string, userId: string): Promise<void> {
    try {
      // Lösche alle Nachrichten der Session
      const messagesQuery = query(
        collection(db, this.CHATS_COLLECTION),
        where('sessionId', '==', sessionId),
        where('userId', '==', userId)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      const deletePromises = messagesSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
      
      // Lösche die Session selbst
      await deleteDoc(doc(db, this.SESSIONS_COLLECTION, sessionId));
      
      console.log('Deleted session and messages:', sessionId);
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  // === Message Management ===
  
  async saveMessage(
    userId: string, 
    sessionId: string, 
    text: string, 
    isUser: boolean
  ): Promise<FirebaseChatMessage> {
    try {
      const messageData: Omit<FirebaseChatMessage, 'id'> = {
        userId,
        sessionId,
        text,
        isUser,
        timestamp: serverTimestamp() as Timestamp,
        status: 'sent'
      };
      
      const docRef = await addDoc(collection(db, this.CHATS_COLLECTION), messageData);
      console.log('Saved message to Firebase:', docRef.id);
      
      // Update session lastMessageAt
      await this.updateSessionTimestamp(sessionId, userId);
      
      return {
        id: docRef.id,
        ...messageData
      };
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }
  
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    try {
      // Verifiziere, dass die Nachricht dem Benutzer gehört
      const messageRef = doc(db, this.CHATS_COLLECTION, messageId);
      await deleteDoc(messageRef);
      console.log('Deleted message:', messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }
  
  async getUserMessages(
    userId: string, 
    sessionId: string, 
    limitCount: number = 50
  ): Promise<ChatMessage[]> {
    try {
      const q = query(
        collection(db, this.CHATS_COLLECTION),
        where('userId', '==', userId),
        where('sessionId', '==', sessionId),
        orderBy('timestamp', 'asc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data() as FirebaseChatMessage;
        return {
          id: doc.id,
          text: data.text,
          isUser: data.isUser,
          timestamp: data.timestamp?.toDate() || new Date(),
          status: data.status
        } as ChatMessage;
      });
    } catch (error) {
      console.error('Error fetching user messages:', error);
      return [];
    }
  }
  
  async clearUserChatHistory(userId: string): Promise<void> {
    try {
      // Lösche alle Nachrichten des Benutzers
      const messagesQuery = query(
        collection(db, this.CHATS_COLLECTION),
        where('userId', '==', userId)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      const deletePromises = messagesSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
      
      // Lösche alle Sessions des Benutzers
      const sessionsQuery = query(
        collection(db, this.SESSIONS_COLLECTION),
        where('userId', '==', userId)
      );
      
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessionDeletePromises = sessionsSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(sessionDeletePromises);
      
      console.log('Cleared all chat history for user:', userId);
    } catch (error) {
      console.error('Error clearing chat history:', error);
      throw error;
    }
  }
  
  // === Helper Methods ===
  
  private async updateSessionTimestamp(sessionId: string, userId: string): Promise<void> {
    try {
      const sessionRef = doc(db, this.SESSIONS_COLLECTION, sessionId);
      const sessionDoc = await getDocs(
        query(
          collection(db, this.SESSIONS_COLLECTION),
          where('userId', '==', userId)
        )
      );
      
      if (!sessionDoc.empty) {
        const currentSession = sessionDoc.docs.find(d => d.id === sessionId);
        if (currentSession) {
          const currentData = currentSession.data() as ChatSession;
          await currentSession.ref.update({
            lastMessageAt: serverTimestamp(),
            messageCount: (currentData.messageCount || 0) + 1
          });
        }
      }
    } catch (error) {
      console.error('Error updating session timestamp:', error);
    }
  }
  
  // === Migration Helper ===
  
  async migrateLocalChatToFirebase(
    userId: string,
    localMessages: ChatMessage[]
  ): Promise<void> {
    try {
      if (localMessages.length === 0) return;
      
      // Erstelle neue Session für migrierte Nachrichten
      const sessionId = await this.createSession(userId);
      
      // Speichere alle Nachrichten
      for (const message of localMessages) {
        await this.saveMessage(
          userId,
          sessionId,
          message.text,
          message.isUser
        );
      }
      
      console.log('Migrated', localMessages.length, 'messages to Firebase');
    } catch (error) {
      console.error('Error migrating chat to Firebase:', error);
    }
  }
}

export const chatCoachFirebaseService = ChatCoachFirebaseService.getInstance();