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
npm run web      # Start web development (main development platform)

# Linting and Code Quality
npm run lint     # Run ESLint with expo/flat config

# Firebase deployment
npm run firebase:deploy      # Deploy rules and indexes
npm run firebase:rules       # Deploy only Firestore rules
npm run firebase:login       # Login to Firebase

# Project utilities
npm run reset-project       # Moves starter code to app-example/
```

## Architecture

### Technology Stack
- **Framework**: React Native with Expo SDK 53
- **Language**: TypeScript with strict mode enabled
- **Navigation**: Expo Router (file-based routing) with stack and tab navigators
- **Database**: Firebase Firestore with real-time sync
- **Authentication**: Firebase Auth with user-scoped data
- **Styling**: React Native StyleSheet with automatic light/dark theme support
- **State Management**: React Context (AuthContext) + React hooks
- **Development Platform**: Primary development and testing on web via Expo

### Key Directories
- `app/` - Application screens using file-based routing
  - `(tabs)/` - Tab navigation screens (index, settings)
  - `auth/` - Authentication screens (login, register, forgot-password)
  - `chat-coach.tsx` - AI chat coaching interface
  - `_layout.tsx` - Root and nested layout components
- `components/` - Reusable UI components
  - `ui/` - Platform-specific UI components
- `contexts/` - React contexts (AuthContext)
- `config/` - Configuration files (Firebase)
- `hooks/` - Custom React hooks for theme and auth
- `constants/` - Application constants (colors, themes)

### Core Services

#### Firebase Configuration (`config/firebase.ts`)
- Initialized with environment variables (EXPO_PUBLIC_FIREBASE_*)
- Exports configured Firestore database and Auth instances
- Centralized configuration for all Firebase services

#### Auth Service (`authService.ts`)
- Firebase Authentication wrapper
- User registration, login, logout, password reset
- Integrates with AuthContext for global state management

#### Habit Service (`habitService.ts`)
- CRUD operations for habits in Firestore with user scoping
- Collections: `habits`, `completions` (scoped by userId)
- Key methods:
  - `addHabit()`, `getHabits()`, `updateHabit()`, `deleteHabit()`
  - `completeHabitForToday()`, `uncompleteHabitForToday()`
  - `isHabitCompletedToday()`, `getHabitCompletions()`
  - `getHabitStreak()`, `getTodayCompletedHabits()`

#### Chat Coach Service (`chatCoachService.ts`)
- AI-powered coaching system with contextual responses
- Integrates with user's habit data for personalized advice
- German language support with motivational messaging
- Smart response generation based on user's progress and habits

#### Legacy Services
- **todoService.ts**: Legacy todo functionality (deprecated, use habitService instead)
- Collection: `todos` - Consider for cleanup/removal

### Main Components

#### HabitList (`components/HabitList.tsx`)
- Main habit management interface
- Features: Add/edit/delete habits, mark daily completion, view streaks
- Modal-based forms for adding/editing habits
- Long press for habit history
- Platform-specific dialog handling (web vs mobile)

#### HabitHistory (`components/HabitHistory.tsx`)
- Calendar view of habit completion history
- Visual representation of streaks and patterns

#### AddOptionsModal (`components/AddOptionsModal.tsx`)
- Central modal for choosing between adding habits or starting chat
- Integrates with CustomTabBar's add button
- German UI with clear action options

#### CompletedHabitsToday (`components/CompletedHabitsToday.tsx`)
- Shows today's completed habits with timestamps
- Real-time refresh functionality
- Empty state handling

#### AuthGuard (`components/AuthGuard.tsx`)
- Authentication wrapper component
- Redirects to login when user not authenticated
- Manages loading states during auth checks

### Navigation Structure
- **Root Stack Navigator** with AuthGuard protection
  - **Authentication Stack** (`app/auth/`) - Unauthenticated users
    - Login (`login.tsx`)
    - Register (`register.tsx`) 
    - Forgot Password (`forgot-password.tsx`)
  - **Main Tab Navigator** (authenticated users only)
    - Habits Tab (`index.tsx`) - Primary interface with HabitList component
    - Settings Tab (`settings.tsx`) - User profile and app configuration
  - **Modal Screens**
    - Chat Coach (`chat-coach.tsx`) - AI coaching interface
    - AddOptionsModal - Central action modal
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

## Development Configuration

### TypeScript Configuration
- Extends `expo/tsconfig.base`
- Strict mode enabled for better type safety
- Path alias: `@/*` maps to root directory

### ESLint Configuration
- Uses `eslint-config-expo/flat` configuration
- Ignores `dist/*` directory
- Run via `npm run lint`

### Key Development Patterns
- **Platform Detection**: Use `Platform.OS === 'web'` for web-specific behavior
- **Dialog Pattern**: `Platform.OS === 'web' ? window.confirm() : Alert.alert()`
- **Firebase Version**: Use firebase-tools v13.15.4 for Node.js 18 compatibility
- **User Interface**: Primarily German language - maintain consistency

## Recent Changes & Major Features (Aug 2025)

### ✅ Completed Features

#### 1. **AI Chat Coach Integration**
- **New Feature**: AI-powered chat interface for habit coaching
- **Key Files**: `app/chat-coach.tsx`, `chatCoachService.ts`
- **Features**: Personalized responses based on user's habits, German language support, contextual advice
- **Integration**: Accessible via AddOptionsModal and custom tab bar

#### 2. **Enhanced User Interface**
- **AddOptionsModal**: Central modal for choosing between adding habits or starting chat
- **CompletedHabitsToday**: Shows today's completed habits with timestamps
- **HabitStreakModal**: Enhanced streak visualization (file present, integration TBD)
- **CustomTabBar**: Improved navigation with add button integration

#### 3. **Firebase Authentication System**
- **Full Auth Flow**: Registration, login, password reset, logout
- **User Scoping**: All habits now scoped to authenticated users
- **AuthContext**: Global authentication state management
- **AuthGuard**: Automatic redirect to login when not authenticated
- **Security Rules**: Firestore rules for data isolation (`firestore.rules`)

#### 4. **Architecture Improvements**
- **Config Refactoring**: Firebase config moved to `config/firebase.ts`
- **Service Layer**: Enhanced habitService with user scoping
- **Platform Compatibility**: Consistent web/mobile dialog handling

### 🔧 Technical Improvements

#### Platform Compatibility Patterns
- **Dialog Pattern**: `Platform.OS === 'web' ? window.confirm() : Alert.alert()`
- **Navigation**: Proper stack/tab navigation with authentication flow
- **State Management**: AuthContext with proper loading states

#### Firebase Integration
- **Security**: Firestore rules for user data isolation
- **Deployment**: NPM scripts for deploying rules and indexes
- **Authentication**: Complete auth flow with error handling

### ⚠️ Current State & Next Steps

#### ✅ Working Features
- Complete habit CRUD operations with user scoping
- Firebase Authentication (register, login, logout)
- AI Chat Coach with contextual responses
- Cross-platform compatibility (web, iOS, Android)
- Enhanced UI with modal-based workflows

#### 📋 Outstanding Tasks
- **Security Rules Deployment**: Run `npm run firebase:rules` to enforce data isolation
- **Email Configuration**: Set up Firebase email service for password reset
- **Data Migration**: Migrate existing habits to include userId field
- **Cross-Platform Testing**: Test authentication on iOS/Android
- **HabitStreakModal Integration**: Complete implementation of streak modal

#### 🚨 Development Guidelines & Patterns
- **Firebase CLI Version**: Use v13.15.4 for Node.js 18 compatibility
- **Platform Dialogs**: Always check platform before using Alert components
- **Authentication State**: Use AuthGuard for protected routes
- **German UI**: Interface primarily in German - maintain language consistency
- **Data Scoping**: All operations must respect user authentication and data isolation
- **Cross-Platform**: Test changes on web primarily, but consider mobile implications
- **Component Patterns**: Follow existing modal and dialog patterns for consistency