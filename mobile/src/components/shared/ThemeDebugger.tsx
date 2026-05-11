// src/components/shared/ThemeDebugger.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/themeStores';
import { useTheme } from '../../hooks/useTheme';

export const ThemeDebugger: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { theme } = useThemeStore();

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.bgCard,
      borderColor: colors.primary + '40',
    }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Theme Debug
      </Text>
      
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.textMuted }]}>
          Mode:
        </Text>
        <Text style={[styles.value, { color: colors.primary }]}>
          {theme.mode} {isDark ? '🌙' : '☀️'}
        </Text>
      </View>
      
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.textMuted }]}>
          Background:
        </Text>
        <Text style={[styles.value, { color: colors.text }]}>
          {colors.bg}
        </Text>
      </View>
      
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.textMuted }]}>
          Text:
        </Text>
        <Text style={[styles.value, { color: colors.text }]}>
          {colors.text}
        </Text>
      </View>
      
      <View style={[styles.indicator, { 
        backgroundColor: isDark ? colors.bg : colors.primary 
      }]}>
        <Text style={{ color: isDark ? colors.text : '#FFFFFF', fontWeight: '700' }}>
          {isDark ? 'DARK MODE' : 'LIGHT MODE'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 200,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  indicator: {
    marginTop: 12,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
});