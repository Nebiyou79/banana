import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { useThemeStore } from '../../store/themeStore';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

const FONT_MAP: Record<AvatarSize, number> = {
  xs: 10,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 36,
};

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  badge?: boolean;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 'md',
  badge = false,
  style,
}) => {
  const { theme } = useThemeStore();
  const { colors } = theme;
  const dim = SIZE_MAP[size];
  const fontSize = FONT_MAP[size];

  const initials = name
    ? name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('')
    : '?';

  return (
    <View style={[{ width: dim, height: dim }, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, { width: dim, height: dim, borderRadius: dim / 2 }]}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: dim,
              height: dim,
              borderRadius: dim / 2,
              backgroundColor: colors.primaryLight,
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize, color: colors.primary }]}>
            {initials}
          </Text>
        </View>
      )}
      {badge && (
        <View
          style={[
            styles.badge,
            { backgroundColor: colors.success, borderColor: colors.card },
            badgeSize(size),
          ]}
        />
      )}
    </View>
  );
};

const badgeSize = (size: AvatarSize) => {
  const d = Math.max(8, SIZE_MAP[size] * 0.22);
  return {
    width: d,
    height: d,
    borderRadius: d / 2,
    bottom: 1,
    right: 1,
  };
};

const styles = StyleSheet.create({
  image: {},
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontWeight: '700' },
  badge: {
    position: 'absolute',
    borderWidth: 2,
  },
});