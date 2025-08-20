import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface Todo {
  id: string;              // Make id required; every fetched todo has one
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

      return querySnapshot.docs.map(d => {
        const data: any = d.data();
        const created = data?.createdAt && typeof data.createdAt.toDate === 'function'
          ? data.createdAt.toDate()
          : new Date(); // fallback if malformed
        return {
          ...data,              // spread first so we can safely override below
          id: d.id,             // ensure the Firestore doc id wins
          createdAt: created,
        } as Todo;
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der ToDos (getTodos):', error);
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
      if (!id) {
        throw new Error('Invalid todo id for deletion');
      }
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error(`Fehler beim Löschen des ToDos (id=${id}):`, error);
      throw error;
    }
  },
};