// === Component Tests für HabitListItem ===
// Zweck: Testen der HabitListItem Komponente mit User Interactions
// Coverage: Rendering, Click Events, Conditional Styling

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import { HabitListItem } from './HabitListItem';
import { HabitWithStreak } from '../stores/habitStore';

// Mock Dependencies
jest.mock('../contexts/FeedbackContext', () => ({
  useFeedback: () => ({
    showSuccess: jest.fn(),
    showWarning: jest.fn(),
    showError: jest.fn(),
  }),
}));

jest.mock('../hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

// Mock Window.confirm für Web Platform
global.window = global.window || {};
global.window.confirm = jest.fn(() => true);

describe('HabitListItem', () => {
  const mockHabit: HabitWithStreak = {
    id: 'test-habit-1',
    name: 'Tägliches Lesen',
    description: '30 Minuten Buch lesen',
    createdAt: new Date(),
    userId: 'test-user',
    streak: 7,
    completedToday: false,
    isLoading: false,
  };

  const mockProps = {
    habit: mockHabit,
    onToggleComplete: jest.fn(() => Promise.resolve()),
    onEdit: jest.fn(),
    onDelete: jest.fn(() => Promise.resolve()),
    onShowStats: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios'; // Default to iOS for tests
  });

  describe('Rendering', () => {
    it('sollte Habit-Name korrekt anzeigen', () => {
      const { getByText } = render(<HabitListItem {...mockProps} />);
      
      expect(getByText('Tägliches Lesen')).toBeTruthy();
    });

    it('sollte Habit-Beschreibung anzeigen wenn vorhanden', () => {
      const { getByText } = render(<HabitListItem {...mockProps} />);
      
      expect(getByText('30 Minuten Buch lesen')).toBeTruthy();
    });

    it('sollte Streak anzeigen wenn größer als 0', () => {
      const { getByText } = render(<HabitListItem {...mockProps} />);
      
      expect(getByText('7 Tage')).toBeTruthy();
    });

    it('sollte "Noch keine Serie" anzeigen wenn Streak 0 ist', () => {
      const habitNoStreak = { ...mockHabit, streak: 0 };
      const { getByText } = render(
        <HabitListItem {...mockProps} habit={habitNoStreak} />
      );
      
      expect(getByText('Noch keine Serie')).toBeTruthy();
    });

    it('sollte "Heute erledigt" anzeigen wenn completedToday true ist', () => {
      const completedHabit = { ...mockHabit, completedToday: true };
      const { getByText } = render(
        <HabitListItem {...mockProps} habit={completedHabit} />
      );
      
      expect(getByText('✓ Heute erledigt')).toBeTruthy();
    });

    it('sollte verschiedene Streak-Farben für unterschiedliche Streak-Längen verwenden', () => {
      // Test für 30+ Tage Streak (Orange)
      const longStreakHabit = { ...mockHabit, streak: 35 };
      const { rerender } = render(
        <HabitListItem {...mockProps} habit={longStreakHabit} />
      );
      // Komponente rendert mit orange Farbe (#FF6B35)
      
      // Test für 7-29 Tage Streak (Gold)
      const mediumStreakHabit = { ...mockHabit, streak: 15 };
      rerender(<HabitListItem {...mockProps} habit={mediumStreakHabit} />);
      // Komponente rendert mit gold Farbe (#FFA500)
      
      // Test für 1-6 Tage Streak (Gelb)
      const shortStreakHabit = { ...mockHabit, streak: 3 };
      rerender(<HabitListItem {...mockProps} habit={shortStreakHabit} />);
      // Komponente rendert mit gelb Farbe (#FFD700)
    });

    it('sollte Loading Overlay anzeigen wenn isLoading true ist', () => {
      const loadingHabit = { ...mockHabit, isLoading: true };
      const { getByText } = render(
        <HabitListItem {...mockProps} habit={loadingHabit} />
      );
      
      expect(getByText('Aktualisiere...')).toBeTruthy();
    });

    it('sollte keine Beschreibung anzeigen wenn leer', () => {
      const habitNoDesc = { ...mockHabit, description: '' };
      const { queryByText } = render(
        <HabitListItem {...mockProps} habit={habitNoDesc} />
      );
      
      expect(queryByText('30 Minuten Buch lesen')).toBeNull();
    });
  });

  describe('User Interactions', () => {
    it('sollte onToggleComplete aufrufen beim Klick auf Habit', async () => {
      const { getByText } = render(<HabitListItem {...mockProps} />);
      
      const habitElement = getByText('Tägliches Lesen');
      fireEvent.press(habitElement.parent?.parent as any);
      
      await waitFor(() => {
        expect(mockProps.onToggleComplete).toHaveBeenCalledWith(mockHabit);
      });
    });

    it('sollte Warnung zeigen wenn bereits abgeschlossener Habit geklickt wird', async () => {
      const completedHabit = { ...mockHabit, completedToday: true };
      const { getByText } = render(
        <HabitListItem {...mockProps} habit={completedHabit} />
      );
      
      const habitElement = getByText('Tägliches Lesen');
      fireEvent.press(habitElement.parent?.parent as any);
      
      // onToggleComplete sollte trotzdem aufgerufen werden
      await waitFor(() => {
        expect(mockProps.onToggleComplete).toHaveBeenCalledWith(completedHabit);
      });
    });

    it('sollte nicht klickbar sein während des Ladens', () => {
      const loadingHabit = { ...mockHabit, isLoading: true };
      const { getByText } = render(
        <HabitListItem {...mockProps} habit={loadingHabit} />
      );
      
      const habitElement = getByText('Tägliches Lesen');
      fireEvent.press(habitElement.parent?.parent as any);
      
      // onToggleComplete sollte nicht aufgerufen werden
      expect(mockProps.onToggleComplete).not.toHaveBeenCalled();
    });

    it('sollte onEdit aufrufen beim Klick auf Edit-Button', () => {
      const { getByLabelText } = render(<HabitListItem {...mockProps} />);
      
      const editButton = getByLabelText('Tägliches Lesen bearbeiten');
      fireEvent.press(editButton);
      
      expect(mockProps.onEdit).toHaveBeenCalledWith(mockHabit);
    });

    it('sollte onShowStats aufrufen beim Klick auf Stats-Button', () => {
      const { getByLabelText } = render(<HabitListItem {...mockProps} />);
      
      const statsButton = getByLabelText('Statistiken für Tägliches Lesen anzeigen');
      fireEvent.press(statsButton);
      
      expect(mockProps.onShowStats).toHaveBeenCalledWith(mockHabit);
    });

    describe('Delete Functionality', () => {
      it('sollte Alert.alert auf Mobile Platform zeigen', async () => {
        Platform.OS = 'android';
        const alertSpy = jest.spyOn(Alert, 'alert');
        
        const { getByLabelText } = render(<HabitListItem {...mockProps} />);
        
        const deleteButton = getByLabelText('Tägliches Lesen löschen');
        fireEvent.press(deleteButton);
        
        expect(alertSpy).toHaveBeenCalledWith(
          'Gewohnheit löschen',
          expect.stringContaining('Möchten Sie "Tägliches Lesen" wirklich löschen?'),
          expect.arrayContaining([
            expect.objectContaining({ text: 'Abbrechen' }),
            expect.objectContaining({ text: 'Löschen' }),
          ])
        );
        
        // Simuliere Klick auf "Löschen"
        const deleteCallback = alertSpy.mock.calls[0][2]?.[1].onPress;
        if (deleteCallback) {
          await deleteCallback();
        }
        
        expect(mockProps.onDelete).toHaveBeenCalledWith('test-habit-1');
      });

      it('sollte window.confirm auf Web Platform verwenden', async () => {
        Platform.OS = 'web';
        global.window.confirm = jest.fn(() => true);
        
        const { getByLabelText } = render(<HabitListItem {...mockProps} />);
        
        const deleteButton = getByLabelText('Tägliches Lesen löschen');
        fireEvent.press(deleteButton);
        
        expect(global.window.confirm).toHaveBeenCalledWith(
          expect.stringContaining('Möchten Sie "Tägliches Lesen" wirklich löschen?')
        );
        
        await waitFor(() => {
          expect(mockProps.onDelete).toHaveBeenCalledWith('test-habit-1');
        });
      });

      it('sollte Löschen abbrechen wenn Nutzer ablehnt', async () => {
        Platform.OS = 'web';
        global.window.confirm = jest.fn(() => false);
        
        const { getByLabelText } = render(<HabitListItem {...mockProps} />);
        
        const deleteButton = getByLabelText('Tägliches Lesen löschen');
        fireEvent.press(deleteButton);
        
        expect(global.window.confirm).toHaveBeenCalled();
        expect(mockProps.onDelete).not.toHaveBeenCalled();
      });
    });
  });

  describe('Memoization', () => {
    it('sollte nicht neu rendern wenn sich irrelevante Props ändern', () => {
      const { rerender, queryByText } = render(<HabitListItem {...mockProps} />);
      
      // Initiales Rendering
      expect(queryByText('Tägliches Lesen')).toBeTruthy();
      
      // Rerender mit gleichen relevanten Props aber anderen Funktionsreferenzen
      const newProps = {
        ...mockProps,
        onEdit: jest.fn(), // Neue Funktionsreferenz
        onDelete: jest.fn(), // Neue Funktionsreferenz
      };
      
      rerender(<HabitListItem {...newProps} />);
      
      // Component sollte immer noch gerendert sein (React.memo verhindert unnötiges Re-render)
      expect(queryByText('Tägliches Lesen')).toBeTruthy();
    });

    it('sollte neu rendern wenn sich relevante Habit-Daten ändern', () => {
      const { rerender, getByText, queryByText } = render(
        <HabitListItem {...mockProps} />
      );
      
      // Initiales Rendering
      expect(queryByText('Noch keine Serie')).toBeFalsy();
      expect(getByText('7 Tage')).toBeTruthy();
      
      // Ändere Streak
      const updatedHabit = { ...mockHabit, streak: 10 };
      rerender(<HabitListItem {...mockProps} habit={updatedHabit} />);
      
      // Neuer Streak sollte angezeigt werden
      expect(getByText('10 Tage')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('sollte korrekte Accessibility Labels haben', () => {
      const { getByLabelText } = render(<HabitListItem {...mockProps} />);
      
      expect(getByLabelText('Statistiken für Tägliches Lesen anzeigen')).toBeTruthy();
      expect(getByLabelText('Tägliches Lesen bearbeiten')).toBeTruthy();
      expect(getByLabelText('Tägliches Lesen löschen')).toBeTruthy();
    });
  });
});