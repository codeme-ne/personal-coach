import { StyleSheet, ScrollView, TouchableOpacity, View, Switch } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useState } from 'react';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(colorScheme === 'dark');

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showSwitch = false, 
    switchValue = false,
    onSwitchChange 
  }: any) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      activeOpacity={showSwitch ? 1 : 0.7}
    >
      <View style={styles.settingItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }]}>
          <IconSymbol name={icon} size={24} color={Colors[colorScheme ?? 'light'].tint} />
        </View>
        <View style={styles.settingTextContainer}>
          <ThemedText style={styles.settingTitle}>{title}</ThemedText>
          {subtitle && <ThemedText style={styles.settingSubtitle}>{subtitle}</ThemedText>}
        </View>
      </View>
      {showSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: '#D1D1D6', true: Colors[colorScheme ?? 'light'].tint }}
          thumbColor="#FFFFFF"
        />
      ) : (
        <IconSymbol name="chevron.right" size={20} color="#C7C7CC" />
      )}
    </TouchableOpacity>
  );

  const SettingSection = ({ title, children }: any) => (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      <ThemedView style={styles.sectionContent}>
        {children}
      </ThemedView>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>Settings</ThemedText>
      </ThemedView>

      <SettingSection title="PREFERENCES">
        <SettingItem
          icon="bell"
          title="Notifications"
          subtitle="Daily reminders for your habits"
          showSwitch
          switchValue={notificationsEnabled}
          onSwitchChange={setNotificationsEnabled}
        />
        <View style={styles.separator} />
        <SettingItem
          icon="moon"
          title="Dark Mode"
          subtitle="Toggle dark theme"
          showSwitch
          switchValue={darkModeEnabled}
          onSwitchChange={setDarkModeEnabled}
        />
      </SettingSection>

      <SettingSection title="HABITS">
        <SettingItem
          icon="clock"
          title="Default Reminder Time"
          subtitle="9:00 AM"
          onPress={() => {}}
        />
        <View style={styles.separator} />
        <SettingItem
          icon="archivebox"
          title="Archived Habits"
          subtitle="View and restore archived habits"
          onPress={() => {}}
        />
        <View style={styles.separator} />
        <SettingItem
          icon="chart.bar"
          title="Statistics"
          subtitle="View your progress and insights"
          onPress={() => {}}
        />
      </SettingSection>

      <SettingSection title="DATA">
        <SettingItem
          icon="arrow.down.circle"
          title="Export Data"
          subtitle="Download your habit data"
          onPress={() => {}}
        />
        <View style={styles.separator} />
        <SettingItem
          icon="arrow.up.circle"
          title="Import Data"
          subtitle="Restore from backup"
          onPress={() => {}}
        />
        <View style={styles.separator} />
        <SettingItem
          icon="trash"
          title="Clear All Data"
          subtitle="Delete all habits and history"
          onPress={() => {}}
        />
      </SettingSection>


      <SettingSection title="ABOUT">
        <SettingItem
          icon="questionmark.circle"
          title="Help & Support"
          subtitle="Get help and contact support"
          onPress={() => {}}
        />
        <View style={styles.separator} />
        <SettingItem
          icon="doc.text"
          title="Privacy Policy"
          subtitle="Learn how we protect your data"
          onPress={() => {}}
        />
        <View style={styles.separator} />
        <SettingItem
          icon="star"
          title="Rate App"
          subtitle="Share your feedback"
          onPress={() => {}}
        />
        <View style={styles.separator} />
        <SettingItem
          icon="info.circle"
          title="Version"
          subtitle="1.0.0"
          onPress={() => {}}
        />
      </SettingSection>

      <View style={styles.footer}>
        <ThemedText style={styles.footerText}>Personal Coach</ThemedText>
        <ThemedText style={styles.footerSubtext}>Build better habits, one day at a time</ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  section: {
    marginTop: 35,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6E6E73',
    marginLeft: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 58,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000000',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  separator: {
    height: 0.5,
    backgroundColor: '#E5E5EA',
    marginLeft: 64,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
  },
});