import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/themeStore';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  title,
  subtitle,
  showLogo = true,
}) => {
  const { theme } = useThemeStore();
  const { colors, typography } = theme;

  return (
    <View style={styles.container}>
      {showLogo && <Text style={styles.logo}>🍌</Text>}
      <Text style={[styles.title, { color: colors.text, fontSize: typography['3xl'] }]}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textMuted, fontSize: typography.base }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginBottom: 32 },
  logo:      { fontSize: 52, marginBottom: 12 },
  title:     { fontWeight: '800', textAlign: 'center', letterSpacing: -0.5, marginBottom: 8 },
  subtitle:  { textAlign: 'center', lineHeight: 22, paddingHorizontal: 16 },
});