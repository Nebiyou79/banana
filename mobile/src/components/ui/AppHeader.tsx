// src/components/ui/AppHeader.tsx
// Usage: <AppHeader title="Profile" showBack onBack={nav.goBack} rightAction={<Button />} />

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  transparent?: boolean;
  centerTitle?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  transparent = false,
  centerTitle = true,
}) => {
  const { colors: c, radius, spacing, type, shadows } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
          backgroundColor: transparent ? 'transparent' : c.bgCard,
        },
        !transparent && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: c.border,
          ...shadows.sm,
        },
      ]}
    >
      <StatusBar barStyle={c.bg === '#0A1628' ? 'light-content' : 'dark-content'} />

      <View style={styles.row}>
        {/* Left zone */}
        <View style={styles.sideZone}>
          {showBack && (
            <TouchableOpacity
              onPress={onBack}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[
                styles.backBtn,
                { backgroundColor: c.surface, borderRadius: radius.md },
              ]}
            >
              <Ionicons name="arrow-back" size={22} color={c.text} />
            </TouchableOpacity>
          )}
        </View>

        {/* Center */}
        <View style={[styles.center, !centerTitle && styles.centerLeft]}>
          <Text
            style={[
              type.h3,
              {
                fontWeight: '700',
                color: c.text,
                textAlign: centerTitle ? 'center' : 'left',
              },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                type.bodySm,
                {
                  color: c.textMuted,
                  textAlign: centerTitle ? 'center' : 'left',
                },
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right zone */}
        <View style={[styles.sideZone, styles.rightZone]}>
          {rightAction}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  sideZone: {
    width: 52,
  },
  rightZone: {
    alignItems: 'flex-end',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  centerLeft: {
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AppHeader;