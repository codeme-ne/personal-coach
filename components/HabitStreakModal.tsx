import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { habitService } from '../habitService';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface HabitStreakModalProps {
  visible: boolean;
  onClose: () => void;
  habitId: string;
  habitName: string;
}

interface DayData {
  date: Date;
  completed: boolean;
}

export function HabitStreakModal({ visible, onClose, habitId, habitName }: HabitStreakModalProps) {
  const [completions, setCompletions] = useState<DayData[]>([]);
  // States für Streak-Tracking entfernt, da nicht mehr benötigt
  const [loading, setLoading] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const cellSize = Math.floor((screenWidth - 120) / 7); // 7 days per row, with more spacing

  useEffect(() => {
    if (!visible || !habitId) return;

    const getDateString = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };

    const generateCalendarData = (completionData: any[]): DayData[] => {
      const today = new Date();
      const threeMonthsAgo = new Date(today);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      threeMonthsAgo.setDate(threeMonthsAgo.getDate() - threeMonthsAgo.getDay()); // Start from Sunday

      const calendarData: DayData[] = [];
      const completionDates = new Set(
        completionData.map(completion => {
          const date = completion.completedAt instanceof Date 
            ? completion.completedAt 
            : completion.completedAt.toDate();
          return getDateString(date);
        })
      );

      // Generate 90 days (approximately 3 months)
      for (let i = 0; i < 90; i++) {
        const currentDate = new Date(threeMonthsAgo);
        currentDate.setDate(threeMonthsAgo.getDate() + i);
        
        if (currentDate > today) break;

        calendarData.push({
          date: currentDate,
          completed: completionDates.has(getDateString(currentDate)),
        });
      }

      return calendarData;
    };

    const calculateStreaks = (calendarData: DayData[]) => {
      // Streak-Berechnungen entfernt, da nicht mehr benötigt
    };

    const loadStreakData = async () => {
      try {
        setLoading(true);
        const completionData = await habitService.getHabitCompletions(habitId);
        
        // Create calendar data for the last three months
        const calendarData = generateCalendarData(completionData);
        setCompletions(calendarData);
        
        // Calculate streaks
        calculateStreaks(calendarData);
      } catch (error) {
        console.error('Error loading streak data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStreakData();
  }, [visible, habitId]);

  const getIntensityColor = (completed: boolean): string => {
    if (!completed) return '#EBEDF0'; // Light gray for empty
    return '#40C463'; // GitHub green for completed
  };

  const renderCalendar = () => {
    if (completions.length === 0) return null;
    
    const rows = [];
    const daysPerRow = 7;
    
    // Split completions into rows of 7
    for (let i = 0; i < completions.length; i += daysPerRow) {
      const rowCells = [];
      const weekCompletions = completions.slice(i, i + daysPerRow);
      
      for (let j = 0; j < weekCompletions.length; j++) {
        const dayData = weekCompletions[j];
        rowCells.push(
          <View
            key={`day-${i + j}`}
            style={[
              styles.calendarCell,
              {
                backgroundColor: getIntensityColor(dayData.completed),
                width: cellSize,
                height: cellSize,
              },
            ]}
          />
        );
      }
      
      // Fill remaining cells in the last row
      const remainingCells = daysPerRow - rowCells.length;
      for (let k = 0; k < remainingCells; k++) {
        rowCells.push(
          <View
            key={`empty-${k}`}
            style={[
              styles.calendarCell,
              {
                backgroundColor: 'transparent',
                width: cellSize,
                height: cellSize,
              },
            ]}
          />
        );
      }
      
      rows.push(
        <View key={`row-${i}`} style={styles.weekRow}>
          {rowCells}
        </View>
      );

    }
    
    return (
      <View style={styles.githubCalendar}>
        {rows}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ThemedView style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <ThemedText style={styles.title}>{habitName}</ThemedText>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Calendar */}
            <View style={styles.calendarContainer}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ThemedText style={styles.loadingText}>Lade Daten...</ThemedText>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.calendarWrapper}>
                    <View style={styles.calendarWithLabels}>
                      {/* Day labels removed */}
                      {/* Calendar */}
                      {renderCalendar()}
                    </View>
                  </View>
                </ScrollView>
              )}

              {/* Legend */}
              <View style={styles.legend}>
                <ThemedText style={styles.legendText}>Weniger</ThemedText>
                <View style={styles.legendDots}>
                  <View style={[styles.legendDot, { backgroundColor: '#EBEDF0' }]} />
                  <View style={[styles.legendDot, { backgroundColor: '#C6E48B' }]} />
                  <View style={[styles.legendDot, { backgroundColor: '#7BC96F' }]} />
                  <View style={[styles.legendDot, { backgroundColor: '#40C463' }]} />
                  <View style={[styles.legendDot, { backgroundColor: '#30A14E' }]} />
                </View>
                <ThemedText style={styles.legendText}>Mehr</ThemedText>
              </View>
            </View>
          </ScrollView>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '85%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  // Streak-bezogene Styles entfernt
  calendarContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center', // Center the entire calendar
  },
  loadingContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  calendarWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarWithLabels: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabels: {
    flexDirection: 'column',
    marginRight: 10,
    justifyContent: 'space-between',
    paddingTop: 0,
  },
  dayLabel: {
    fontSize: 9,
    color: '#666',
    height: 15, // Approximate cell size + margin
    lineHeight: 15,
    textAlignVertical: 'center',
    textAlign: 'center',
  },
  dayLabelEmpty: {
    height: 15, // Same as dayLabel height
  },
  githubCalendar: {
    flexDirection: 'column',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8, // Increased vertical spacing
    justifyContent: 'center', // Center boxes horizontally
  },
  calendarCell: {
    borderRadius: 4, // More rounded corners
    marginRight: 6, // Increased horizontal spacing
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  legendDots: {
    flexDirection: 'row',
    marginHorizontal: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginHorizontal: 1,
  },
});

export default HabitStreakModal;
