// ScreenHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ViewStyle, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface HeaderAction {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  badge?: number;
  label?: string;
  disabled?: boolean;
}

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  actions?: HeaderAction[];
  rightContent?: React.ReactNode;
  bottomContent?: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'transparent';
  centerTitle?: boolean;
  bordered?: boolean;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title, subtitle, showBack, onBackPress, actions = [], rightContent,
  bottomContent, style, variant = 'default', centerTitle = true, bordered = true,
}) => {
  const { colors, shadows, radius, type, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const canGoBack = navigation.canGoBack();
  const shouldShowBack = showBack ?? canGoBack;

  const handleBack = () => {
    if (onBackPress) onBackPress();
    else if (canGoBack) navigation.goBack();
  };

  const isTransparent = variant === 'transparent';
  const paddingTop = insets.top + (Platform.OS === 'android' ? 4 : 0);

  return (
    <View
      style={[
        styles.wrapper,
        { paddingTop, backgroundColor: isTransparent ? 'transparent' : colors.bgCard },
        bordered && !isTransparent && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderPrimary, ...shadows.sm },
        style,
      ]}
    >
      <View style={styles.row}>
        <View style={styles.sideZone}>
          {shouldShowBack && (
            <TouchableOpacity onPress={handleBack} hitSlop={8} activeOpacity={0.7} style={[styles.backButton, { backgroundColor: colors.bgSecondary, borderRadius: radius.md }]}>
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.titleZone, !centerTitle && styles.titleZoneLeft]}>
          <Text style={[styles.title, type.h4, { color: colors.textPrimary }, !centerTitle && styles.titleLeft]} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={[styles.subtitle, type.caption, { color: colors.textMuted }]} numberOfLines={1}>{subtitle}</Text>}
        </View>

        <View style={[styles.sideZone, styles.rightZone]}>
          {rightContent ?? actions.slice(0, 3).map((action, i) => <ActionButton key={i} action={action} />)}
        </View>
      </View>

      {bottomContent && <View style={styles.bottomSlot}>{bottomContent}</View>}
    </View>
  );
};

const ActionButton: React.FC<{ action: HeaderAction }> = ({ action }) => {
  const { colors, radius } = useTheme();

  return (
    <TouchableOpacity
      onPress={action.onPress}
      disabled={action.disabled}
      hitSlop={8}
      activeOpacity={0.7}
      style={[styles.actionButton, { backgroundColor: colors.bgSecondary, borderRadius: radius.md }, action.disabled && styles.actionDisabled]}
      accessibilityLabel={action.label}
    >
      <Ionicons name={action.icon} size={20} color={colors.textPrimary} />
      {action.badge !== undefined && action.badge > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.error, borderRadius: radius.full }]}>
          <Text style={styles.badgeText}>{action.badge > 99 ? '99+' : action.badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 16, paddingBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 48 },
  sideZone: { width: 80, flexDirection: 'row', alignItems: 'center' },
  rightZone: { justifyContent: 'flex-end', gap: 6 },
  titleZone: { flex: 1, alignItems: 'center' },
  titleZoneLeft: { alignItems: 'flex-start', paddingLeft: 4 },
  title: { fontWeight: '700' },
  titleLeft: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { marginTop: 1 },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  actionButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  actionDisabled: { opacity: 0.4 },
  badge: { position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  bottomSlot: { marginTop: 10 },
});