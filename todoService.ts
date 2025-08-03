import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface Todo {
  id?: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

const COLLECTION_NAME = 'todos';

export const todoService = {
  // Neues ToDo hinzufügen
  async addTodo(text: string): Promise<void> {
    try {
      await addDoc(collection(db, COLLECTION_NAME), {
        text,
        completed: false,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Fehler beim Hinzufügen des ToDos:', error);
      throw error;
    }
  },

  // Alle ToDos abrufen
  async getTodos(): Promise<Todo[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Todo[];
    } catch (error) {
      console.error('Fehler beim Abrufen der ToDos:', error);
      throw error;
    }
  },

  // ToDo als erledigt markieren
  async toggleTodo(id: string, completed: boolean): Promise<void> {
    try {
      const todoRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(todoRef, { completed });
    } catch (error) {
      console.error('Fehler beim Aktualisieren des ToDos:', error);
      throw error;
    }
  },

  // ToDo löschen
  async deleteTodo(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error('Fehler beim Löschen des ToDos:', error);
      throw error;
    }
  },
}; 