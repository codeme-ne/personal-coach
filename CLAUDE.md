# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native Expo application called "Personal Coach" - a habit tracking application that currently provides todo list functionality with Firebase Firestore backend. The app is being developed to help users track daily habits and build consistent routines.

### Project Scope
- Add daily habits to track
- Track habits for each day
- View habit history
- See streaks for habits
- Edit/delete habits

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

#### Todo Service (`todoService.ts`)
- CRUD operations for todos in Firestore
- Collection: `todos`
- Methods: `addTodo()`, `getTodos()`, `toggleTodo()`, `deleteTodo()`
- German error messages in console logs

### Navigation Structure
- Stack Navigator (root)
  - Tab Navigator
    - Home Tab (`index.tsx`) - Contains TodoList component
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