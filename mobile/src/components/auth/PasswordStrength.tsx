// src/components/auth/PasswordStrength.tsx
// Usage: <PasswordStrength password={pw} />

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface PasswordStrengthProps {
  password: string;
}

interface StrengthResult {
  score: number;     // 0..4
  label: string;
  colorKey: 'danger' | 'warning' | 'info' | 'success';
}

const analyze = (pw: string): StrengthResult => {
  let score = 0;
  if (pw.length >= 8)            score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const map: StrengthResult[] = [
    { score: 0, label: '',       colorKey: 'danger' },
    { score: 1, label: 'Weak',   colorKey: 'danger' },
    { score: 2, label: 'Fair',   colorKey: 'warning' },
    { score: 3, label: 'Good',   colorKey: 'info' },
    { score: 4, label: 'Strong', colorKey: 'success' },
  ];
  return map[score];
};

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const { colors: c, spacing } = useTheme();
  const { score, label, colorKey } = useMemo(() => analyze(password), [password]);

  if (!password) return null;

  const activeColor = c[colorKey];

  return (
    <View style={[styles.container, { marginBottom: spacing.sm }]}>
      <View style={styles.bars}>
        {[1, 2, 3, 4].map(bar => (
          <View
            key={bar}
            style={[
              styles.bar,
              {
                backgroundColor: bar <= score ? activeColor : c.border,
              },
            ]}
          />
        ))}
      </View>
      {label ? (
        <Text style={[styles.label, { color: activeColor }]}>
          {label} password
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: -4,
  },
  bars: {
    flexDirection: 'row',
    gap: 4,
  },
  bar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 5,
  },
});

export default PasswordStrength;