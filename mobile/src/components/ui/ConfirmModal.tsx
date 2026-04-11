import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Pressable,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type ConfirmVariant = 'default' | 'danger' | 'warning' | 'success';

interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  /** Prevent closing by tapping the backdrop */
  dismissable?: boolean;
  /** Custom icon name from Ionicons */
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

// ─── Variant config ───────────────────────────────────────────────────────────

const VARIANT_CONFIG: Record<
  ConfirmVariant,
  { icon: keyof typeof Ionicons.glyphMap; color: string; lightColor: string }
> = {
  default: {
    icon: 'help-circle-outline',
    color: '#2563EB',
    lightColor: '#DBEAFE',
  },
  danger: {
    icon: 'trash-outline',
    color: '#DC2626',
    lightColor: '#FEE2E2',
  },
  warning: {
    icon: 'warning-outline',
    color: '#D97706',
    lightColor: '#FEF3C7',
  },
  success: {
    icon: 'checkmark-circle-outline',
    color: '#059669',
    lightColor: '#D1FAE5',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
  dismissable = true,
  icon,
  style,
}) => {
  const { theme } = useThemeStore();
  const cfg = VARIANT_CONFIG[variant];
  const resolvedIcon = icon ?? cfg.icon;

  // Animations
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 20,
          bounciness: 8,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 20,
          bounciness: 8,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.88,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 24,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismissable ? onClose : undefined}
    >
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          { opacity: backdropAnim },
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={dismissable && !loading ? onClose : undefined}
        />
      </Animated.View>

      {/* Sheet */}
      <View style={styles.centeredView} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              transform: [{ scale: scaleAnim }, { translateY }],
            },
            theme.shadows.lg,
            style,
          ]}
        >
          {/* Icon circle */}
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: cfg.lightColor },
            ]}
          >
            <Ionicons name={resolvedIcon} size={28} color={cfg.color} />
          </View>

          {/* Text */}
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {title}
          </Text>
          {message && (
            <Text style={[styles.message, { color: theme.colors.textMuted }]}>
              {message}
            </Text>
          )}

          {/* Divider */}
          <View
            style={[styles.divider, { backgroundColor: theme.colors.border }]}
          />

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              onPress={onClose}
              disabled={loading}
              activeOpacity={0.75}
              style={[
                styles.button,
                styles.cancelButton,
                {
                  backgroundColor: theme.colors.borderLight,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[styles.cancelText, { color: theme.colors.textSecondary }]}
              >
                {cancelLabel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.8}
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: cfg.color },
                loading && styles.buttonLoading,
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  centeredView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },

  // Icon
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  // Text
  title: {
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 4,
  },

  // Divider
  divider: {
    height: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: 20,
  },

  // Buttons
  buttons: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {},
  buttonLoading: {
    opacity: 0.8,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  confirmText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
