import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/themeStore';

export const SocialAuthButtons: React.FC = () => {
  const { theme } = useThemeStore();

  const buttons = [
    { icon: '🔵', label: 'Continue with Google' },
    { icon: '⚫', label: 'Continue with Apple' },
  ];

  return (
    <View style={styles.container}>
      {buttons.map((btn) => (
        <TouchableOpacity
          key={btn.label}
          disabled
          style={[styles.button, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
        >
          <Text style={styles.icon}>{btn.icon}</Text>
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>{btn.label}</Text>
          <View style={[styles.badge, { backgroundColor: theme.colors.warningLight }]}>
            <Text style={[styles.badgeText, { color: theme.colors.warning }]}>Soon</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 10 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    opacity: 0.6,
  },
  icon: { fontSize: 18, marginRight: 10 },
  label: { flex: 1, fontSize: 15, fontWeight: '500' },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
});