// === App Root Redirect ===
// Zweck: Root route leitet automatisch zu Tabs weiter

import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(tabs)" />;
}