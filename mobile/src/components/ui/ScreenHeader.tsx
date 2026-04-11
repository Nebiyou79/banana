import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ViewStyle,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  /** Show a back arrow (default true when canGoBack) */
  showBack?: boolean;
  onBackPress?: () => void;
  /** Up to 3 right-side action icons */
  actions?: HeaderAction[];
  /** Render arbitrary content in the right zone (overrides actions) */
  rightContent?: React.ReactNode;
  /** Render content below the title row */
  bottomContent?: React.ReactNode;
  style?: ViewStyle;
  /** 'default' = opaque surface, 'transparent' = no bg (use over images) */
  variant?: 'default' | 'transparent';
  /** Center the title (default true) */
  centerTitle?: boolean;
  /** Show a bottom border/shadow */
  bordered?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  showBack,
  onBackPress,
  actions = [],
  rightContent,
  bottomContent,
  style,
  variant = 'default',
  centerTitle = true,
  bordered = true,
}) => {
  const { theme } = useThemeStore();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const canGoBack = navigation.canGoBack();
  const shouldShowBack = showBack ?? canGoBack;

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (canGoBack) {
      navigation.goBack();
    }
  };

  const isTransparent = variant === 'transparent';
  const paddingTop = insets.top + (Platform.OS === 'android' ? 4 : 0);

  return (
    <View
      style={[
        styles.wrapper,
        { paddingTop, backgroundColor: isTransparent ? 'transparent' : theme.colors.surface },
        bordered && !isTransparent && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border,
          ...theme.shadows.sm,
        },
        style,
      ]}
    >
      {/* Main row */}
      <View style={styles.row}>
        {/* Left zone — back button or spacer */}
        <View style={styles.sideZone}>
          {shouldShowBack && (
            <TouchableOpacity
              onPress={handleBack}
              hitSlop={8}
              activeOpacity={0.7}
              style={[styles.backButton, { backgroundColor: theme.colors.borderLight }]}
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Center — title */}
        <View style={[styles.titleZone, !centerTitle && styles.titleZoneLeft]}>
          <Text
            style={[
              styles.title,
              { color: theme.colors.text },
              !centerTitle && styles.titleLeft,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[styles.subtitle, { color: theme.colors.textMuted }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right zone — actions or custom content */}
        <View style={[styles.sideZone, styles.rightZone]}>
          {rightContent ?? (
            actions.slice(0, 3).map((action, i) => (
              <ActionButton key={i} action={action} />
            ))
          )}
        </View>
      </View>

      {/* Optional bottom slot (search bar, tabs, etc.) */}
      {bottomContent && (
        <View style={styles.bottomSlot}>{bottomContent}</View>
      )}
    </View>
  );
};

// ─── Action button with optional badge ───────────────────────────────────────

const ActionButton: React.FC<{ action: HeaderAction }> = ({ action }) => {
  const { theme } = useThemeStore();

  return (
    <TouchableOpacity
      onPress={action.onPress}
      disabled={action.disabled}
      hitSlop={8}
      activeOpacity={0.7}
      style={[
        styles.actionButton,
        { backgroundColor: theme.colors.borderLight },
        action.disabled && styles.actionDisabled,
      ]}
      accessibilityLabel={action.label}
    >
      <Ionicons name={action.icon} size={20} color={theme.colors.text} />
      {action.badge !== undefined && action.badge > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
          <Text style={styles.badgeText}>
            {action.badge > 99 ? '99+' : action.badge}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },

  // Left / right zones — same width keeps title centred
  sideZone: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightZone: {
    justifyContent: 'flex-end',
    gap: 6,
  },

  // Title
  titleZone: {
    flex: 1,
    alignItems: 'center',
  },
  titleZoneLeft: {
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  titleLeft: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },

  // Back button
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Action buttons
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  actionDisabled: {
    opacity: 0.4,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },

  // Bottom slot
  bottomSlot: {
    marginTop: 10,
  },
});
