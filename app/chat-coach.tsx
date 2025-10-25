import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useHabitStore } from '@/stores/habitStore';
import { useAuthContext } from '@/contexts/AuthContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { ChatMessage, chatCoachService } from '../chatCoachService';
import { chatCoachFirebaseService } from '../chatCoachFirebaseService';

const STORAGE_KEY = '@personal_coach_chat_history';

export default function ChatCoachScreen() {
  const colorScheme = useColorScheme();
  const { user } = useAuthContext();
  
  // Zustand Store für Kontext
  const { habits, getProgressPercentage } = useHabitStore();
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Hallo! Ich bin dein ChatCoach. Ich kann dir dabei helfen, über deine Gewohnheiten zu sprechen und deine Ziele zu erreichen. Wie kann ich dir heute helfen?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [responseSource, setResponseSource] = useState<'cloud' | 'fallback' | 'unknown'>('unknown');
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Lade Chat-History und personalisierte Begrüßung
  useEffect(() => {
    const initializeChat = async () => {
      if (!user) {
        setIsInitializing(false);
        return;
      }
      
      setIsInitializing(true);
      
      try {
        // Hole bestehende Sessions des Benutzers
        const sessions = await chatCoachFirebaseService.getUserSessions(user.uid);
        
        let currentSessionId: string;
        
        if (sessions.length > 0) {
          // Verwende die neueste Session
          currentSessionId = sessions[0].id!;
          
          // Lade Nachrichten der Session
          const firebaseMessages = await chatCoachFirebaseService.getUserMessages(
            user.uid,
            currentSessionId,
            20
          );
          
          if (firebaseMessages.length > 0) {
            setMessages(firebaseMessages);
            // Füge History zum Service hinzu für Kontext
            firebaseMessages.forEach((msg: ChatMessage) => {
              chatCoachService.addToHistory(msg);
            });
          } else {
            // Session existiert aber keine Nachrichten - füge Willkommensnachricht hinzu
            await addWelcomeMessage(currentSessionId);
          }
        } else {
          // Erstelle neue Session für neuen Benutzer
          currentSessionId = await chatCoachFirebaseService.createSession(user.uid);
          await addWelcomeMessage(currentSessionId);
        }
        
        setSessionId(currentSessionId);
        
        // Migriere alte lokale Nachrichten falls vorhanden (einmalig)
        await migrateOldLocalMessages();
        
      } catch (error) {
        console.error('Error initializing chat:', error);
        // Fallback auf Standard-Nachricht
        const defaultMessage = {
          id: '1',
          text: 'Hallo! Ich bin dein persönlicher Coach. Wie kann ich dir heute helfen? 🌟',
          isUser: false,
          timestamp: new Date(),
        };
        setMessages([defaultMessage]);
      } finally {
        setIsInitializing(false);
      }
    };
    
    const addWelcomeMessage = async (sessionId: string) => {
      const progressPercentage = getProgressPercentage();
      const welcomeResponse = await chatCoachService.generateResponse(
        `Hallo! (Nutzer hat ${habits.length} Gewohnheiten und ${progressPercentage}% heute geschafft)`
      );
      
      // Update response source after getting welcome response
      const source = chatCoachService.getLastResponseSource();
      setResponseSource(source);
      
      const welcomeMessage = {
        id: Date.now().toString(),
        text: welcomeResponse,
        isUser: false,
        timestamp: new Date(),
      };
      
      // Speichere in Firebase
      await chatCoachFirebaseService.saveMessage(
        user!.uid,
        sessionId,
        welcomeResponse,
        false
      );
      
      setMessages([welcomeMessage]);
      chatCoachService.addToHistory(welcomeMessage);
    };
    
    const migrateOldLocalMessages = async () => {
      try {
        const migrationKey = `@chat_migrated_${user!.uid}`;
        const alreadyMigrated = await AsyncStorage.getItem(migrationKey);
        
        if (!alreadyMigrated) {
          const oldMessages = await AsyncStorage.getItem(STORAGE_KEY);
          if (oldMessages) {
            const parsed = JSON.parse(oldMessages);
            await chatCoachFirebaseService.migrateLocalChatToFirebase(
              user!.uid,
              parsed.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
              }))
            );
            await AsyncStorage.setItem(migrationKey, 'true');
            await AsyncStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error('Migration error:', error);
      }
    };

    initializeChat();
  }, [user, habits.length]);
  
  // Keine lokale Speicherung mehr nötig - alles in Firebase

  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || isLoading || !user || !sessionId) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}`,
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
      status: 'sending',
    };

    // Füge Nachricht zur History hinzu
    chatCoachService.addToHistory(userMessage);
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    setIsLoading(true);

    try {
      // Speichere Benutzernachricht in Firebase
      await chatCoachFirebaseService.saveMessage(
        user.uid,
        sessionId,
        userMessage.text,
        true
      );
      
      // Generiere Antwort mit vollständiger History
      const allMessages = [...messages, userMessage];
      const botResponse = await chatCoachService.generateResponse(
        userMessage.text,
        allMessages
      );
      
      // Update response source after getting response
      const source = chatCoachService.getLastResponseSource();
      setResponseSource(source);
      
      const botMessage: ChatMessage = {
        id: `${Date.now() + 1}`,
        text: botResponse,
        isUser: false,
        timestamp: new Date(),
        status: 'sent',
      };

      // Speichere Bot-Antwort in Firebase
      await chatCoachFirebaseService.saveMessage(
        user.uid,
        sessionId,
        botResponse,
        false
      );
      
      // Füge Bot-Antwort zur History hinzu
      chatCoachService.addToHistory(botMessage);
      
      // Update Nachrichten-Status
      setMessages(prev => [
        ...prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'sent' as const }
            : msg
        ),
        botMessage
      ]);
    } catch (error) {
      // Update Status auf Fehler
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'error' as const }
            : msg
        )
      );
      
      Alert.alert(
        'Verbindungsfehler', 
        'Die Nachricht konnte nicht gesendet werden. Bitte überprüfe deine Internetverbindung.',
        [
          { text: 'Erneut versuchen', onPress: () => sendMessage() },
          { text: 'Abbrechen', style: 'cancel' }
        ]
      );
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [inputText, isLoading, messages, sessionId, user]);
  
  // Funktion zum Löschen der Chat-History
  const clearChatHistory = useCallback(() => {
    if (!user || !sessionId) return;
    
    Alert.alert(
      'Chat löschen',
      'Möchtest du den gesamten Chat-Verlauf löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              // Lösche Firebase Session und Nachrichten
              await chatCoachFirebaseService.deleteSession(sessionId, user.uid);
              
              // Lösche lokale History
              chatCoachService.clearHistory();
              
              // Erstelle neue Session
              const newSessionId = await chatCoachFirebaseService.createSession(user.uid);
              setSessionId(newSessionId);
              
              // Generiere neue Willkommensnachricht
              const progressPercentage = getProgressPercentage();
              const welcomeResponse = await chatCoachService.generateResponse(
                `Hallo! Neuer Chat gestartet. (${habits.length} Gewohnheiten, ${progressPercentage}% heute)`
              );
              
              // Update response source after getting welcome response
              const source = chatCoachService.getLastResponseSource();
              setResponseSource(source);
              
              const welcomeMessage = {
                id: Date.now().toString(),
                text: welcomeResponse,
                isUser: false,
                timestamp: new Date(),
              };
              
              // Speichere in Firebase
              await chatCoachFirebaseService.saveMessage(
                user.uid,
                newSessionId,
                welcomeResponse,
                false
              );
              
              setMessages([welcomeMessage]);
              chatCoachService.addToHistory(welcomeMessage);
            } catch (error) {
              console.error('Error clearing chat:', error);
              Alert.alert('Fehler', 'Chat konnte nicht gelöscht werden.');
            }
          }
        }
      ]
    );
  }, [habits.length, user, sessionId]);
  
  // Funktion zum Löschen einzelner Nachrichten
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!user) return;
    
    try {
      await chatCoachFirebaseService.deleteMessage(messageId, user.uid);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      Alert.alert('Fehler', 'Nachricht konnte nicht gelöscht werden.');
    }
  }, [user]);

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <TouchableOpacity 
      style={[
        styles.messageContainer,
        item.isUser ? styles.userMessage : styles.botMessage
      ]}
      onLongPress={() => {
        if (item.isUser) {
          Alert.alert(
            'Nachricht löschen',
            'Möchtest du diese Nachricht löschen?',
            [
              { text: 'Abbrechen', style: 'cancel' },
              { 
                text: 'Löschen', 
                style: 'destructive',
                onPress: () => deleteMessage(item.id)
              }
            ]
          );
        }
      }}
      activeOpacity={0.8}
    >
      <View style={[
        styles.messageBubble,
        item.isUser 
          ? [styles.userBubble, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]
          : styles.botBubble,
        item.status === 'error' && styles.errorBubble
      ]}>
        <ThemedText style={[
          styles.messageText,
          item.isUser && styles.userMessageText
        ]}>
          {item.text}
        </ThemedText>
        {item.status === 'sending' && item.isUser && (
          <ActivityIndicator 
            size="small" 
            color="white" 
            style={styles.sendingIndicator}
          />
        )}
      </View>
      <View style={styles.timestampContainer}>
        <ThemedText style={styles.timestamp}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </ThemedText>
        {item.status === 'error' && (
          <MaterialIcons name="error-outline" size={14} color="#EF4444" style={styles.errorIcon} />
        )}
      </View>
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContainer}>
          <MaterialIcons name="lock" size={64} color="#999" />
          <ThemedText style={styles.noUserText}>Bitte melde dich an, um den Chat-Coach zu nutzen</ThemedText>
        </View>
      </ThemedView>
    );
  }
  
  if (isInitializing) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
          <ThemedText style={styles.loadingText}>Chat wird geladen...</ThemedText>
        </View>
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={styles.container}>
      {/* Header mit Clear-Button */}
      <View style={[styles.header, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <ThemedText style={styles.headerTitle}>ChatCoach</ThemedText>
          {responseSource !== 'unknown' && (
            <View style={[
              styles.statusIndicator, 
              { backgroundColor: responseSource === 'cloud' ? '#10B981' : '#F59E0B' }
            ]}>
              <ThemedText style={styles.statusText}>
                AI: {responseSource === 'cloud' ? 'Cloud' : 'Fallback'}
              </ThemedText>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={clearChatHistory} style={styles.headerRight}>
          <MaterialIcons name="delete-outline" size={22} color="white" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Typing indicator mit Animation */}
        {isTyping && (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingBubble}>
              <View style={styles.typingDotsContainer}>
                <View style={[styles.typingDot, styles.typingDot1]} />
                <View style={[styles.typingDot, styles.typingDot2]} />
                <View style={[styles.typingDot, styles.typingDot3]} />
              </View>
              <ThemedText style={styles.loadingText}>Coach denkt nach...</ThemedText>
            </View>
          </View>
        )}

        {/* Enhanced Input area */}
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={[styles.textInput, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Was beschäftigt dich heute?"
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
            editable={!isLoading}
          />
          <TouchableOpacity 
            style={[styles.sendButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <MaterialIcons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 15,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
  headerRight: {
    padding: 4,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  botMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
  },
  userMessageText: {
    color: 'white',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginHorizontal: 16,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  errorIcon: {
    marginLeft: 4,
  },
  errorBubble: {
    opacity: 0.7,
  },
  sendingIndicator: {
    marginLeft: 8,
  },
  typingDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
    marginHorizontal: 2,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.7,
  },
  typingDot3: {
    opacity: 1,
  },
  loadingContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  loadingBubble: {
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: 'white',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noUserText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
});
