// === Habit Statistics Chart Component ===
// Zweck: Zeigt schöne Charts für Habit-Verlauf und Statistiken
// Features: Line Chart für Streak, Bar Chart für wöchentliche Übersicht

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { habitService, HabitCompletion } from '../habitService';

interface HabitChartProps {
  habitId: string;
  habitName: string;
}

export const HabitChart: React.FC<HabitChartProps> = ({ habitId, habitName }) => {
  const colorScheme = useColorScheme();
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    loadHabitData();
  }, [habitId]);

  const loadHabitData = async () => {
    try {
      setIsLoading(true);
      const habitCompletions = await habitService.getHabitCompletions(habitId);
      setCompletions(habitCompletions);
    } catch (error) {
      console.error('Error loading habit data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generiere Daten für die letzten 30 Tage
  const generateLast30DaysData = () => {
    const today = new Date();
    const last30Days = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const dateStr = date.toDateString();
      const isCompleted = completions.some(completion => {
        // Handle different Firebase timestamp formats
        let completionDate: Date;
        if (completion.completedAt instanceof Date) {
          completionDate = completion.completedAt;
        } else if (completion.completedAt?.seconds) {
          completionDate = new Date(completion.completedAt.seconds * 1000);
        } else if (completion.completedAt?.toDate) {
          completionDate = completion.completedAt.toDate();
        } else {
          completionDate = new Date(completion.completedAt);
        }
        return completionDate.toDateString() === dateStr;
      });
      
      last30Days.push({
        date: date,
        completed: isCompleted ? 1 : 0,
        label: date.getDate().toString()
      });
    }
    
    return last30Days;
  };

  // Generiere Daten für die letzten 12 Wochen
  const generateWeeklyData = () => {
    const today = new Date();
    const weeks = [];
    
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (i * 7) - today.getDay());
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekCompletions = completions.filter(completion => {
        // Handle different Firebase timestamp formats
        let completionDate: Date;
        if (completion.completedAt instanceof Date) {
          completionDate = completion.completedAt;
        } else if (completion.completedAt?.seconds) {
          completionDate = new Date(completion.completedAt.seconds * 1000);
        } else if (completion.completedAt?.toDate) {
          completionDate = completion.completedAt.toDate();
        } else {
          completionDate = new Date(completion.completedAt);
        }
        return completionDate >= weekStart && completionDate <= weekEnd;
      });
      
      weeks.push({
        week: `W${52 - i}`,
        completions: weekCompletions.length,
        percentage: Math.round((weekCompletions.length / 7) * 100)
      });
    }
    
    return weeks;
  };

  const dailyData = generateLast30DaysData();
  const weeklyData = generateWeeklyData();

  const chartConfig = {
    backgroundColor: Colors[colorScheme ?? 'light'].background,
    backgroundGradientFrom: Colors[colorScheme ?? 'light'].background,
    backgroundGradientTo: Colors[colorScheme ?? 'light'].background,
    decimalPlaces: 0,
    color: (opacity = 1) => Colors[colorScheme ?? 'light'].tint + Math.round(opacity * 255).toString(16).padStart(2, '0'),
    labelColor: (opacity = 1) => Colors[colorScheme ?? 'light'].text + Math.round(opacity * 255).toString(16).padStart(2, '0'),
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: Colors[colorScheme ?? 'light'].tint
    },
    propsForLabels: {
      fontSize: 10
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.loadingText}>Lade Statistiken...</ThemedText>
      </ThemedView>
    );
  }

  const currentStreak = completions.length > 0 ? 
    habitService.getHabitStreak(habitId) : Promise.resolve(0);

  const totalCompletions = completions.length;
  const last7DaysCompletions = dailyData.slice(-7).reduce((sum, day) => sum + day.completed, 0);
  const completionRate = dailyData.length > 0 ? 
    Math.round((dailyData.reduce((sum, day) => sum + day.completed, 0) / dailyData.length) * 100) : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.habitName}>{habitName}</ThemedText>
        <ThemedText style={styles.subtitle}>Statistiken & Verlauf</ThemedText>
      </ThemedView>

      {/* Statistik Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#E8F4FD' }]}>
          <ThemedText style={styles.statNumber}>{totalCompletions}</ThemedText>
          <ThemedText style={styles.statLabel}>Gesamt</ThemedText>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: '#E8F8F5' }]}>
          <ThemedText style={styles.statNumber}>{last7DaysCompletions}/7</ThemedText>
          <ThemedText style={styles.statLabel}>Diese Woche</ThemedText>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: '#FEF3E2' }]}>
          <ThemedText style={styles.statNumber}>{completionRate}%</ThemedText>
          <ThemedText style={styles.statLabel}>Erfolgsrate</ThemedText>
        </View>
      </View>

      {/* Line Chart - Letzte 30 Tage */}
      {dailyData.some(day => day.completed > 0) && (
        <ThemedView style={styles.chartContainer}>
          <ThemedText type="subtitle" style={styles.chartTitle}>
            Verlauf (30 Tage)
          </ThemedText>
          <LineChart
            data={{
              labels: dailyData.filter((_, index) => index % 5 === 0).map(day => day.label),
              datasets: [{
                data: dailyData.map(day => day.completed),
                color: (opacity = 1) => Colors[colorScheme ?? 'light'].tint,
                strokeWidth: 3
              }]
            }}
            width={screenWidth - 60}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            fromZero={true}
            segments={1}
          />
        </ThemedView>
      )}

      {/* Bar Chart - Wöchentliche Übersicht */}
      {weeklyData.some(week => week.completions > 0) && (
        <ThemedView style={styles.chartContainer}>
          <ThemedText type="subtitle" style={styles.chartTitle}>
            Wöchentliche Übersicht
          </ThemedText>
          <BarChart
            data={{
              labels: weeklyData.slice(-8).map(week => week.week),
              datasets: [{
                data: weeklyData.slice(-8).map(week => week.completions)
              }]
            }}
            width={screenWidth - 60}
            height={220}
            chartConfig={{
              ...chartConfig,
              barPercentage: 0.7,
            }}
            style={styles.chart}
            verticalLabelRotation={0}
            withInnerLines={false}
            fromZero={true}
            showValuesOnTopOfBars={true}
          />
          <ThemedText style={styles.chartSubtitle}>
            Anzahl abgeschlossener Tage pro Woche
          </ThemedText>
        </ThemedView>
      )}

      {/* Motivational Message */}
      <ThemedView style={styles.motivationContainer}>
        {completionRate >= 80 ? (
          <>
            <ThemedText style={styles.motivationEmoji}>🔥</ThemedText>
            <ThemedText style={styles.motivationText}>
              Fantastisch! Du bist auf dem besten Weg!
            </ThemedText>
          </>
        ) : completionRate >= 50 ? (
          <>
            <ThemedText style={styles.motivationEmoji}>💪</ThemedText>
            <ThemedText style={styles.motivationText}>
              Guter Fortschritt! Bleib dran!
            </ThemedText>
          </>
        ) : (
          <>
            <ThemedText style={styles.motivationEmoji}>🌱</ThemedText>
            <ThemedText style={styles.motivationText}>
              Jeder Anfang ist schwer. Du schaffst das!
            </ThemedText>
          </>
        )}
      </ThemedView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  habitName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 50,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  chartContainer: {
    marginBottom: 30,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  chartSubtitle: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 8,
  },
  motivationContainer: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    marginBottom: 20,
  },
  motivationEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    color: '#333',
  },
});