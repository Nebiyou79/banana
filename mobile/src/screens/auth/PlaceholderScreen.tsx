import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useThemeStore } from '../../store/themeStore';

/**
 * Placeholder screen used by all navigators until real screens are built.
 * Displays the route name so you can confirm navigation is working.
 */
export const PlaceholderScreen: React.FC = () => {
  const route = useRoute();
  const { theme } = useThemeStore();
  const { colors, typography } = theme;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.emoji]}>🍌</Text>
      <Text style={[styles.title, { color: colors.text, fontSize: typography['2xl'] }]}>
        {route.name}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textMuted, fontSize: typography.base }]}>
        Coming soon — replace with real screen
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
});
