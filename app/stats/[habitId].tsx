// === Habit Detail Statistik Screen ===
// Zweck: Detaillierte Statistik für einzelne Gewohnheiten
// Features: Kalenderansicht, Streak-Historie, Fortschrittsgraphen

import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useHabitStore } from '@/stores/habitStore';
import { Card } from '@/components/ui/Card';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  VictoryChart,
  VictoryAxis,
  VictoryTheme,
  VictoryArea,
  VictoryScatter,
} from 'victory-native';
import Svg, { Defs, LinearGradient, Stop } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');

export default function HabitDetailStatsScreen() {
  const { habitId } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const isDark = colorScheme === 'dark';
  
  const { habits, getHabitCompletionDates } = useHabitStore();
  const habit = habits.find(h => h.id === habitId);
  
  const [loading, setLoading] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalCompletions, setTotalCompletions] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [monthlyData, setMonthlyData] = useState<{ x: number; y: number }[]>([]);
  const [calendarData, setCalendarData] = useState<{ [key: string]: boolean }>({});
  
  useEffect(() => {
    if (habit) {
      loadHabitStatistics();
    }
  }, [habit, habitId]);
  
  const loadHabitStatistics = async () => {
    if (!habit) return;
    
    setLoading(true);
    
    try {
      // Lade Completions für die letzten 90 Tage
      const calendarMap = await getHabitCompletionDates(habit.id!, 90);
      setCalendarData(calendarMap);
      
      // Process calendar data for statistics
      const today = new Date();
      let currentStreakCount = 0;
      let maxStreak = 0;
      let tempStreak = 0;
      let completedDays = 0;
      let hasGapForCurrentStreak = false;
      
      // Process days from newest to oldest for streak calculation
      for (let i = 0; i < 90; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const completed = calendarMap[dateStr] || false;
        
        if (completed) {
          completedDays++;
          
          if (!hasGapForCurrentStreak) {
            currentStreakCount++;
          }
          
          tempStreak++;
          maxStreak = Math.max(maxStreak, tempStreak);
        } else {
          hasGapForCurrentStreak = true;
          tempStreak = 0;
        }
      }
      
      setCurrentStreak(currentStreakCount);
      setLongestStreak(maxStreak);
      setTotalCompletions(completedDays);
      setCompletionRate(Math.round((completedDays / 90) * 100));
      
      // Calculate 30-day trend data
      const monthData = [];
      const monthCalendarData = await getHabitCompletionDates(habit.id!, 30);
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const completed = monthCalendarData[dateStr] ? 100 : 0;
        
        monthData.push({
          x: 30 - i,
          y: completed,
        });
      }
      
      setMonthlyData(monthData);
    } catch (error) {
      console.error('Error loading habit statistics:', error);
      // Set default values on error
      setCalendarData({});
      setCurrentStreak(0);
      setLongestStreak(0);
      setTotalCompletions(0);
      setCompletionRate(0);
      setMonthlyData([]);
    } finally {
      setLoading(false);
    }
  };
  
  if (!habit) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#999" />
          <ThemedText style={styles.errorText}>Gewohnheit nicht gefunden</ThemedText>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: tintColor }]}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>Zurück</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }
  
  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tintColor} />
        <ThemedText style={styles.loadingText}>Lade Statistiken...</ThemedText>
      </ThemedView>
    );
  }
  
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F7F8F9' }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <ThemedView style={styles.header}>
        <TouchableOpacity
          style={styles.backArrow}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={isDark ? 'white' : 'black'} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <ThemedText type="title" style={styles.title}>{habit.name}</ThemedText>
          {habit.description && (
            <ThemedText style={styles.subtitle}>{habit.description}</ThemedText>
          )}
        </View>
      </ThemedView>
      
      {/* Statistik-Karten */}
      <View style={styles.statsGrid}>
        <Card style={[styles.statCard, { backgroundColor: isDark ? '#1F2937' : 'white' }]}>
          <MaterialIcons name="local-fire-department" size={32} color="#FFB800" />
          <ThemedText style={styles.statValue}>{currentStreak}</ThemedText>
          <ThemedText style={styles.statLabel}>Aktuelle Serie</ThemedText>
        </Card>
        
        <Card style={[styles.statCard, { backgroundColor: isDark ? '#1F2937' : 'white' }]}>
          <MaterialIcons name="emoji-events" size={32} color="#FF6347" />
          <ThemedText style={styles.statValue}>{longestStreak}</ThemedText>
          <ThemedText style={styles.statLabel}>Längste Serie</ThemedText>
        </Card>
        
        <Card style={[styles.statCard, { backgroundColor: isDark ? '#1F2937' : 'white' }]}>
          <MaterialIcons name="check-circle" size={32} color={tintColor} />
          <ThemedText style={styles.statValue}>{totalCompletions}</ThemedText>
          <ThemedText style={styles.statLabel}>Tage erledigt</ThemedText>
        </Card>
        
        <Card style={[styles.statCard, { backgroundColor: isDark ? '#1F2937' : 'white' }]}>
          <MaterialIcons name="percent" size={32} color="#9333EA" />
          <ThemedText style={styles.statValue}>{completionRate}%</ThemedText>
          <ThemedText style={styles.statLabel}>Erfolgsrate</ThemedText>
        </Card>
      </View>
      
      {/* Kalender-Ansicht */}
      <Card style={[styles.calendarCard, { backgroundColor: isDark ? '#1F2937' : 'white' }]}>
        <ThemedText style={styles.sectionTitle}>Letzte 90 Tage</ThemedText>
        <View style={styles.calendarContainer}>
          <View style={styles.calendarGrid}>
            {Array.from({ length: 90 }).map((_, index) => {
              const date = new Date();
              date.setDate(date.getDate() - (89 - index));
              const dateStr = date.toISOString().split('T')[0];
              const isCompleted = calendarData[dateStr];
              
              return (
                <View
                  key={dateStr}
                  style={[
                    styles.calendarCell,
                    isCompleted && { backgroundColor: `${tintColor}20` },
                  ]}
                >
                  {isCompleted && (
                    <View style={[styles.calendarDot, { backgroundColor: tintColor }]} />
                  )}
                </View>
              );
            })}
          </View>
        </View>
        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: `${tintColor}20` }]}>
              <View style={[styles.calendarDot, { backgroundColor: tintColor }]} />
            </View>
            <ThemedText style={styles.legendText}>Erledigt</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendDot} />
            <ThemedText style={styles.legendText}>Nicht erledigt</ThemedText>
          </View>
        </View>
      </Card>
      
      {/* Trend-Diagramm */}
      <Card style={[styles.chartCard, { backgroundColor: isDark ? '#1F2937' : 'white' }]}>
        <ThemedText style={styles.sectionTitle}>30-Tage Trend</ThemedText>
        <View style={styles.chartContainer}>
          <Svg>
            <Defs>
              <LinearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={tintColor} stopOpacity="0.3" />
                <Stop offset="100%" stopColor={tintColor} stopOpacity="0.05" />
              </LinearGradient>
            </Defs>
            <VictoryChart
              width={screenWidth - 72}
              height={200}
              padding={{ left: 45, right: 25, top: 20, bottom: 50 }}
              theme={VictoryTheme.material}
            >
              <VictoryAxis
                dependentAxis
                style={{
                  tickLabels: { fill: '#6B7280', fontSize: 11 },
                  grid: { stroke: '#E5E7EB', strokeWidth: 0.5 },
                  axis: { stroke: 'transparent' },
                }}
                tickFormat={(t) => `${t}%`}
              />
              <VictoryAxis
                style={{
                  tickLabels: { fill: '#6B7280', fontSize: 11 },
                  grid: { stroke: 'transparent' },
                  axis: { stroke: 'transparent' },
                }}
                tickFormat={(x) => x % 5 === 0 ? `${x}` : ''}
              />
              <VictoryArea
                data={monthlyData}
                style={{
                  data: {
                    fill: 'url(#gradient)',
                    stroke: tintColor,
                    strokeWidth: 2,
                  },
                }}
                interpolation="catmullRom"
                animate={{
                  duration: 1000,
                  onLoad: { duration: 500 }
                }}
              />
              <VictoryScatter
                data={monthlyData}
                size={3}
                style={{
                  data: {
                    fill: 'white',
                    stroke: tintColor,
                    strokeWidth: 2,
                  },
                }}
              />
            </VictoryChart>
          </Svg>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    opacity: 0.6,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginTop: 12,
    marginBottom: 24,
    opacity: 0.6,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: 'transparent',
  },
  backArrow: {
    marginRight: 16,
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
  calendarCard: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  calendarContainer: {
    marginVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  calendarCell: {
    width: (screenWidth - 72 - 18 * 2) / 18,
    height: (screenWidth - 72 - 18 * 2) / 18,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDot: {
    width: '60%',
    height: '60%',
    borderRadius: 2,
  },
  calendarDay: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    margin: 2,
  },
  calendarDayText: {
    fontSize: 12,
  },
  completedDayText: {
    color: 'white',
    fontWeight: '600',
  },
  todayHighlight: {
    borderWidth: 2,
    borderColor: '#FFB800',
  },
  calendarLegend: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendText: {
    fontSize: 12,
    opacity: 0.7,
  },
  chartCard: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  chartContainer: {
    alignItems: 'center',
    marginHorizontal: -10,
  },
});