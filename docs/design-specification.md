# Personal Coach - Design Specification

## Overview

Personal Coach is a React Native Expo habit tracking application focused on clean, accessible design with consistent cross-platform user experience. This specification defines the design system for maintaining visual consistency and providing implementation guidance.

## Design Philosophy

- **Clean & Minimal**: Focus on content with minimal visual noise
- **Accessible**: WCAG AA compliance with high contrast and clear hierarchy
- **Cross-Platform**: Consistent experience across iOS, Android, and Web
- **Theme-Aware**: Seamless light/dark mode with automatic switching
- **Touch-Friendly**: 44pt minimum touch targets with generous spacing

---

## 1. Color System

### Primary Colors
```typescript
// Brand Colors
Primary: {
  light: '#0a7ea4',  // Teal blue - main brand color
  dark: '#fff'       // White - inverted for dark mode
}

// Surface Colors
Background: {
  light: '#ffffff',  // Pure white
  dark: '#151718'    // Deep gray
}

Card Background: {
  light: '#f8f9fa',  // Light gray
  dark: '#1a1a1a'    // Darker gray
}
```

### Text Colors
```typescript
Text: {
  primary: {
    light: '#11181C',  // Near black
    dark: '#ECEDEE'    // Near white
  },
  secondary: {
    light: '#687076',  // Medium gray
    dark: '#9BA1A6'    // Light gray
  }
}
```

### Status Colors
```typescript
Success: '#4CAF50',    // Green for completed habits
Error: '#FF3B30',      // Red for errors and destructive actions
Warning: '#FF9500',    // Orange for warnings
Info: '#007AFF',       // Blue for informational content
```

### Interactive Colors
```typescript
// Tab Navigation
TabIcon: {
  default: '#8E8E93',  // Inactive tab gray
  selected: 'Primary'   // Active tab uses primary color
}

// Button States
Button: {
  primary: 'Primary',
  disabled: 'rgba(Primary, 0.6)',
  hover: 'rgba(Primary, 0.8)'  // Web only
}
```

---

## 2. Typography

### Font System
```typescript
// Font Family: System default (San Francisco on iOS, Roboto on Android)
FontFamily: {
  default: 'System',
  monospace: 'Monaco, Consolas' // For code/data display
}
```

### Type Scale
```typescript
Typography: {
  // Large Title - Page headers, main screens
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32
  },
  
  // Subtitle - Section headers, modal titles
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 24
  },
  
  // Body Text - Primary content
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 'normal'
  },
  
  // Semibold Body - Emphasized content
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600'
  },
  
  // Links - Interactive text
  link: {
    fontSize: 16,
    lineHeight: 30,
    color: 'Primary'
  },
  
  // Small Text - Secondary info, metadata
  small: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7
  },
  
  // Tab Labels - Navigation
  tabLabel: {
    fontSize: 11,
    fontWeight: 'normal'
  }
}
```

### Text Hierarchy Usage
- **title**: Screen headers, main page titles
- **subtitle**: Section headers, modal/dialog titles  
- **default**: Body text, form labels, descriptions
- **defaultSemiBold**: Habit names, emphasized content
- **link**: Clickable text, navigation links
- **small**: Streak counters, metadata, hints
- **tabLabel**: Bottom tab navigation

---

## 3. Spacing System

### Base Unit: 4px
```typescript
Spacing: {
  xs: 4,     // Minimal gaps, icon padding
  sm: 8,     // Button internal padding, small gaps
  md: 12,    // Standard element spacing
  lg: 16,    // Card padding, major element spacing
  xl: 20,    // Screen padding, large sections
  xxl: 24,   // Modal padding, major sections
  xxxl: 32   // Large section breaks, empty states
}
```

### Layout Patterns
```typescript
Layout: {
  screenPadding: 16,        // Standard screen edge padding
  cardPadding: 16,          // Internal card content padding
  modalPadding: 24,         // Modal/dialog content padding
  sectionSpacing: 20,       // Between major UI sections
  elementSpacing: 12,       // Between related elements
  inputSpacing: 16,         // Between form inputs
  buttonSpacing: 16         // Between buttons in groups
}
```

---

## 4. Component Standards

### Buttons

#### Primary Button (CTA, Submit)
```typescript
PrimaryButton: {
  backgroundColor: 'Primary',
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '600',
  padding: '16px 20px',      // 14-16pt vertical, 20pt horizontal
  borderRadius: 8,
  minHeight: 44,             // iOS touch target minimum
  elevation: 2,              // Android shadow
  shadowColor: '#000',       // iOS shadow
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4
}
```

#### Secondary Button (Cancel, Alternative)
```typescript
SecondaryButton: {
  backgroundColor: '#E5E5E5',
  borderWidth: 1,
  borderColor: '#D0D0D0',
  color: 'TextPrimary',
  // Other properties same as PrimaryButton
}
```

#### Floating Action Button (Add Habit)
```typescript
FAB: {
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: 'Primary',
  position: 'absolute',
  bottom: {
    ios: 35,
    android: 20
  },
  elevation: 8,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8
}
```

#### Icon Buttons (Edit, Delete, History)
```typescript
IconButton: {
  padding: 8,              // 44pt touch target with icon
  borderRadius: 4,
  minWidth: 44,
  minHeight: 44,
  justifyContent: 'center',
  alignItems: 'center'
}
```

### Form Elements

#### Text Input
```typescript
TextInput: {
  borderWidth: 1,
  borderColor: '#ddd',       // Error state: Error color
  borderRadius: 8,
  padding: 14,               // Comfortable text input padding
  fontSize: 16,
  minHeight: 44,
  backgroundColor: 'Background'
}

// Multi-line Input
TextArea: {
  // Inherits TextInput styles
  minHeight: 80,
  textAlignVertical: 'top'   // Android alignment
}
```

#### Input Labels
```typescript
InputLabel: {
  fontSize: 16,
  fontWeight: '600',
  marginBottom: 8,
  color: 'TextPrimary'
}
```

### Cards & Containers

#### Habit Item Card
```typescript
HabitCard: {
  backgroundColor: 'rgba(0,0,0,0.05)',  // Subtle background tint
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
  flexDirection: 'row',
  alignItems: 'center'
}
```

#### Modal Container
```typescript
Modal: {
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  content: {
    width: '100%',
    maxWidth: 400,           // Reasonable max width
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'Background',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10
  }
}
```

#### Card with Shadow
```typescript
ElevatedCard: {
  backgroundColor: 'Background',
  borderRadius: 12,
  padding: 24,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4
}
```

### Navigation

#### Tab Bar
```typescript
TabBar: {
  backgroundColor: '#FFFFFF',
  borderTopWidth: 0.5,
  borderTopColor: '#E5E5EA',
  paddingTop: 8,
  paddingBottom: {
    ios: 20,                 // Safe area handling
    android: 8
  },
  paddingHorizontal: 20,
  elevation: 8,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.1,
  shadowRadius: 8
}

TabItem: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 4,
  minHeight: 44              // Touch target
}
```

---

## 5. Interactive Elements

### Checkboxes (Habit Completion)
```typescript
Checkbox: {
  width: 28,
  height: 28,
  borderWidth: 2,
  borderRadius: 14,          // Circular
  borderColor: 'TextPrimary',
  justifyContent: 'center',
  alignItems: 'center'
}

CheckboxCompleted: {
  backgroundColor: 'Success',
  borderColor: 'Success'
}

Checkmark: {
  color: '#FFFFFF',
  fontWeight: 'bold',
  fontSize: 16
}
```

### Loading States
```typescript
LoadingSpinner: {
  size: 'small',             // iOS: small, large
  color: 'Primary'
}

LoadingButton: {
  // Inherits button styles
  opacity: 0.6
}
```

---

## 6. Visual Hierarchy

### Elevation System (Z-Index)
```typescript
Elevation: {
  fab: 8,                    // Floating action button
  modal: 10,                 // Modals and overlays
  toast: 12,                 // Toast notifications
  dropdown: 15,              // Dropdown menus
  tooltip: 20                // Tooltips and popovers
}
```

### Shadow Definitions
```typescript
Shadow: {
  // Light shadow for cards
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  
  // Medium shadow for buttons
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4
  },
  
  // Strong shadow for floating elements
  strong: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8
  }
}
```

### Border Radius Scale
```typescript
BorderRadius: {
  sm: 4,     // Small elements, tight corners
  md: 8,     // Buttons, inputs, standard elements
  lg: 12,    // Cards, larger containers
  xl: 16,    // Modals, major containers
  xxl: 28,   // FAB and circular elements
  full: 9999 // Pills, badges, fully rounded
}
```

---

## 7. Platform Considerations

### iOS Specific
```typescript
iOS: {
  statusBarHeight: 44,       // Standard status bar
  safeAreaBottom: 20,        // Home indicator area
  tabBarHeight: 49,          // Standard tab bar
  navigationBarHeight: 44    // Standard navigation bar
}
```

### Android Specific
```typescript
Android: {
  statusBarHeight: 24,       // Standard status bar
  navigationBarHeight: 48,   // Standard navigation bar
  elevation: true,           // Use elevation instead of shadow
  rippleEffect: true         // Material Design ripple
}
```

### Web Specific
```typescript
Web: {
  cursor: 'pointer',         // Clickable elements
  hover: true,               // Support hover states
  focus: {                   // Keyboard navigation
    outline: '2px solid Primary',
    outlineOffset: 2
  }
}
```

---

## 8. Accessibility Standards

### Touch Targets
- **Minimum**: 44pt × 44pt (iOS Human Interface Guidelines)
- **Recommended**: 48dp × 48dp (Material Design)
- **Spacing**: 8pt minimum between interactive elements

### Color Contrast
- **Normal Text**: 4.5:1 minimum ratio (WCAG AA)
- **Large Text**: 3:1 minimum ratio
- **Interactive Elements**: 3:1 minimum ratio

### Focus Management
```typescript
Focus: {
  outline: '2px solid Primary',
  outlineOffset: 2,
  borderRadius: 'inherit'
}
```

### Screen Reader Support
- All interactive elements have `accessibilityLabel`
- Form inputs have `accessibilityHint`
- State changes announced with `accessibilityLiveRegion`

---

## 9. Animation & Transitions

### Standard Timings
```typescript
Animation: {
  fast: 150,        // Micro-interactions, hovers
  standard: 250,    // Modal appearances, screen transitions
  slow: 400,        // Complex animations, page transitions
  
  easing: {
    standard: 'ease-out',      // Default easing
    accelerate: 'ease-in',     // Exiting elements
    decelerate: 'ease-out'     // Entering elements
  }
}
```

### Modal Transitions
- **Entry**: `slide` from bottom with fade overlay
- **Exit**: Reverse slide with overlay fade
- **Duration**: 250ms with ease-out

---

## 10. Implementation Guidelines

### Component Creation Checklist
- [ ] Uses ThemedView/ThemedText for automatic theme switching
- [ ] Implements proper TypeScript interfaces
- [ ] Follows spacing system (4px base unit)
- [ ] Meets minimum touch target sizes (44pt)
- [ ] Includes accessibility labels and hints
- [ ] Handles loading and error states
- [ ] Supports both light and dark themes
- [ ] Uses design system colors (no hardcoded colors)

### Code Patterns
```typescript
// Correct: Using theme colors
const backgroundColor = useThemeColor({}, 'background');
const primaryColor = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'tint');

// Correct: Consistent spacing
const styles = StyleSheet.create({
  container: {
    padding: 16,        // Standard screen padding
    marginBottom: 12,   // Standard element spacing
  }
});

// Correct: Accessibility
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Mark habit as complete"
  accessibilityHint="Double tap to toggle completion status"
>
```

### File Organization
```
components/
├── ui/              # Base UI components
├── ThemedText.tsx   # Theme-aware text
├── ThemedView.tsx   # Theme-aware containers
└── HabitList.tsx    # Feature components

constants/
└── Colors.ts        # Color system definition
```

---

## 11. Future Considerations

### Planned Enhancements
- **Haptic Feedback**: Success vibrations on habit completion
- **Gradient Support**: Subtle gradients for premium features
- **Dark Mode Improvements**: True black theme option
- **Customization**: User-selectable accent colors
- **Responsive Design**: Tablet and desktop optimizations

### Component Extensions
- Toast/Notification system
- Progressive disclosure patterns
- Empty state illustrations
- Onboarding overlays
- Achievement celebration animations

---

## Summary

This design specification provides the foundation for consistent, accessible design across Personal Coach. All new components should follow these patterns, and existing components should be gradually updated to align with this system.

**Key Principles**:
1. **Consistency**: Use design tokens, not hardcoded values
2. **Accessibility**: 44pt touch targets, proper contrast, screen reader support
3. **Responsiveness**: Theme-aware, cross-platform compatibility
4. **Simplicity**: Clean design focused on habit tracking functionality
5. **User Experience**: Intuitive interactions with clear feedback

For implementation questions or design system updates, refer to this document as the source of truth for Personal Coach's visual design.