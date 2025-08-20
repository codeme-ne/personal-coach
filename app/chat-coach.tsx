import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
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

export default function ChatCoachScreen() {
  const colorScheme = useColorScheme();
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
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Load personalized welcome message on component mount
  useEffect(() => {
    const loadWelcomeMessage = async () => {
      try {
        const welcomeResponse = await chatCoachService.generateResponse('hallo');
        // Replace the initial generic message with personalized one
        setMessages([{
          id: '1',
          text: welcomeResponse,
          isUser: false,
          timestamp: new Date(),
        }]);
      } catch (error) {
        console.error('Error loading welcome message:', error);
        // Keep the default message if there's an error
      }
    };

    // Load welcome message after a short delay
    setTimeout(loadWelcomeMessage, 500);
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const botResponse = await chatCoachService.generateResponse(userMessage.text);
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      Alert.alert('Fehler', 'Konnte keine Antwort generieren. Bitte versuche es erneut.');
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[
      styles.messageContainer,
      item.isUser ? styles.userMessage : styles.botMessage
    ]}>
      <View style={[
        styles.messageBubble,
        item.isUser 
          ? [styles.userBubble, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]
          : styles.botBubble
      ]}>
        <ThemedText style={[
          styles.messageText,
          item.isUser && styles.userMessageText
        ]}>
          {item.text}
        </ThemedText>
      </View>
      <ThemedText style={styles.timestamp}>
        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>ChatCoach</ThemedText>
        <View style={styles.headerRight} />
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

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingBubble}>
              <ThemedText style={styles.loadingText}>ChatCoach tippt...</ThemedText>
            </View>
          </View>
        )}

        {/* Input area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.textInput, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Schreibe eine Nachricht..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
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
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerRight: {
    width: 32,
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
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    marginHorizontal: 16,
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
});
