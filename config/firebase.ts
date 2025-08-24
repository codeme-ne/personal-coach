// === Firebase Configuration ===
// Zweck: Initialisiert Firebase App mit Auth, Firestore und Functions
// Exports: app (Firebase App), db (Firestore), auth (Authentication), functions (Cloud Functions)

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
  };


// Firebase App Initialisierung
const app = initializeApp(firebaseConfig);

// Firebase Services Export
export const db = getFirestore(app);        // Firestore Database für Habits/Completions
export const auth = getAuth(app);           // Authentication Service für User Management
export const functions = getFunctions(app); // Cloud Functions für AI Integration






