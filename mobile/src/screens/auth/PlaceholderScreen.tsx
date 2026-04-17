// screens/shared/PlaceholderScreen.tsx
// Temporary screen used for all not-yet-created screens.
// Replace this component with the real screen when built.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';

export default function PlaceholderScreen() {
  const route = useRoute();
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🚧</Text>
      <Text style={styles.title}>{route.name}</Text>
      <Text style={styles.sub}>This screen is coming soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9' },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 6 },
  sub: { fontSize: 14, color: '#888' },
});
