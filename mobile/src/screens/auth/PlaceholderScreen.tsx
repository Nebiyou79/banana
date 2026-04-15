// src/screens/PlaceholderScreen.tsx
// Drop-in placeholder for any unbuilt screen.

import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute }     from '@react-navigation/native';
import { useTheme }     from '../../hooks/useTheme';

export const PlaceholderScreen: React.FC = () => {
  const route = useRoute();
  const { colors, type, spacing, isDark } = useTheme();

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bgPrimary }]}
      edges={['top', 'bottom']}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.content, { padding: spacing.screen }]}>
        <Text style={styles.emoji}>🍌</Text>
        <Text style={[type.h2, { color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm }]}>
          {route.name}
        </Text>
        <Text style={[type.body, { color: colors.textMuted, textAlign: 'center' }]}>
          Coming soon — replace this with the real screen.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emoji:   { fontSize: 64, marginBottom: 8 },
});

export default PlaceholderScreen;
