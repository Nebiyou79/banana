// src/components/ui/ConfirmModal.tsx
// Usage: <ConfirmModal visible={show} onClose={close} onConfirm={del} title="Delete post?" destructive />

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Animated,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Button } from './Button';

interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
}) => {
  const { colors: c, radius, spacing, type, shadows } = useTheme();
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 8 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.88, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 20, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={!loading ? onClose : undefined}
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={!loading ? onClose : undefined}
        />
      </Animated.View>

      {/* Sheet */}
      <View style={styles.centeredView} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: c.bgElevated,
              borderRadius: radius.xl,
              padding: spacing.xl,
              transform: [{ scale: scaleAnim }, { translateY }],
              ...shadows.md,
            },
          ]}
        >
          <Text style={[type.h2, { color: c.text, marginBottom: 8 }]}>
            {title}
          </Text>
          {message && (
            <Text style={[type.body, { color: c.textSecondary, marginBottom: 20 }]}>
              {message}
            </Text>
          )}

          <View style={styles.buttons}>
            <Button
              label={cancelLabel}
              onPress={onClose}
              variant="outline"
              size="md"
              disabled={loading}
              style={styles.btn}
            />
            <Button
              label={confirmLabel}
              onPress={onConfirm}
              variant={destructive ? 'danger' : 'filled'}
              size="md"
              loading={loading}
              style={styles.btn}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

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
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
  },
});

export default ConfirmModal;