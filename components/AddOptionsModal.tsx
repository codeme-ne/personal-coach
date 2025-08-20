import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  Dimensions,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface AddOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onAddHabit: () => void;
  onStartChat: () => void;
}

export function AddOptionsModal({ visible, onClose, onAddHabit, onStartChat }: AddOptionsModalProps) {
  const colorScheme = useColorScheme();
  const primaryColor = Colors[colorScheme ?? 'light'].tint;

  const handleAddHabit = () => {
    onClose();
    onAddHabit();
  };

  const handleStartChat = () => {
    onClose();
    onStartChat();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        
        <ThemedView style={styles.modalContainer}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>Was möchtest du tun?</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsContainer}>
            {/* Add Habit Option */}
            <TouchableOpacity
              style={[styles.optionButton, { borderColor: primaryColor }]}
              onPress={handleAddHabit}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: primaryColor + '20' }]}>
                <MaterialIcons name="add-task" size={32} color={primaryColor} />
              </View>
              <View style={styles.optionContent}>
                <ThemedText style={styles.optionTitle}>Gewohnheit hinzufügen</ThemedText>
                <ThemedText style={styles.optionDescription}>
                  Erstelle eine neue Gewohnheit, die du täglich verfolgen möchtest
                </ThemedText>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#999" />
            </TouchableOpacity>

            {/* Start Chat Option */}
            <TouchableOpacity
              style={[styles.optionButton, { borderColor: '#34C759' }]}
              onPress={handleStartChat}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#34C759' + '20' }]}>
                <MaterialIcons name="chat" size={32} color="#34C759" />
              </View>
              <View style={styles.optionContent}>
                <ThemedText style={styles.optionTitle}>ChatCoach beginnen</ThemedText>
                <ThemedText style={styles.optionDescription}>
                  Spreche mit deinem persönlichen Coach über deine Gewohnheiten
                </ThemedText>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#999" />
            </TouchableOpacity>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 0,
    maxHeight: height * 0.7,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
