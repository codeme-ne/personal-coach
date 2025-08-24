// === Statistik Screen mit Victory Charts ===
// Zweck: Übersicht über Habit-Fortschritte mit modernen Charts
// Features: Victory Native Charts, shadcn-ui Design, Reaktive Updates

import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  RefreshControl,
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
import { router } from 'expo-router';
import {
  VictoryChart,
  VictoryBar,
  VictoryArea,
  VictoryAxis,
  VictoryTheme,
  VictoryScatter,
} from 'victory-native';
import Svg, { Defs, LinearGradient, Stop } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 52; // Padding berücksichtigen

export default function StatsScreen() {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const isDark = colorScheme === 'dark';
  
  // Store hooks - Reactive Updates
  const { 
    habits, 
    getCompletedHabitsCount, 
    getProgressPercentage,
    getHabitsWithStreaks,
    todayCompletions,
    isLoading,
    refreshAll,
    getCompletedHabitsPerDay,
    getDailySuccessRate,
  } = useHabitStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [weeklyData, setWeeklyData] = useState<{ x: string; y: number }[]>([]);
  const [monthlyProgress, setMonthlyProgress] = useState<{ x: number; y: number }[]>([]);
  
  const updateStatistics = useCallback(async () => {
    // Fetch real data from store
    try {
      // Wöchentliche Daten für Balkendiagramm
      const weekData = await getCompletedHabitsPerDay();
      setWeeklyData(weekData);
      
      // Monatliche Fortschrittsdaten für Liniendiagramm
      const monthData = await getDailySuccessRate();
      setMonthlyProgress(monthData);
    } catch (error) {
      console.error('Error updating statistics:', error);
      // Set empty data on error
      setWeeklyData([]);
      setMonthlyProgress([]);
    }
  }, [getCompletedHabitsPerDay, getDailySuccessRate]);

  // Reaktive Updates bei Store-Änderungen
  useEffect(() => {
    console.log('Stats: Store data changed, updating statistics...');
    console.log('Stats: habits count:', habits.length, 'todayCompletions count:', todayCompletions.length);
    updateStatistics();
  }, [habits, todayCompletions, updateStatistics]);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    await updateStatistics();
    setRefreshing(false);
  };
  
  const navigateToHabitDetail = (habitId: string) => {
    router.push(`/stats/${habitId}`);
  };
  
  // Aktuelle Statistiken
  const completedToday = getCompletedHabitsCount();
  const progressPercentage = getProgressPercentage();
  const habitsWithStreaks = getHabitsWithStreaks();
  const activeStreaks = habitsWithStreaks.filter(h => h.streak > 0).length;
  const longestStreak = habitsWithStreaks.length > 0 
    ? Math.max(...habitsWithStreaks.map(h => h.streak))
    : 0;
  
  // Chart Styles
  const chartTheme = {
    axis: {
      style: {
        tickLabels: {
          fill: isDark ? '#9CA3AF' : '#6B7280',
          fontSize: 11,
          fontFamily: 'System',
        },
        grid: {
          stroke: isDark ? '#374151' : '#E5E7EB',
          strokeWidth: 0.5,
          strokeDasharray: '0',
        },
        axis: {
          stroke: 'transparent',
        },
      },
    },
  };
  
  if (isLoading && habits.length === 0) {
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
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={tintColor}
        />
      }
    >
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>Statistiken</ThemedText>
        <ThemedText style={styles.subtitle}>
          Deine Fortschritte im Überblick
        </ThemedText>
      </ThemedView>
      
      {/* Übersichtskarten */}
      <View style={styles.statsGrid}>
        <Card style={[styles.statCard, { backgroundColor: isDark ? '#1F2937' : 'white' }]}>
          <View style={[styles.statIconContainer, { backgroundColor: `${tintColor}15` }]}>
            <MaterialIcons name="check-circle" size={24} color={tintColor} />
          </View>
          <ThemedText style={styles.statValue}>{completedToday}/{habits.length}</ThemedText>
          <ThemedText style={styles.statLabel}>Heute erledigt</ThemedText>
        </Card>
        
        <Card style={[styles.statCard, { backgroundColor: isDark ? '#1F2937' : 'white' }]}>
          <View style={[styles.statIconContainer, { backgroundColor: '#FFB80015' }]}>
            <MaterialIcons name="local-fire-department" size={24} color="#FFB800" />
          </View>
          <ThemedText style={styles.statValue}>{activeStreaks}</ThemedText>
          <ThemedText style={styles.statLabel}>Aktive Serien</ThemedText>
        </Card>
        
        <Card style={[styles.statCard, { backgroundColor: isDark ? '#1F2937' : 'white' }]}>
          <View style={[styles.statIconContainer, { backgroundColor: '#FF634715' }]}>
            <MaterialIcons name="trending-up" size={24} color="#FF6347" />
          </View>
          <ThemedText style={styles.statValue}>{longestStreak}</ThemedText>
          <ThemedText style={styles.statLabel}>Längste Serie</ThemedText>
        </Card>
        
        <Card style={[styles.statCard, { backgroundColor: isDark ? '#1F2937' : 'white' }]}>
          <View style={[styles.statIconContainer, { backgroundColor: '#9333EA15' }]}>
            <MaterialIcons name="percent" size={24} color="#9333EA" />
          </View>
          <ThemedText style={styles.statValue}>{progressPercentage}%</ThemedText>
          <ThemedText style={styles.statLabel}>Erfolgsrate</ThemedText>
        </Card>
      </View>
      
      {/* Wöchentlicher Fortschritt - Balkendiagramm */}
      <Card style={[styles.chartCard, { backgroundColor: isDark ? '#1F2937' : 'white' }]}>
        <ThemedText style={styles.chartTitle}>Wöchentlicher Fortschritt</ThemedText>
        <View style={styles.chartContainer}>
          <Svg>
            <VictoryChart
              width={chartWidth}
              height={220}
              padding={{ left: 45, right: 25, top: 20, bottom: 50 }}
              domainPadding={{ x: 20 }}
              theme={VictoryTheme.material}
            >
              <VictoryAxis
                dependentAxis
                style={chartTheme.axis.style}
                tickFormat={(t) => `${t}`}
              />
              <VictoryAxis
                style={chartTheme.axis.style}
              />
              <VictoryBar
                data={weeklyData}
                style={{
                  data: { 
                    fill: tintColor,
                    width: 30,
                  },
                }}
                cornerRadius={{ top: 6 }}
                animate={{
                  duration: 1000,
                  onLoad: { duration: 500 }
                }}
              />
            </VictoryChart>
          </Svg>
        </View>
      </Card>
      
      {/* 30-Tage Trend - Liniendiagramm mit Gradient */}
      <Card style={[styles.chartCard, { backgroundColor: isDark ? '#1F2937' : 'white' }]}>
        <ThemedText style={styles.chartTitle}>30-Tage Trend</ThemedText>
        <View style={styles.chartContainer}>
          <Svg>
            <Defs>
              <LinearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={tintColor} stopOpacity="0.3" />
                <Stop offset="100%" stopColor={tintColor} stopOpacity="0.05" />
              </LinearGradient>
            </Defs>
            <VictoryChart
              width={chartWidth}
              height={220}
              padding={{ left: 45, right: 25, top: 20, bottom: 50 }}
              theme={VictoryTheme.material}
            >
              <VictoryAxis
                dependentAxis
                style={chartTheme.axis.style}
                tickFormat={(t) => `${t}%`}
                domain={[0, 100]}
              />
              <VictoryAxis
                style={chartTheme.axis.style}
                tickFormat={(x) => x % 5 === 0 ? `${x}` : ''}
              />
              <VictoryArea
                data={monthlyProgress}
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
                data={monthlyProgress}
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
      
      {/* Habit-Liste mit individuellen Stats */}
      <ThemedView style={styles.habitsSection}>
        <ThemedText style={styles.sectionTitle}>Gewohnheiten im Detail</ThemedText>
        {habitsWithStreaks.map(habit => (
          <TouchableOpacity
            key={habit.id}
            onPress={() => navigateToHabitDetail(habit.id!)}
            activeOpacity={0.7}
          >
            <Card style={[styles.habitStatCard, { backgroundColor: isDark ? '#1F2937' : 'white' }]}>
              <View style={styles.habitStatContent}>
                <View style={styles.habitInfo}>
                  <ThemedText style={styles.habitName}>{habit.name}</ThemedText>
                  <View style={styles.habitStats}>
                    {habit.completedToday && (
                      <View style={[styles.badge, { backgroundColor: `${tintColor}15` }]}>
                        <MaterialIcons name="check" size={14} color={tintColor} />
                        <ThemedText style={[styles.badgeText, { color: tintColor }]}>
                          Heute erledigt
                        </ThemedText>
                      </View>
                    )}
                    {habit.streak > 0 && (
                      <View style={[styles.badge, { backgroundColor: '#FFB80015' }]}>
                        <MaterialIcons name="local-fire-department" size={14} color="#FFB800" />
                        <ThemedText style={[styles.badgeText, { color: '#FFB800' }]}>
                          {habit.streak} Tage
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#999" />
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ThemedView>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
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
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
  chartCard: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    marginHorizontal: -10,
  },
  habitsSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  habitStatCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  habitStatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  habitStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
});