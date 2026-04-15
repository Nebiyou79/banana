// src/components/auth/PasswordStrength.tsx
// Usage: <PasswordStrength password={watchedPassword} />

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useThemes';

interface PasswordStrengthProps {
  password: string;
}

interface StrengthResult {
  score: number;
  label: string;
  color: string;
}

const analyze = (pw: string): StrengthResult => {
  let score = 0;
  if (pw.length >= 8)            score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const map: StrengthResult[] = [
    { score: 0, label: '',       color: '' },
    { score: 1, label: 'Weak',   color: '#EF4444' },
    { score: 2, label: 'Fair',   color: '#F59E0B' },
    { score: 3, label: 'Good',   color: '#3B82F6' },
    { score: 4, label: 'Strong', color: '#10B981' },
  ];
  return map[score];
};

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const { colors, type, spacing } = useTheme();
  const { score, label, color }   = useMemo(() => analyze(password), [password]);

  if (!password) return null;

  return (
    <View style={[styles.container, { marginTop: spacing.sm }]}>
      <View style={styles.bars}>
        {[1, 2, 3, 4].map((bar) => (
          <View
            key={bar}
            style={[
              styles.bar,
              {
                backgroundColor: bar <= score ? color : colors.borderPrimary,
                borderRadius:    999,
              },
            ]}
          />
        ))}
      </View>
      {label ? (
        <Text style={[type.caption, { color, marginTop: 4 }]}>
          {label} password
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  bars: {
    flexDirection: 'row',
    gap:           4,
  },
  bar: {
    flex:   1,
    height: 4,
  },
});

export default PasswordStrength;