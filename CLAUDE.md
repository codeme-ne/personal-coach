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
    - Settings Tab (`settings.tsx`) - App configuration
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

## Recent Changes & Fixes (Aug 2025)

### Fixed Issues
1. **Habit Deletion on Web Platform**
   - **Problem**: `Alert.alert()` doesn't work properly on web browsers
   - **Solution**: Use `Platform.OS === 'web'` check with `window.confirm()` for web, keep `Alert.alert()` for mobile
   - **Location**: `components/HabitList.tsx` deleteHabit function
   - **Pattern**: Same approach used in TodoList for web compatibility

2. **TodoList Component Cleanup** 
   - Removed TodoList import and component from settings.tsx
   - Cleaned up todo-related state and UI elements
   - App now focuses purely on habit tracking

### Technical Learnings
- **Web Compatibility**: React Native Alert components need platform-specific handling for web
- **Firebase Integration**: Habit deletion properly cascades to remove all completion records
- **UI Patterns**: Confirmation dialogs should use native browser dialogs on web for better UX

### Current State
- ✅ Habit CRUD operations working (add, edit, delete, toggle completion)
- ✅ Firebase Firestore integration functional
- ✅ Streak calculation and history tracking
- ✅ Web platform compatibility for all core features
- ✅ Settings screen with app preferences

### Outstanding Tasks (from README.md)
- "Outstanding / Next Session" section is currently empty
- All major issues have been resolved

## Firebase Authentication (Aug 2025)

### ✅ Tested & Working (Web Only)
- Register/login UI works
- Logout functionality works  
- Settings shows user profile with password change option

### ❓ Not Yet Tested
- Password reset emails (email service not configured)
- User data isolation (habits scoped to userId)
- Cross-platform auth (iOS/Android)
- Firestore security rules enforcement

### 🔧 Key Files Added
- `authService.ts` - Firebase auth methods
- `contexts/AuthContext.tsx` - Global auth state
- `app/auth/*` - Login/register/reset screens
- `habitService.ts` - Updated with userId scoping
- `firestore.rules` - Database security rules

### ⚠️ Critical Next Steps
- **Deploy rules**: `npm run firebase:rules` (data security not enforced yet)
- **Test data isolation**: Create 2 accounts, verify habits don't cross over
- **Email setup**: Configure Firebase email service for password reset

### 🚨 Known Issues
- **Firebase CLI**: Use v13.15.4 for Node.js 18
- **Platform dialogs**: `Platform.OS === 'web'` ? `window.confirm()` : `Alert.alert()`
- Existing habits need userId field migration