import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/themeStore';

interface PasswordStrengthProps {
  password: string;
}

const getStrength = (pw: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const map = [
    { label: '', color: '#E2E8F0' },
    { label: 'Weak', color: '#DC2626' },
    { label: 'Fair', color: '#D97706' },
    { label: 'Good', color: '#2563EB' },
    { label: 'Strong', color: '#059669' },
  ];
  return { score, ...map[score] };
};

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const { theme } = useThemeStore();
  const { score, label, color } = useMemo(() => getStrength(password), [password]);

  if (!password) return null;

  return (
    <View style={styles.container}>
      <View style={styles.bars}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              styles.bar,
              { backgroundColor: i <= score ? color : theme.colors.skeleton },
            ]}
          />
        ))}
      </View>
      {label ? (
        <Text style={[styles.label, { color }]}>{label}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    gap: 6,
  },
  bars: {
    flexDirection: 'row',
    gap: 4,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 99,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});