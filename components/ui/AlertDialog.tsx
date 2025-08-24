// === Alert Dialog Component ===
// Zweck: Bestätigungsdialoge und wichtige Aktionen für React Native
// Features: Customizable, Theme-aware, Action/Cancel Buttons

import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  StyleSheet, 
  TouchableOpacity,
  TouchableWithoutFeedback,
  ViewStyle 
} from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { Button } from './Button';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface AlertDialogProps {
  children: React.ReactNode;
}

interface AlertDialogTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

interface AlertDialogContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface AlertDialogHeaderProps {
  children: React.ReactNode;
}

interface AlertDialogFooterProps {
  children: React.ReactNode;
}

interface AlertDialogTitleProps {
  children: React.ReactNode;
}

interface AlertDialogDescriptionProps {
  children: React.ReactNode;
}

interface AlertDialogActionProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'destructive';
}

interface AlertDialogCancelProps {
  children: React.ReactNode;
  onPress?: () => void;
}

// Context für AlertDialog State Management
const AlertDialogContext = React.createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}>({
  isOpen: false,
  setIsOpen: () => {},
});

// Main AlertDialog Component
const AlertDialog: React.FC<AlertDialogProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AlertDialogContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
};

// AlertDialog Trigger
const AlertDialogTrigger: React.FC<AlertDialogTriggerProps> = ({ 
  asChild, 
  children 
}) => {
  const { setIsOpen } = React.useContext(AlertDialogContext);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onPress: () => {
        setIsOpen(true);
        if (children.props.onPress) {
          children.props.onPress();
        }
      },
    });
  }

  return (
    <TouchableOpacity onPress={() => setIsOpen(true)}>
      {children}
    </TouchableOpacity>
  );
};

// AlertDialog Content
const AlertDialogContent: React.FC<AlertDialogContentProps> = ({ 
  children, 
  style 
}) => {
  const { isOpen, setIsOpen } = React.useContext(AlertDialogContext);
  const colorScheme = useColorScheme();

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setIsOpen(false)}
    >
      <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <ThemedView style={[
              styles.content,
              { backgroundColor: Colors[colorScheme ?? 'light'].background },
              style
            ]}>
              {children}
            </ThemedView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// AlertDialog Header
const AlertDialogHeader: React.FC<AlertDialogHeaderProps> = ({ children }) => {
  return (
    <View style={styles.header}>
      {children}
    </View>
  );
};

// AlertDialog Footer
const AlertDialogFooter: React.FC<AlertDialogFooterProps> = ({ children }) => {
  return (
    <View style={styles.footer}>
      {children}
    </View>
  );
};

// AlertDialog Title
const AlertDialogTitle: React.FC<AlertDialogTitleProps> = ({ children }) => {
  return (
    <ThemedText style={styles.title}>
      {children}
    </ThemedText>
  );
};

// AlertDialog Description
const AlertDialogDescription: React.FC<AlertDialogDescriptionProps> = ({ children }) => {
  return (
    <ThemedText style={styles.description}>
      {children}
    </ThemedText>
  );
};

// AlertDialog Action Button
const AlertDialogAction: React.FC<AlertDialogActionProps> = ({ 
  children, 
  onPress,
  variant = 'default'
}) => {
  const { setIsOpen } = React.useContext(AlertDialogContext);

  const handlePress = () => {
    if (onPress) onPress();
    setIsOpen(false);
  };

  return (
    <Button 
      onPress={handlePress}
      variant={variant}
      style={styles.actionButton}
    >
      {children}
    </Button>
  );
};

// AlertDialog Cancel Button
const AlertDialogCancel: React.FC<AlertDialogCancelProps> = ({ 
  children, 
  onPress 
}) => {
  const { setIsOpen } = React.useContext(AlertDialogContext);

  const handlePress = () => {
    if (onPress) onPress();
    setIsOpen(false);
  };

  return (
    <Button 
      onPress={handlePress}
      variant="outline"
      style={styles.cancelButton}
    >
      {children}
    </Button>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    borderRadius: 14,
    padding: 20,
    maxWidth: 340,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 22,
    fontFamily: 'System',
  },
  description: {
    fontSize: 14,
    lineHeight: 19,
    opacity: 0.75,
    fontFamily: 'System',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
});

// Export all components
export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};