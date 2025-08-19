# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Personal Coach" - A React Native Expo habit tracking application with Firebase Firestore backend. The app helps users build consistent routines by tracking daily habits, viewing streaks, and monitoring progress over time.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm start
# or
npx expo start

# Platform-specific development
npm run android  # Start Android emulator
npm run ios      # Start iOS simulator  
npm run web      # Start web development

# Linting
npm run lint

# Reset project (moves starter code to app-example/)
npm run reset-project
```

## Architecture

### Technology Stack
- **Framework**: React Native with Expo SDK 53
- **Language**: TypeScript with strict mode enabled
- **Navigation**: Expo Router (file-based routing)
- **Database**: Firebase Firestore
- **Styling**: React Native StyleSheet with theme support
- **State Management**: React hooks (useState, useEffect)

### Key Directories
- `app/` - Application screens using file-based routing
  - `(tabs)/` - Tab navigation screens (index, explore)
  - `_layout.tsx` - Root and nested layout components
- `components/` - Reusable UI components
  - `ui/` - Platform-specific UI components
- `hooks/` - Custom React hooks for theme and color scheme
- `constants/` - Application constants (colors, themes)

### Core Services

#### Firebase Configuration (`firebase.ts`)
- Initialized with environment variables (EXPO_PUBLIC_FIREBASE_*)
- Exports configured Firestore database instance

#### Habit Service (`habitService.ts`)
- CRUD operations for habits in Firestore
- Collections: `habits`, `completions`
- Key methods:
  - `addHabit()`, `getHabits()`, `updateHabit()`, `deleteHabit()`
  - `completeHabitForToday()`, `uncompleteHabitForToday()`
  - `isHabitCompletedToday()`, `getHabitCompletions()`
  - `getHabitStreak()` - Calculates consecutive day streaks

#### Todo Service (`todoService.ts`) 
- Legacy todo functionality (still present but replaced by habits)
- Collection: `todos`
- German error messages in console logs

### Main Components

#### HabitList (`components/HabitList.tsx`)
- Main habit management interface
- Features: Add/edit/delete habits, mark daily completion, view streaks
- Modal-based forms for adding/editing habits
- Long press for habit history

#### HabitHistory (`components/HabitHistory.tsx`)
- Calendar view of habit completion history
- Visual representation of streaks and patterns

### Navigation Structure
- Stack Navigator (root)
  - Tab Navigator
    - Habits Tab (`index.tsx`) - Contains HabitList component
    - Explore Tab (`explore.tsx`) - Example screen
  - Not Found Screen (`+not-found.tsx`)

### Theming System
- Automatic light/dark theme switching based on device settings
- Theme-aware components: `ThemedText`, `ThemedView`
- Color constants defined in `constants/Colors.ts`
- Custom hook `useColorScheme()` for accessing current theme

### Environment Variables
Required Firebase configuration in `.env` or Expo environment:
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`

## TypeScript Configuration
- Extends `expo/tsconfig.base`
- Strict mode enabled
- Path alias: `@/*` maps to root directory

## ESLint Configuration
- Uses `eslint-config-expo/flat`
- Ignores `dist/*` directory