import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { todoService, Todo } from '../todoService';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();

  // ToDos beim ersten Laden abrufen
  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      setLoading(true);
      const todosFromDb = await todoService.getTodos();
      setTodos(todosFromDb);
    } catch (error) {
      Alert.alert('Fehler', 'ToDos konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async () => {
    if (!newTodoText.trim()) {
      Alert.alert('Hinweis', 'Bitte gib einen Text für das ToDo ein');
      return;
    }

    try {
      setLoading(true);
      await todoService.addTodo(newTodoText.trim());
      setNewTodoText('');
      await loadTodos(); // Liste neu laden
    } catch (error) {
      Alert.alert('Fehler', 'ToDo konnte nicht hinzugefügt werden');
    } finally {
      setLoading(false);
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      await todoService.toggleTodo(id, !completed);
      await loadTodos(); // Liste neu laden
    } catch (error) {
      Alert.alert('Fehler', 'ToDo konnte nicht aktualisiert werden');
    }
  };

  const deleteTodo = async (id: string) => {
    Alert.alert(
      'ToDo löschen',
      'Möchtest du dieses ToDo wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await todoService.deleteTodo(id);
              await loadTodos(); // Liste neu laden
            } catch (error) {
              Alert.alert('Fehler', 'ToDo konnte nicht gelöscht werden');
            }
          },
        },
      ]
    );
  };

  const renderTodo = ({ item }: { item: Todo }) => (
    <ThemedView style={styles.todoItem}>
      <TouchableOpacity
        style={styles.todoContent}
        onPress={() => toggleTodo(item.id!, item.completed)}
      >
        <ThemedView style={[
          styles.checkbox,
          item.completed && styles.checkboxCompleted,
          { borderColor: Colors[colorScheme ?? 'light'].text }
        ]}>
          {item.completed && <ThemedText style={styles.checkmark}>✓</ThemedText>}
        </ThemedView>
        <ThemedText style={[
          styles.todoText,
          item.completed && styles.todoTextCompleted
        ]}>
          {item.text}
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteTodo(item.id!)}
      >
        <ThemedText style={styles.deleteButtonText}>🗑️</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>Meine ToDos</ThemedText>
      
      {/* Input für neues ToDo */}
      <ThemedView style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            { 
              borderColor: Colors[colorScheme ?? 'light'].text,
              color: Colors[colorScheme ?? 'light'].text
            }
          ]}
          placeholder="Neues ToDo eingeben..."
          placeholderTextColor={Colors[colorScheme ?? 'light'].text + '80'}
          value={newTodoText}
          onChangeText={setNewTodoText}
          onSubmitEditing={addTodo}
        />
        <TouchableOpacity
          style={[
            styles.addButton,
            { backgroundColor: Colors[colorScheme ?? 'light'].tint }
          ]}
          onPress={addTodo}
          disabled={loading}
        >
          <ThemedText style={styles.addButtonText}>
            {loading ? '...' : '+'}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* ToDo-Liste */}
      <FlatList
        data={todos}
        renderItem={renderTodo}
        keyExtractor={(item) => item.id!}
        style={styles.todoList}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  todoList: {
    flex: 1,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  todoContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  todoText: {
    flex: 1,
    fontSize: 16,
  },
  todoTextCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 18,
  },
}); 